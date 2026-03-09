/* pages/api/strategy-room/submit.ts — legacy structured-form adapter */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { fullName, organisation, ...payload } = req.body || {};

  if (!fullName || !organisation) {
    return res.status(400).json({
      error: "Incomplete Dossier: Principal Identity and Institutional Affiliation required.",
    });
  }

  try {
    const intake = await prisma.strategyRoomIntake.create({
      data: {
        fullName: String(fullName).trim(),
        organisation: String(organisation).trim(),
        score: 0,
        status: "PROCESSING",
        payload: {
          ...payload,
          source: payload?.source || "strategy_room_submit_legacy",
        },
      },
    });

    return res.status(201).json({
      success: true,
      intakeId: intake.id,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_SUBMIT_ERROR]:", error);
    return res.status(500).json({
      error: "System failure during intake registration.",
    });
  }
}