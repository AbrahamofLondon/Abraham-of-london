/**
 * GET /api/contracts/[id] — load a contract by ID.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { loadContract } from "@/lib/contracts/persistence";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ error: "Missing contract ID" });

  try {
    const contract = await loadContract(prisma as any, id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    return res.status(200).json({ contract });
  } catch (error) {
    console.error("[contracts/get] Error:", error);
    return res.status(500).json({ error: "Failed to load contract" });
  }
}
