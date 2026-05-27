import type { AccessTier } from "@/lib/access/tier-policy";
import { getTierLabel } from "@/lib/access/tier-policy";
import type { DownloadManifestEntry } from "@/lib/downloads/download-manifest";
import { getDownloadRedirectUrl } from "@/lib/downloads/download-manifest";
import type { DownloadGrantToken } from "@/lib/downloads/security";
import { getTokenForensics } from "@/lib/downloads/security";

type LegacyDownloadAsset = DownloadManifestEntry & {
  contentType?: string;
  bodyCode?: string;
};

export type LegacyDownloadResolveOk = {
  ok: true;
  slug: string;
  title: string;
  contentType: string;
  requiredTier: AccessTier;
  requiredTierLabel: string;
  userTier?: string;
  bodyCode?: string;
  token: string | null;
  tokenId: string | null;
  watermarkId: string | null;
  forensicFooter: string | null;
  downloadUrl: string;
};

export type LegacyDownloadResolveFail = {
  ok: false;
  reason: string;
  requiredTier?: AccessTier;
  requiredTierLabel?: string;
  userTier?: string;
};

export function getCanonicalDownloadUrl(slug: string): string {
  return `/api/downloads/${encodeURIComponent(slug)}`;
}

export function buildLegacyDownloadResolveOk(args: {
  asset: LegacyDownloadAsset;
  requiredTier: AccessTier;
  issued?: DownloadGrantToken | null;
  userTier?: AccessTier | null;
}): LegacyDownloadResolveOk {
  const { asset, requiredTier, issued, userTier } = args;
  const forensics = getTokenForensics(issued?.metadata);

  return {
    ok: true,
    slug: asset.slug,
    title: asset.title,
    contentType: asset.contentType || "downloads",
    requiredTier,
    requiredTierLabel: getTierLabel(requiredTier),
    userTier: userTier ? getTierLabel(userTier) : undefined,
    bodyCode: asset.bodyCode || "",
    token: issued?.token ?? null,
    tokenId: issued?.tokenId ?? null,
    watermarkId: forensics.watermarkId,
    forensicFooter: forensics.expectedFooter,
    downloadUrl: getDownloadRedirectUrl(asset) || getCanonicalDownloadUrl(asset.slug),
  };
}
