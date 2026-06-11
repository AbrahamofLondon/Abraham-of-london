// pages/api/admin/case-studies/[id].ts — Get, update, publish, withdraw
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import {
  getCaseStudyById,
  updateCaseStudy,
  publishCaseStudy,
  withdrawCaseStudy,
  linkEvidence,
} from "@/lib/evidence/case-study-service";
import { createCaseStudyFromBoardroomOrder } from "@/lib/evidence/case-study-boardroom-bridge";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-case-studies" });
  if (!session) return;

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ ok: false, error: "ID_REQUIRED" });

  if (req.method === "GET") {
    const record = await getCaseStudyById(id);
    if (!record) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    return res.status(200).json({ ok: true, record });
  }

  if (req.method === "PATCH") {
    try {
      const { action, ...body } = req.body || {};

      if (action === "publish") {
        const { targetVisibility } = body;
        if (targetVisibility !== "PUBLIC_ANONYMISED" && targetVisibility !== "PUBLIC_NAMED") {
          return res.status(400).json({ ok: false, error: "INVALID_TARGET_VISIBILITY" });
        }
        const result = await publishCaseStudy(id, targetVisibility, session.user?.email ?? "admin");
        if (!result.ok) return res.status(422).json({ ok: false, reason: result.reason });
        return res.status(200).json({ ok: true, record: result.record });
      }

      if (action === "withdraw") {
        const result = await withdrawCaseStudy(id, session.user?.email ?? "admin");
        if (!result.ok) return res.status(404).json({ ok: false, reason: result.reason });
        return res.status(200).json({ ok: true, record: result.record });
      }

      if (action === "link_evidence") {
        const { sourceType, sourceId, notes } = body;
        if (!sourceType || !sourceId) return res.status(400).json({ ok: false, error: "SOURCE_REQUIRED" });
        await linkEvidence(id, sourceType, sourceId, notes);
        const record = await getCaseStudyById(id);
        return res.status(200).json({ ok: true, record });
      }

      if (action === "create_from_boardroom_order") {
        const { orderId } = body;
        if (!orderId) return res.status(400).json({ ok: false, error: "ORDER_ID_REQUIRED" });
        const result = await createCaseStudyFromBoardroomOrder(orderId, session.user?.email ?? undefined);
        if (!result.ok) return res.status(422).json({ ok: false, reason: result.reason });
        return res.status(200).json({ ok: true, record: result.record, alreadyExists: result.alreadyExists });
      }

      const record = await updateCaseStudy(id, {
        title: typeof body.title === "string" ? body.title : undefined,
        slug: typeof body.slug === "string" ? body.slug : undefined,
        visibilityStatus: body.visibilityStatus,
        evidenceStatus: body.evidenceStatus,
        outcomeStatus: body.outcomeStatus,
        adminNotes: typeof body.adminNotes === "string" ? body.adminNotes : undefined,
        narrative: typeof body.narrative === "object" ? body.narrative : undefined,
      });
      if (!record) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(200).json({ ok: true, record });
    } catch (error) {
      console.error("[ADMIN_CASE_STUDIES_PATCH]", error);
      return res.status(500).json({ ok: false, error: "UPDATE_FAILED" });
    }
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
