// pages/api/admin/case-studies/index.ts — List and create case studies
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { listCaseStudies, createCaseStudy } from "@/lib/evidence/case-study-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-case-studies" });
  if (!session) return;

  if (req.method === "GET") {
    try {
      const { visibility, productCode } = req.query;
      const vis = typeof visibility === "string" ? visibility.split(",") as any[] : undefined;
      const records = await listCaseStudies({ visibility: vis, productCode: typeof productCode === "string" ? productCode : undefined });
      return res.status(200).json({ ok: true, records });
    } catch (error) {
      console.error("[ADMIN_CASE_STUDIES_LIST]", error);
      return res.status(500).json({ ok: false, error: "LIST_FAILED" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, slug, productCode, caseType, evidenceStatus, outcomeStatus, visibilityStatus, narrative } = req.body || {};
      if (!title || typeof title !== "string") {
        return res.status(400).json({ ok: false, error: "TITLE_REQUIRED" });
      }
      const record = await createCaseStudy({
        title: title.slice(0, 300),
        slug: typeof slug === "string" ? slug.slice(0, 200) : undefined,
        productCode: typeof productCode === "string" ? productCode : undefined,
        caseType: typeof caseType === "string" ? caseType : undefined,
        evidenceStatus,
        outcomeStatus,
        visibilityStatus,
        narrative,
        adminRef: session.user?.email ?? undefined,
      });
      return res.status(201).json({ ok: true, record });
    } catch (error) {
      console.error("[ADMIN_CASE_STUDIES_CREATE]", error);
      return res.status(500).json({ ok: false, error: "CREATE_FAILED" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
