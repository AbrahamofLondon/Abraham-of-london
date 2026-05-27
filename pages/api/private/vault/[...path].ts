/* pages/api/private/vault/[...path].ts — manifest-only vault redirect */

import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers from "@/lib/access/tiers";
import { getVaultManifestEntry } from "@/lib/runtime/vault-manifest";

type InnerCircleAccessResult = {
  hasAccess?: boolean;
  reason?: string;
  tier?: unknown;
};

function joinPathParam(value: string | string[] | undefined): string {
  const parts = Array.isArray(value) ? value : [String(value || "")];
  return parts
    .map((part) => String(part || "").trim().replace(/\\/g, "/"))
    .filter(Boolean)
    .join("/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
    return;
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const key = joinPathParam(req.query.path);
  const entry = getVaultManifestEntry(key);

  if (!entry || !entry.isDownloadable) {
    console.info("[VAULT_AUDIT][DOWNLOAD_NOT_FOUND]", { key });
    res.status(404).json({ ok: false, reason: "NOT_FOUND" });
    return;
  }

  const requiredTier = tiers.normalizeRequired(entry.requiredTier);
  if (requiredTier !== "public") {
    const auth = (await getInnerCircleAccess(req)) as InnerCircleAccessResult | null;

    if (!auth?.hasAccess) {
      console.info("[VAULT_AUDIT][DOWNLOAD_DENIED]", {
        key,
        requiredTier,
        reason: auth?.reason || "REQUIRES_AUTH",
      });
      res.status(401).json({
        ok: false,
        reason: auth?.reason || "REQUIRES_AUTH",
        requiredTier,
      });
      return;
    }

    const userTier = tiers.normalizeUser(auth.tier ?? "public");
    if (!tiers.hasAccess(userTier, requiredTier)) {
      console.info("[VAULT_AUDIT][INSUFFICIENT_TIER]", {
        key,
        requiredTier,
        userTier,
      });
      res.status(403).json({
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier,
      });
      return;
    }
  }

  console.info("[VAULT_AUDIT][DOWNLOAD_GRANTED]", {
    key,
    requiredTier,
    target: entry.storageUrl,
  });
  res.redirect(302, entry.storageUrl);
}
