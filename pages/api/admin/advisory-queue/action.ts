/* pages/api/admin/advisory-queue/action.ts — Phase 1: Advisory Queue Actions */
/* Fixed: No prisma.$raw usage — conditional SQL via separate queries */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type Response = { ok: true } | { ok: false; error: string };

const ALLOWED_ACTIONS = [
  "contacted",
  "boardroom-recommended",
  "boardroom-clicked",
  "boardroom-requested",
  "converted-boardroom",
  "strategy-recommended",
  "strategy-clicked",
  "converted-strategy",
  "council-requested",
  "converted-retainer",
  "dismiss",
  "add-note",
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-advisory-action" });
  if (!session) return;

  const { qualificationId, action, note } = req.body || {};
  if (!qualificationId || !action) {
    return res.status(400).json({ ok: false, error: "QUALIFICATION_ID_AND_ACTION_REQUIRED" });
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return res.status(400).json({ ok: false, error: "INVALID_ACTION" });
  }

  try {
    const statusMap: Record<string, string> = {
      contacted: "CONTACTED",
      "boardroom-recommended": "BOARDROOM_RECOMMENDED",
      "boardroom-clicked": "BOARDROOM_CLICKED",
      "boardroom-requested": "BOARDROOM_REQUESTED",
      "converted-boardroom": "CONVERTED",
      "strategy-recommended": "STRATEGY_RECOMMENDED",
      "strategy-clicked": "STRATEGY_CLICKED",
      "converted-strategy": "CONVERTED",
      "council-requested": "COUNCIL_REQUESTED",
      "converted-retainer": "CONVERTED",
      dismiss: "DISMISSED",
      "add-note": "OPEN",
    };

    const productMap: Record<string, string | null> = {
      contacted: null,
      "boardroom-recommended": "boardroom-brief",
      "boardroom-clicked": "boardroom-brief",
      "boardroom-requested": "boardroom-brief",
      "converted-boardroom": "boardroom-brief",
      "strategy-recommended": "strategy-room",
      "strategy-clicked": "strategy-room",
      "converted-strategy": "strategy-room",
      "council-requested": "private-council",
      "converted-retainer": "retainer-oversight",
      dismiss: null,
      "add-note": null,
    };

    const newStatus = statusMap[action] || "OPEN";
    const newProduct = productMap[action];
    const existing = await prisma.$queryRaw<Array<{
      id: string;
      status: string;
      recommended_product: string;
    }>>`
      SELECT id, status, recommended_product
      FROM inner_circle_advisory_qualifications
      WHERE id = ${qualificationId}
      LIMIT 1
    `;

    if (!existing[0]) {
      return res.status(404).json({ ok: false, error: "QUALIFICATION_NOT_FOUND" });
    }

    // Use separate queries instead of conditional SQL interpolation
    if (newProduct && note) {
      await prisma.$executeRaw`
        UPDATE inner_circle_advisory_qualifications
        SET
          status = ${newStatus},
          recommended_product = ${newProduct},
          metadata_json = COALESCE(metadata_json, '{}'::jsonb) || ${JSON.stringify({ adminNote: note })}::jsonb,
          reviewed_by = ${session.user.email},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${qualificationId}
      `;
    } else if (newProduct) {
      await prisma.$executeRaw`
        UPDATE inner_circle_advisory_qualifications
        SET
          status = ${newStatus},
          recommended_product = ${newProduct},
          reviewed_by = ${session.user.email},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${qualificationId}
      `;
    } else if (note) {
      await prisma.$executeRaw`
        UPDATE inner_circle_advisory_qualifications
        SET
          status = ${newStatus},
          metadata_json = COALESCE(metadata_json, '{}'::jsonb) || ${JSON.stringify({ adminNote: note })}::jsonb,
          reviewed_by = ${session.user.email},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${qualificationId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE inner_circle_advisory_qualifications
        SET
          status = ${newStatus},
          reviewed_by = ${session.user.email},
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${qualificationId}
      `;
    }

    await prisma.accessAuditLog.create({
      data: {
        actorType: "ADMIN",
        actorEmail: session.user?.email || null,
        action: "advisory_queue.action",
        targetType: "inner_circle_advisory_qualification",
        targetKey: qualificationId,
        success: true,
        reason: action,
        metadata: {
          previousStatus: existing[0].status,
          newStatus,
          previousProduct: existing[0].recommended_product,
          newProduct: newProduct ?? existing[0].recommended_product,
          note: typeof note === "string" ? note.slice(0, 1000) : null,
        },
      },
    }).catch(() => undefined);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[advisory-queue:action]", error);
    return res.status(500).json({ ok: false, error: "ACTION_FAILED" });
  }
}
