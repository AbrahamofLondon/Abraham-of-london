import { NextApiRequest, NextApiResponse } from "next";
import { calculateDecisionIntegrityIndex } from "../../../lib/intelligence/accountability/market-decision-integrity-index";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const dii = calculateDecisionIntegrityIndex();
  res.setHeader("Cache-Control", "no-cache");
  return res.status(200).json(dii);
}
