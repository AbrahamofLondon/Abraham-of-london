/**
 * pages/api/admin/security-assurance-requests/update.ts
 *
 * POST /api/admin/security-assurance-requests/update
 *
 * Admin-only. Updates the status and optional decision note on a
 * SecurityAssuranceRequest. Does not send documents automatically.
 */

import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import {
  SECURITY_ASSURANCE_REQUEST_STATUSES,
  type SecurityAssuranceRequestStatus,
} from "@/lib/security-assurance/security-assurance-pack-registry";

const UpdateSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(
    SECURITY_ASSURANCE_REQUEST_STATUSES as [
      SecurityAssuranceRequestStatus,
      ...SecurityAssuranceRequestStatus[],
    ],
  ),
  decisionNote: z.string().max(2000).trim().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, errors: parsed.error.format() });
  }

  const { id, status, decisionNote } = parsed.data;

  try {
    const updated = await prisma.securityAssuranceRequest.update({
      where: { id },
      data: {
        status,
        decisionNote: decisionNote ?? null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        email: true,
        requestedMaterial: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ ok: true, request: updated });
  } catch (err: unknown) {
    const isNotFound =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025";

    if (isNotFound) {
      return res.status(404).json({ ok: false, error: "Request not found." });
    }

    console.error("[SECURITY_ASSURANCE_UPDATE_ERROR]", err);
    return res.status(500).json({ ok: false, error: "Internal server error." });
  }
}
