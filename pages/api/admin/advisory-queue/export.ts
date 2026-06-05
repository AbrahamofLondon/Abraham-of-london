/* pages/api/admin/advisory-queue/export.ts — Phase 1: Advisory Queue CSV Export */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type Response = { ok: true; csv: string } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-advisory-export" });
  if (!session) return;

  try {
    const qualifications = await prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      status: string;
      risk_level: string;
      recommended_product: string;
      reason: string;
      created_at: Date;
      reviewed_at: Date | null;
      reviewed_by: string | null;
    }>>`
      SELECT id, user_id, status, risk_level, recommended_product, reason, created_at, reviewed_at, reviewed_by
      FROM inner_circle_advisory_qualifications
      ORDER BY created_at DESC
    `;

    const headers = [
      "qualification_id",
      "user_ref",
      "status",
      "risk_level",
      "recommended_product",
      "reason",
      "created_at",
      "reviewed_at",
      "reviewed_by",
    ];

    const rows = qualifications.map((q) => [
      q.id,
      q.user_id.slice(0, 12),
      q.status,
      q.risk_level,
      q.recommended_product,
      `"${(q.reason || "").replace(/"/g, '""')}"`,
      q.created_at.toISOString(),
      q.reviewed_at?.toISOString() || "",
      q.reviewed_by || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return res.status(200).json({ ok: true, csv });
  } catch (error) {
    console.error("[advisory-queue:export]", error);
    return res.status(500).json({ ok: false, error: "EXPORT_FAILED" });
  }
}
