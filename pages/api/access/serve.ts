import type { NextApiRequest, NextApiResponse } from "next";
import { ACCESS_DOWNLOADS, verifySignedDownloadToken } from "@/lib/access/downloads";
import { requireAuthenticatedApi } from "@/lib/access/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return;

  const artifactKey = String(req.query.artifact || "").trim();
  const asset = ACCESS_DOWNLOADS[artifactKey];
  if (!asset) {
    return res.status(404).json({ error: "ASSET_NOT_FOUND" });
  }

  const expires = Number(req.query.expires);
  const signature = String(req.query.sig || "");

  const valid = verifySignedDownloadToken({
    artifactKey,
    userId: resolved.access.userId as string,
    expires,
    signature,
  });

  if (!valid) {
    return res.status(403).json({ error: "INVALID_SIGNATURE" });
  }

  return res.redirect(asset.fileUrl);
}
