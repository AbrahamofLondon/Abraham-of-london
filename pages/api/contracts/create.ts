/**
 * POST /api/contracts/create — create a Pattern-Breaker Contract.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { createContract, validateContract, type ContractDraft } from "@/lib/contracts/engine";
import { persistContract } from "@/lib/contracts/persistence";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const draft = req.body as ContractDraft;
    const validation = validateContract(draft);
    if (!validation.valid) {
      return res.status(400).json({ error: "Invalid contract", details: validation.errors });
    }

    const contract = createContract(draft);
    await persistContract(prisma as any, contract);

    return res.status(201).json({ ok: true, contractId: contract.id, checkpoints: contract.checkpoints.length });
  } catch (error: any) {
    console.error("[contracts/create] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to create contract" });
  }
}
