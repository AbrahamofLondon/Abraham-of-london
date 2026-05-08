import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { loadOversightCycleArchive } from "@/lib/product/oversight-cycle-archive";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";
import { verifyRetainerAccess } from "@/lib/retainers/retainer-service";

const ALLOWED_AUDIENCES: OversightCycleAudience[] = [
  "CLIENT_SPONSOR",
  "BOARD_LEVEL",
  "RESPONDENT_SAFE",
];

function isAudience(value: string | undefined): value is OversightCycleAudience {
  return Boolean(value && ALLOWED_AUDIENCES.includes(value as OversightCycleAudience));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
  const audience = isAudience(typeof req.query.audience === "string" ? req.query.audience : undefined)
    ? req.query.audience as OversightCycleAudience
    : "CLIENT_SPONSOR";
  if (!cycleId) {
    return res.status(400).json({ ok: false, error: "CYCLE_ID_REQUIRED" });
  }

  const archive = await loadOversightCycleArchive({ cycleId });
  if (!archive) {
    return res.status(404).json({ ok: false, error: "CYCLE_NOT_FOUND" });
  }

  const email = session.user.email.toLowerCase();
  const role = typeof (session.user as { role?: unknown }).role === "string" ? String((session.user as { role?: unknown }).role) : "USER";
  const isAdmin = role === "ADMIN" || role === "OWNER";

  if (!isAdmin && archive.record.organisationId) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        organisationId: archive.record.organisationId,
        email,
        status: "active",
      },
      select: { id: true },
    });

    if (!membership) {
      return res.status(403).json({ ok: false, error: "ORGANISATION_ACCESS_REQUIRED" });
    }
  }

  const retainerAccess = await verifyRetainerAccess({
    contractId: archive.record.accountId,
    organisationId: archive.record.organisationId ?? null,
    email,
  });

  if (!retainerAccess.ok && !isAdmin) {
    return res.status(403).json({ ok: false, error: retainerAccess.reason || "RETAINER_ACCESS_REQUIRED" });
  }

  const brief = archive.audienceBriefs[audience] ?? archive.clientSafeBrief;
  if (!brief) {
    return res.status(404).json({ ok: false, error: "AUDIENCE_BRIEF_NOT_AVAILABLE" });
  }

  return res.status(200).json({
    ok: true,
    cycle: archive.record,
    audience,
    brief,
    suppressions: archive.record.suppressions,
    deliveryStatus: archive.record.deliveryStatus,
    nextCycleIntent: archive.record.nextCycleIntent ?? null,
    cycleComparison: archive.cycleComparison ?? null,
  });
}
