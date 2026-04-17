import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "@/lib/access/get-user-access";
import { canAccessArtifact, canAccessProduct, canAccessTier } from "@/lib/access/checks";
import { logAccessAudit } from "@/lib/access/audit";

type ProtectedAsset = {
  key: string;
  kind: "artifact" | "product";
  requiredTier?: "public" | "member" | "inner-circle" | "architect" | "owner";
  fileUrl: string;
};

const ASSETS: Record<string, ProtectedAsset> = {
  "gmi-q1-2026-pdf": {
    key: "gmi-q1-2026-pdf",
    kind: "artifact",
    requiredTier: "inner-circle",
    fileUrl: "/assets/downloads/global-market-intelligence-report-q1-2026.pdf",
  },
  "gmi-q1-2026-deck": {
    key: "gmi-q1-2026-deck",
    kind: "artifact",
    requiredTier: "architect",
    fileUrl: "/assets/downloads/global-market-intelligence-board-deck-q1-2026.pdf",
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = typeof req.query.key === "string" ? req.query.key : "";
  const asset = ASSETS[key];

  if (!asset) {
    return res.status(404).json({ ok: false, error: "Asset not found" });
  }

  const session = await getServerSession(req, res, authOptions);
  const access = await getUserAccess(prisma, session?.user?.id ?? null);

  const allowedByTier = asset.requiredTier
    ? canAccessTier(access, asset.requiredTier)
    : false;

  const allowedByEntitlement =
    asset.kind === "artifact"
      ? canAccessArtifact(access, asset.key)
      : canAccessProduct(access, asset.key);

  const allowed = access.permissions.isAdmin || allowedByTier || allowedByEntitlement;

  if (!allowed) {
    await logAccessAudit({
      actorType: access.userId ? "USER" : "SYSTEM",
      actorUserId: access.userId,
      actorEmail: session?.user?.email ?? null,
      action: "download.denied",
      targetType: "asset",
      targetKey: asset.key,
      success: false,
      reason: "insufficient_access",
      metadata: {
        tier: access.tier,
        requiredTier: asset.requiredTier ?? null,
      },
    });

    return res.status(403).json({
      ok: false,
      error: `Content requires tier: ${asset.requiredTier ?? "entitled"}`,
    });
  }

  await logAccessAudit({
    actorType: "USER",
    actorUserId: access.userId,
    actorEmail: session?.user?.email ?? null,
    action: "download.granted",
    targetType: "asset",
    targetKey: asset.key,
    success: true,
  });

  return res.status(200).json({
    ok: true,
    url: asset.fileUrl,
  });
}