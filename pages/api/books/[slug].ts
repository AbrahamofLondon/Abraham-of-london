// pages/api/books/[slug].ts — SSOT BOOK UNLOCK (Pages Router API, NO JSX)
import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

import { getPublishedBooks, getDocBySlug, normalizeSlug } from "@/lib/content/server";

type ResponseData =
  | { ok: true; tier: AccessTier; requiredTier: AccessTier; bodyCode: string; slugResolved: string }
  | { ok: false; reason: string; tried?: string[] };

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function cleanPathish(input: unknown): string {
  return safeStr(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

/** SSOT "books bare slug" normalizer (mirrors your reader logic) */
function booksBareSlug(input: unknown): string {
  let s = cleanPathish(input);
  if (!s || s.includes("..")) return "";

  const lower = () => s.toLowerCase();

  // strip repeatedly
  while (lower().startsWith("content/")) s = s.slice("content/".length);
  while (lower().startsWith("vault/")) s = s.slice("vault/".length);
  while (lower().startsWith("books/")) s = s.slice("books/".length);

  s = cleanPathish(s);
  if (!s || s.includes("..")) return "";
  return s;
}

function extractBodyCode(doc: any): string {
  return safeStr(doc?.body?.code || doc?.bodyCode || "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });

  const raw = req.query.slug;
  const param = Array.isArray(raw) ? raw.join("/") : safeStr(raw);
  const bare = booksBareSlug(param);
  if (!bare) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  // Canonical tries (ordered)
  const tries = [
    `books/${bare}`,
    `content/books/${bare}`,
    bare,
    normalizeSlug(bare),
  ].map(cleanPathish);

  // 1) Prefer registry-based lookup
  let doc: any =
    getDocBySlug(tries[0]) ||
    getDocBySlug(tries[1]) ||
    getDocBySlug(tries[2]) ||
    getDocBySlug(tries[3]) ||
    null;

  // 2) Fallback: scan published books by matching bare slug
  if (!doc) {
    const books = getPublishedBooks() || [];
    doc =
      books.find((d: any) => {
        if (!d || d.draft) return false;
        const fp = safeStr(d?._raw?.flattenedPath || d?.slug || "");
        return booksBareSlug(fp) === bare;
      }) || null;
  }

  if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "NOT_FOUND", tried: tries });

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));

  // ✅ Public bypass
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: extractBodyCode(doc),
      slugResolved: booksBareSlug(doc?.slug || doc?._raw?.flattenedPath || bare),
    });
  }

  // ✅ Session gate
  const sessionId = getAccessCookie(req);
  if (!sessionId) return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });

  const session = await verifySession(sessionId);
  if (!session || !session.valid) return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });

  const userTier = tiers.normalizeUser(session.tier);
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: extractBodyCode(doc),
    slugResolved: booksBareSlug(doc?.slug || doc?._raw?.flattenedPath || bare),
  });
}