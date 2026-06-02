/**
 * pages/api/admin/outbound/x/reconcile.ts
 *
 * POST — Mark an X outbound post as manually published.
 *
 * Use this when a post was published outside the system (e.g. manually via the
 * X web UI) and the ledger needs to reflect the real state so the system does
 * not attempt to publish it again.
 *
 * Security:
 *  - Admin authenticated.
 *  - finalConfirmation: true required.
 *  - Does NOT call the X API — no tweet is created.
 *  - URL must be a valid x.com or twitter.com status URL.
 *  - If the item is already PUBLISHED in the ledger, returns 409.
 *  - Writes PUBLISHED with source=manual to outboundPublishLedger.
 *  - Future live publish is blocked because PUBLISHED row exists.
 *
 * Request:
 *   outboundItemId    — stable post ID (from frontmatter)
 *   assetSlug         — e.g. "outbound-x/ttif-x-dt-algorithm-01"
 *   tweetUrl          — https://x.com/{user}/status/{id}
 *   scheduledFor      — ISO string or null (needed to build idempotency key)
 *   note              — optional audit note
 *   finalConfirmation — must be true
 */

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";
import {
  isDuplicatePublish,
  claimPublishSlot,
  completePublishSlot,
} from "@/lib/outbound/core/outbound-publish-ledger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TWEET_URL_RE =
  /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+/;

function parseTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match?.[1] ?? null;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const originCheck = verifyAdminMutationOrigin(req);
  if (!originCheck.ok) {
    return res.status(403).json({ ok: false, error: originCheck.reason });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const actorId = guard.session?.user?.id ?? null;
  const actorEmailHash = hashEmail(guard.session?.user?.email);

  const body = req.body as {
    outboundItemId?: string;
    assetSlug?: string;
    tweetUrl?: string;
    scheduledFor?: string | null;
    note?: string;
    finalConfirmation?: boolean;
  };

  const { outboundItemId, assetSlug, tweetUrl, scheduledFor, note, finalConfirmation } = body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!finalConfirmation) {
    return res.status(400).json({
      ok: false,
      error: "finalConfirmation: true is required for manual reconciliation.",
    });
  }

  if (!outboundItemId?.trim()) {
    return res.status(400).json({ ok: false, error: "outboundItemId is required." });
  }

  if (!assetSlug?.trim()) {
    return res.status(400).json({ ok: false, error: "assetSlug is required." });
  }

  if (!tweetUrl?.trim() || !TWEET_URL_RE.test(tweetUrl.trim())) {
    return res.status(400).json({
      ok: false,
      error:
        "tweetUrl must be a valid x.com or twitter.com status URL (e.g. https://x.com/user/status/123456789).",
    });
  }

  const tweetId = parseTweetId(tweetUrl.trim());
  if (!tweetId) {
    return res.status(400).json({
      ok: false,
      error: "Could not extract tweet ID from tweetUrl.",
    });
  }

  // ── Duplicate check ───────────────────────────────────────────────────────
  const existing = await isDuplicatePublish("x", outboundItemId.trim(), scheduledFor ?? null);
  if (existing) {
    return res.status(409).json({
      ok: false,
      error: "This post is already marked as published in the ledger.",
      errorCode: "X_DUPLICATE_PUBLISH",
      ledgerId: existing.id,
      providerPostUrl: existing.providerPostUrl ?? null,
    });
  }

  // ── Claim slot and immediately complete as PUBLISHED ─────────────────────
  const claim = await claimPublishSlot({
    provider: "x",
    outboundItemId: outboundItemId.trim(),
    assetSlug: assetSlug.trim(),
    scheduledFor: scheduledFor ?? null,
    actorId,
    actorEmailHash,
    source: "manual",
    forceRepublishNote: note?.trim() || "Manual reconciliation — posted outside the system.",
  });

  if (!claim.claimed) {
    return res.status(409).json({
      ok: false,
      error: claim.reason ?? "Could not claim ledger slot for manual reconciliation.",
      errorCode: "LEDGER_CLAIM_FAILED",
    });
  }

  const completed = await completePublishSlot(claim.entry.id, "PUBLISHED", {
    providerPostId: tweetId,
    providerPostUrl: tweetUrl.trim(),
    safeMessage: `Manually reconciled. ${note?.trim() ?? ""}`.trim(),
  });

  return res.status(200).json({
    ok: true,
    message: "Post marked as manually published. Future system publish is now blocked.",
    ledgerId: completed.id,
    tweetId,
    tweetUrl: tweetUrl.trim(),
    source: "manual",
  });
}
