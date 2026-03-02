// pages/api/library/[slug].ts — SECURE LIBRARY ASSET PROXY (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

import tiers, { type AccessTier } from "@/lib/access/tiers";

type PdfAsset = {
  slug: string;
  href?: string | null;
  url?: string | null;
  path?: string | null;
  public?: boolean | null;
  accessLevel?: string | null;
  tier?: string | null;
};

type ResponseData = {
  ok: boolean;
  reason?: string;
  tier?: AccessTier;
  requiredTier?: AccessTier;
  url?: string;
};

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeSlug(input: string) {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function toRouteParamSlug(registrySlug: string): string {
  const n = normalizeSlug(registrySlug);
  const parts = n.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function resolveUrl(asset: PdfAsset): string | null {
  const url = safeStr(asset.url || "");
  if (url) return url;

  const href = safeStr(asset.href || "");
  if (href) return href.startsWith("/") ? href : href;

  const path = safeStr(asset.path || "");
  if (path) {
    const p = normalizeSlug(path);
    if (p.startsWith("pdfs/")) return `/${p}`;
    if (p.startsWith("assets/")) return `/${p}`;
    if (p.startsWith("public/")) return `/${p.replace(/^public\//, "")}`;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
  }

  return null;
}

async function loadPdfAssets(): Promise<PdfAsset[]> {
  try {
    const mod: any = await import("@/scripts/pdf/pdf-registry.source");
    const list = mod?.ALL_SOURCE_PDFS || mod?.PDF_REGISTRY || mod?.ALL_PDFS || mod?.default;
    const arr: any[] = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
    // keep only what we need
    return arr.map((x: any) => ({
      slug: normalizeSlug(safeStr(x.slug || x.id || x.key || x.name || "")),
      href: safeStr(x.href || "") || null,
      url: safeStr(x.url || x.publicUrl || "") || null,
      path: safeStr(x.path || x.filePath || x.file || "") || null,
      public: Boolean(x.public === true || String(x.accessLevel || "").toLowerCase() === "public"),
      accessLevel: safeStr(x.accessLevel || "") || null,
      tier: safeStr(x.tier || "") || null,
    })).filter((a: any) => a.slug);
  } catch {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });

  const slugParam = safeStr(req.query.slug || "");
  if (!slugParam) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  const needle = normalizeSlug(slugParam).toLowerCase();

  const assets = await loadPdfAssets();
  const asset =
    assets.find((a) => toRouteParamSlug(a.slug).toLowerCase() === needle) ||
    assets.find((a) => normalizeSlug(a.slug).toLowerCase() === needle) ||
    null;

  if (!asset) return res.status(404).json({ ok: false, reason: "ASSET_NOT_FOUND" });

  const requiredTier = tiers.normalizeRequired(asset.accessLevel ?? asset.tier ?? (asset.public ? "public" : "member"));

  // Public bypass
  if (requiredTier === "public") {
    const url = resolveUrl(asset);
    if (!url) return res.status(404).json({ ok: false, reason: "URL_NOT_FOUND" });
    return res.status(200).json({ ok: true, tier: "public", requiredTier: "public", url });
  }

  const sessionId = getAccessCookie(req);
  if (!sessionId) return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });

  const session = await verifySession(sessionId);
  if (!session || !session.valid) return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });

  const userTier = tiers.normalizeUser(session.tier);
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
  }

  const url = resolveUrl(asset);
  if (!url) return res.status(404).json({ ok: false, reason: "URL_NOT_FOUND" });

  return res.status(200).json({ ok: true, tier: userTier, requiredTier, url });
}