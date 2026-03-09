// pages/api/resources/[...slug].ts — SSOT RESOURCE UNLOCK (catch-all, nested slugs)
import type { NextApiRequest, NextApiResponse } from "next";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { getDocBySlug, getAllContentlayerDocs, normalizeSlug } from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type ResponseData =
  | { ok: true; tier: AccessTier; requiredTier: AccessTier; bodyCode: string; slugResolved: string }
  | { ok: false; reason: string; tried?: string[] };

function pickSlug(req: NextApiRequest): string {
  const raw = req.query.slug;
  const joined = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return normalizeSlug(joined);
}

function isResourceDoc(d: any): boolean {
  if (!d) return false;

  // Prefer docKind (your SSOT indicator) over type.
  const docKind = String(d?.docKind || "").toLowerCase();
  if (docKind === "resource") return true;

  const fp = String(d?._raw?.flattenedPath || d?._raw?.sourceFilePath || "").toLowerCase();
  return fp.startsWith("resources/") || fp.startsWith("content/resources/");
}

function normalizePathish(s: string): string {
  return String(s || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

// Fallback matcher when slugs are messy (your repo has both /slug and slug forms)
function findByRegistryScan(wanted: string): any | null {
  const w = normalizePathish(wanted);
  if (!w) return null;

  const all = getAllContentlayerDocs?.() || [];
  const lowerW = w.toLowerCase();

  return (
    all.find((d: any) => {
      const a = normalizePathish(String(d?.slug || ""));
      const b = normalizePathish(String(d?._raw?.flattenedPath || ""));
      const c = normalizePathish(String(d?._raw?.sourceFilePath || ""));
      const hay = [a, b, c].filter(Boolean).map((x) => x.toLowerCase());

      // match exact OR match after stripping leading "content/"
      return (
        hay.includes(lowerW) ||
        hay.includes(`content/${lowerW}`) ||
        hay.includes(lowerW.replace(/^content\//, "")) ||
        hay.includes(`resources/${lowerW}`) ||
        hay.includes(`content/resources/${lowerW}`)
      );
    }) || null
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });

  const slug = pickSlug(req);
  if (!slug) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  // Canonical tries (ordered)
  const tries = [
    `resources/${slug}`,
    `content/resources/${slug}`,
    slug,
    slug.replace(/^resources\//, ""),
    `resources/${slug.replace(/^resources\//, "")}`,
  ].map(normalizePathish);

  let doc: any =
    getDocBySlug(tries[0]) ||
    getDocBySlug(tries[1]) ||
    getDocBySlug(tries[2]) ||
    getDocBySlug(tries[3]) ||
    getDocBySlug(tries[4]) ||
    null;

  // Last resort: scan registry
  if (!doc) {
    for (const t of tries) {
      doc = findByRegistryScan(t);
      if (doc) break;
    }
  }

  if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "NOT_FOUND", tried: tries });
  if (!isResourceDoc(doc)) return res.status(404).json({ ok: false, reason: "NOT_A_RESOURCE", tried: tries });

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));

  // Public bypass
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: doc.body?.code || doc.bodyCode || "",
      slugResolved: normalizePathish(String(doc?.slug || doc?._raw?.flattenedPath || slug)),
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
    slugResolved: normalizePathish(String(doc?.slug || doc?._raw?.flattenedPath || slug)),
  });
}