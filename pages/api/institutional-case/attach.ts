import type { NextApiRequest, NextApiResponse } from "next";
import { attachCorridorSurface } from "@/lib/product/institutional-case-service";
import { buildPublicSummary } from "@/lib/product/institutional-case-contract";
import type { CorridorSurface } from "@/lib/product/institutional-case-contract";

const VALID_SURFACES: CorridorSurface[] = [
  "EXECUTIVE_REPORTING",
  "STRATEGY_ROOM",
  "COUNSEL_REVIEW",
  "BOARDROOM",
  "OVERSIGHT_COMMAND",
  "OVERSIGHT_BRIEF",
  "PORTFOLIO_MEMORY",
  "PROOF_PACK",
  "DELIVERY",
  "SUPPRESSION_LEDGER",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { caseId, surface, referenceId } = req.body ?? {};

  if (!caseId || !surface || !referenceId) {
    return res.status(400).json({ error: "caseId, surface, and referenceId are required" });
  }

  if (!VALID_SURFACES.includes(surface)) {
    return res.status(400).json({ error: `Invalid surface: ${surface}` });
  }

  try {
    const ic = await attachCorridorSurface({ caseId, surface, referenceId });
    if (!ic) return res.status(404).json({ error: "Case not found" });
    return res.status(200).json({ ok: true, case: buildPublicSummary(ic) });
  } catch (err) {
    console.error("[INSTITUTIONAL_CASE_ATTACH]", err);
    return res.status(500).json({ error: "Failed to attach corridor surface" });
  }
}
