/**
 * GET /api/access/download?artifact=<key>
 *
 * Enforces entitlement before returning a download.
 * Returns a signed temporary URL if the user has the required entitlement.
 *
 * This is the ONLY download endpoint. All downloads go through here.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";
import { canAccessArtifact, canAccessProduct, canAccessTier } from "@/lib/access/checks";
import crypto from "crypto";

// Signed URL validity (seconds)
const SIGNED_URL_TTL = 300; // 5 minutes
const SIGNING_SECRET = process.env.DOWNLOAD_SIGNING_SECRET || "aol-download-secret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const userId = (session.user as any).id || (session as any).aol?.memberId;
  if (!userId) {
    return res.status(401).json({ error: "NO_USER_ID" });
  }

  const artifactKey = String(req.query.artifact || "").trim();
  if (!artifactKey) {
    return res.status(400).json({ error: "MISSING_ARTIFACT" });
  }

  // Resolve user access from entitlements (SSOT)
  const access = await getUserAccess(prisma, userId);

  // Check entitlement — try artifact first, then product, then tier fallback
  const hasAccess =
    canAccessArtifact(access, artifactKey) ||
    canAccessProduct(access, artifactKey) ||
    canAccessTier(access, "inner-circle");

  if (!hasAccess) {
    return res.status(403).json({
      error: "INSUFFICIENT_ENTITLEMENT",
      required: artifactKey,
      userTier: access.tier,
    });
  }

  // Generate signed temporary URL
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL;
  const payload = `${artifactKey}:${userId}:${expires}`;
  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  const signedUrl = `/api/access/serve?artifact=${encodeURIComponent(artifactKey)}&expires=${expires}&sig=${signature}`;

  return res.status(200).json({
    ok: true,
    url: signedUrl,
    expiresIn: SIGNED_URL_TTL,
  });
}
