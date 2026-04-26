/**
 * POST /api/contracts/[id]/checkpoint — report checkpoint status.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { loadContract, updateContractInDb } from "@/lib/contracts/persistence";
import { processCheckpointMiss } from "@/lib/contracts/breach";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  const { checkpointId, status, evidence } = req.body ?? {};

  try {
    const contract = await loadContract(prisma as any, id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const cp = contract.checkpoints.find((c) => c.id === checkpointId);
    if (!cp) return res.status(404).json({ error: "Checkpoint not found" });

    cp.status = status === "met" ? "met" : "missed";
    cp.evidence = evidence;
    cp.verifiedAt = new Date().toISOString();

    if (cp.status === "missed") {
      const breach = processCheckpointMiss(contract, checkpointId);
      contract.breachCount = breach.breachCount;
      contract.escalationLevel = breach.escalationLevel;
      if (breach.breachCount >= 3) contract.status = "breached";
    }

    contract.updatedAt = new Date().toISOString();
    await updateContractInDb(prisma as any, contract);

    return res.status(200).json({ ok: true, contract });
  } catch (error) {
    console.error("[contracts/checkpoint] Error:", error);
    return res.status(500).json({ error: "Failed to update checkpoint" });
  }
}
