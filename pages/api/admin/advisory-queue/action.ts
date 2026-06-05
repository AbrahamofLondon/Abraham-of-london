/* pages/api/admin/advisory-queue/action.ts — Phase 1: Advisory Queue Actions */
/* Fixed: No prisma.$raw usage — conditional SQL via separate queries */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type Response = { ok: true } | { ok: false; error: string };

const ALLOWED_ACTIONS = [
  "contacted",
  "converted-boardroom",
  "converted-strategy",
  "converted-retainer",
  "dismiss",
  "add-note",
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
  }

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
      "converted-boardroom": "CONVERTED",
      "converted-strategy": "CONVERTED",
      "converted-retainer": "CONVERTED",
      dismiss: "DISMISSED",
      "add-note": "OPEN",
    };

    const productMap: Record<string, string | null> = {
      contacted: null,
      "converted-boardroom": "boardroom-brief",
      "converted-strategy": "strategy-room",
      "converted-retainer": "retainer-oversight",
      dismiss: null,
      "add-note": null,
    };

    const newStatus = statusMap[action] || "OPEN";
    const newProduct = productMap[action];

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

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[advisory-queue:action]", error);
    return res.status(500).json({ ok: false, error: "ACTION_FAILED" });
  }
}