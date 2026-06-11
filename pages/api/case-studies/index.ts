// pages/api/case-studies/index.ts — Public case study index
// Returns only published, publication-allowed case studies. No PII.
import type { NextApiRequest, NextApiResponse } from "next";
import { listCaseStudies } from "@/lib/evidence/case-study-service";
import { toPublicCaseStudy } from "@/lib/evidence/case-study-public";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  try {
    const records = await listCaseStudies({ publicOnly: true });
    const publicRecords = records.map(toPublicCaseStudy);
    return res.status(200).json({ ok: true, cases: publicRecords });
  } catch (error) {
    console.error("[PUBLIC_CASE_STUDIES_INDEX]", error);
    return res.status(500).json({ ok: false, error: "LOAD_FAILED" });
  }
}
