// pages/api/admin/case-studies/boardroom-order.ts
// Create a case study draft from a paid Boardroom Brief order.
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { createCaseStudyFromBoardroomOrder } from "@/lib/evidence/case-study-boardroom-bridge";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-case-studies-boardroom-order" });
  if (!session) return;

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ ok: false, error: "ORDER_ID_REQUIRED" });
  }

  try {
    const result = await createCaseStudyFromBoardroomOrder(orderId.trim(), session.user?.email ?? undefined);
    if (!result.ok) {
      return res.status(422).json({ ok: false, reason: result.reason });
    }
    return res.status(201).json({ ok: true, record: result.record, alreadyExists: result.alreadyExists });
  } catch (error) {
    console.error("[ADMIN_CASE_STUDIES_BOARDROOM_ORDER]", error);
    return res.status(500).json({ ok: false, error: "CREATE_FAILED" });
  }
}
