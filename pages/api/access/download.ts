import type { NextApiRequest, NextApiResponse } from "next";
import { canAccessArtifact, canAccessProduct, canAccessTier } from "@/lib/access/checks";
import { ACCESS_DOWNLOADS, createSignedDownloadToken } from "@/lib/access/downloads";
import { logAccessAudit } from "@/lib/access/audit";
import { requireAuthenticatedApi } from "@/lib/access/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return;

  const artifactKey = String(req.query.artifact || "").trim();
  if (!artifactKey) {
    return res.status(400).json({ error: "MISSING_ARTIFACT" });
  }

  const asset = ACCESS_DOWNLOADS[artifactKey];
  if (!asset) {
    return res.status(404).json({ error: "ASSET_NOT_FOUND" });
  }

  const access = resolved.access;
  const sessionUser = resolved.session?.user;

  const hasAccess =
    canAccessArtifact(access, artifactKey) ||
    canAccessProduct(access, artifactKey) ||
    (asset.requiredTier ? canAccessTier(access, asset.requiredTier) : false);

  if (!hasAccess) {
    await logAccessAudit({
      actorType: "USER",
      actorUserId: access.userId,
      actorEmail: sessionUser?.email ?? access.email,
      action: "download.denied",
      targetType: "asset",
      targetKey: artifactKey,
      success: false,
      reason: "insufficient_entitlement",
      metadata: {
        tier: access.tier,
        requiredTier: asset.requiredTier ?? null,
      },
    });

    return res.status(403).json({
      error: "INSUFFICIENT_ENTITLEMENT",
      required: artifactKey,
      userTier: access.tier,
    });
  }

  const signed = createSignedDownloadToken(artifactKey, access.userId as string);
  const signedUrl = `/api/access/serve?artifact=${encodeURIComponent(artifactKey)}&expires=${signed.expires}&sig=${signed.signature}`;

  await logAccessAudit({
    actorType: "USER",
    actorUserId: access.userId,
    actorEmail: sessionUser?.email ?? access.email,
    action: "download.granted",
    targetType: "asset",
    targetKey: artifactKey,
    success: true,
  });

  return res.status(200).json({
    ok: true,
    url: signedUrl,
    expiresIn: signed.expiresIn,
  });
}
