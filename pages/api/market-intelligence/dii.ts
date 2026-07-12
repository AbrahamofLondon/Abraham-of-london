import { NextApiRequest, NextApiResponse } from "next";
import { calculateDecisionIntegrityIndex, type EvidenceAuthority, type PublicEvidenceEnvelope } from "../../../lib/intelligence/accountability/market-decision-integrity-index";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  // No verified evidence available — truthful empty/withheld state
  const dii = calculateDecisionIntegrityIndex();
  const envelope: PublicEvidenceEnvelope<typeof dii> = {
    records: dii,
    authority: "UNAVAILABLE",
    publicationStatus: "PRELIMINARY",
    provenance: "",
    asOf: null,
  };
  res.setHeader("Cache-Control", "no-cache");
  return res.status(200).json(envelope);
}
