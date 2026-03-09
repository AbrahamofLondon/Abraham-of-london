// pages/api/resources/strategic-frameworks/[...slug].ts
// — Strategic Frameworks unlock proxy (nested), SSOT-backed

import type { NextApiRequest, NextApiResponse } from "next";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Ok = { ok: true; tier: AccessTier; requiredTier: AccessTier; bodyCode: string; slugResolved: string };
type Fail = { ok: false; reason: string; tried?: string[] };
type ResponseData = Ok | Fail;

function norm(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function pick(req: NextApiRequest): string {
  const raw = req.query.slug;
  const joined = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return norm(joined);
}

// Tight resource detection (prevents lexicon bleed)
function isResourceDoc(d: any): boolean {
  if (!d) return false;

  const dk = String(d?.docKind || "").toLowerCase();
  if (dk === "lexicon") return false;
  if (dk === "resource") return true;

  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const fp = String(d?._raw?.flattenedPath || d?._raw?.sourceFilePath || "").toLowerCase();
  return fp.startsWith("resources/") || fp.startsWith("content/resources/");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });

  const tail = pick(req); // e.g. "v4" or "v4/landing"
  if (!tail) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  // ✅ This endpoint is strictly under resources/strategic-frameworks/*
  // So we always resolve as that nested resource.
  const canonical = `resources/strategic-frameworks/${tail}`;
  const canonicalContent = `content/resources/strategic-frameworks/${tail}`;

  // Avoid weird double-prefix inputs
  const cleanedTail = tail.replace(/^strategic-frameworks\//i, "");
  const altA = `resources/strategic-frameworks/${cleanedTail}`;
  const altB = `content/resources/strategic-frameworks/${cleanedTail}`;

  // Also accept full incoming if caller passes "resources/..." by mistake
  const altC = tail.startsWith("resources/") ? tail : `resources/${tail}`;
  const altD = tail.startsWith("content/resources/") ? tail : `content/resources/${tail}`;

  const tries = [canonical, canonicalContent, altA, altB, altC, altD].map(norm);

  // ✅ Server-only import is safe in API route.
  const { getDocBySlug, getAllContentlayerDocs } = await import("@/lib/content/server");

  let doc: any =
    getDocBySlug(tries[0]) ||
    getDocBySlug(tries[1]) ||
    getDocBySlug(tries[2]) ||
    getDocBySlug(tries[3]) ||
    getDocBySlug(tries[4]) ||
    getDocBySlug(tries[5]) ||
    null;

  // registry scan fallback (handles your mixed slug forms)
  if (!doc) {
    const all = getAllContentlayerDocs?.() || [];
    const wanted = tries.map((t) => t.toLowerCase());
    doc =
      all.find((d: any) => {
        const a = norm(d?.slug).toLowerCase();
        const b = norm(d?._raw?.flattenedPath).toLowerCase();
        const c = norm(d?._raw?.sourceFilePath).toLowerCase();
        return wanted.includes(a) || wanted.includes(b) || wanted.includes(c);
      }) || null;
  }

  if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "NOT_FOUND", tried: tries });
  if (!isResourceDoc(doc)) return res.status(404).json({ ok: false, reason: "NOT_A_RESOURCE", tried: tries });

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));

  // public bypass
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: doc.body?.code || doc.bodyCode || "",
      slugResolved: norm(String(doc?.slug || doc?._raw?.flattenedPath || tries[0])),
    });
  }

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
    bodyCode: doc.body?.code || doc.bodyCode || "",
    slugResolved: norm(String(doc?.slug || doc?._raw?.flattenedPath || tries[0])),
  });
}