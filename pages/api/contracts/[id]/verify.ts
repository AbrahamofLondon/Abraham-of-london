/**
 * POST /api/contracts/[id]/verify — submit verification evidence.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { loadContract, updateContractInDb } from "@/lib/contracts/persistence";
import { verifyCommitment } from "@/lib/contracts/verification";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  const { selfReport, selfReportText, documentaryEvidence, adminOverride } = req.body ?? {};

  try {
    const contract = await loadContract(prisma as any, id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const deadlinePassed = new Date(contract.dueAt).getTime() < Date.now();
    const result = verifyCommitment({ selfReport, selfReportText, documentaryEvidence, adminOverride }, deadlinePassed);

    contract.verificationStatus = result.verificationStatus;
    if (result.verificationStatus === "behavior_verified" || (result.confidence >= 0.9 && !result.requiresManualReview)) {
      contract.status = "completed";
    } else if (result.verificationStatus === "failed") {
      contract.status = "breached";
    }

    contract.updatedAt = new Date().toISOString();
    await updateContractInDb(prisma as any, contract);

    return res.status(200).json({ ok: true, verification: result, contract });
  } catch (error) {
    console.error("[contracts/verify] Error:", error);
    return res.status(500).json({ error: "Failed to verify contract" });
  }
}
