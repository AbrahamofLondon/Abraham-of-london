// pages/api/case-studies/[slug].ts — Public case study detail
// Returns a single published case. Withdrawn cases return 404.
import type { NextApiRequest, NextApiResponse } from "next";
import { getCaseStudyBySlug } from "@/lib/evidence/case-study-service";
import { toPublicCaseStudy } from "@/lib/evidence/case-study-public";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  if (!slug) return res.status(400).json({ ok: false, error: "SLUG_REQUIRED" });

  try {
    const record = await getCaseStudyBySlug(slug);

    // Withdrawn or unpublished → 404 (no information about existence)
    if (!record || !record.publicationAllowed || record.visibilityStatus === "WITHDRAWN") {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    return res.status(200).json({ ok: true, case: toPublicCaseStudy(record) });
  } catch (error) {
    console.error("[PUBLIC_CASE_STUDIES_DETAIL]", error);
    return res.status(500).json({ ok: false, error: "LOAD_FAILED" });
  }
}
