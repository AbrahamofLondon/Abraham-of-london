/**
 * POST /api/playbooks/[slug]/run — execute a governed playbook run
 * GET  /api/playbooks/[slug]/run — retrieve the caller's runs for this playbook
 *
 * Enforcement order (fail-closed):
 *   1. identity required (resolveIdentity) — no anonymous paid runs
 *   2. slug must be a recognised playbook
 *   3. verified active entitlement required (resolveCanonicalEntitlement)
 *   4. engine executes the product-specific analysis (pure)
 *   5. run persisted BEFORE returning; persistence failure aborts the run
 *
 * Reuses the DiagnosticJourney store with diagnosticType = "playbook_run"
 * (no schema change). Failure handling returns typed HTTP codes.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import {
  assertPlaybookRunAllowed,
  executePlaybookRun,
  resolvePlaybookRun,
  PlaybookRunAuthorityError,
} from "@/lib/playbooks/playbook-run-authority";
import { PlaybookInputError } from "@/lib/playbooks/playbook-run-types";

function slugOf(req: NextApiRequest): string {
  const raw = req.query.slug;
  return Array.isArray(raw) ? String(raw[0]) : String(raw ?? "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = slugOf(req);

  // ── GET: retrieval of the caller's prior runs ──────────────────────────────
  if (req.method === "GET") {
    const config = resolvePlaybookRun(slug);
    if (!config) return res.status(404).json({ error: "Unknown playbook" });
    const identity = await resolveIdentity(req);
    if (!identity.email && !identity.subjectId) return res.status(401).json({ error: "Authentication required" });
    const runs = await prisma.diagnosticJourney.findMany({
      where: {
        diagnosticType: "playbook_run",
        email: identity.email ?? undefined,
        journeyKey: { startsWith: `playbook_${slug}_` },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { journeyKey: true, status: true, createdAt: true, mergedTensionThread: true },
    });
    return res.status(200).json({ slug, runs });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── POST: execute a run ────────────────────────────────────────────────────
  try {
    const identity = await resolveIdentity(req);
    const email = identity.email ?? null;
    const userId = identity.subjectId ?? null;

    // (1)(2) structural authority: known slug + identity present
    let config;
    try {
      config = assertPlaybookRunAllowed({ slug, userId, email });
    } catch (e) {
      if (e instanceof PlaybookRunAuthorityError) {
        const status = e.code === "UNKNOWN_PLAYBOOK" ? 404 : 401;
        return res.status(status).json({ error: e.message, code: e.code });
      }
      throw e;
    }

    // (3) verified active entitlement
    const entitlement = await resolveCanonicalEntitlement({
      userId,
      email,
      slug: config.entitlementSlug,
      tier: identity.tier ?? null,
    });
    if (!entitlement.granted || !entitlement.verified) {
      return res.status(402).json({
        error: "No verified active entitlement for this playbook.",
        code: "ENTITLEMENT_REQUIRED",
        entitlementSlug: config.entitlementSlug,
      });
    }

    // (4) execute product-specific engine (pure). Invalid input → 400.
    let result;
    try {
      result = executePlaybookRun(slug, req.body?.input ?? req.body ?? {});
    } catch (e) {
      if (e instanceof PlaybookInputError) {
        return res.status(400).json({ error: e.message, code: e.code });
      }
      throw e;
    }

    // (5) persist BEFORE returning; abandon on failure
    const runId = crypto.randomUUID();
    const journeyKey = `playbook_${slug}_${runId}`;
    const inputHash = crypto.createHash("sha256").update(JSON.stringify(req.body?.input ?? req.body ?? {})).digest("hex");
    const payload = JSON.parse(JSON.stringify({
      slug,
      code: config.code,
      runId,
      entitlementSlug: config.entitlementSlug,
      inputHash,
      result,
      completedAt: new Date().toISOString(),
    }));

    try {
      await prisma.diagnosticJourney.upsert({
        where: { journeyKey },
        create: {
          journeyKey,
          subjectKey: email ?? userId ?? runId,
          email,
          diagnosticType: "playbook_run",
          status: "completed",
          mergedTensionThread: payload,
        },
        update: { status: "completed", mergedTensionThread: payload },
      });
    } catch (persistErr) {
      console.error("[playbook-run] persistence failed — run abandoned:", persistErr);
      return res.status(500).json({ error: "Run could not be recorded; not returned.", code: "PERSISTENCE_FAILED" });
    }

    return res.status(200).json({ runId, slug, code: config.code, result });
  } catch (err) {
    console.error("[playbook-run] unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error executing playbook run." });
  }
}
