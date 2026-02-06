/* pages/api/strategy-room/analyze.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * INSTITUTIONAL SCORING LOGIC
 * S = (D * 1.5) + (V * 1.2) + (C * 1.0)
 * Max Score: 25 (High Gravity threshold: 18)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { intakeId, payload } = req.body;

  if (!intakeId || !payload) {
    return res.status(400).json({ error: 'Missing required dossier identifiers.' });
  }

  try {
    // 1. Calculate the Gravity Score
    const score = calculateInstitutionalGravity(payload);
    
    // 2. Determine Status (Auto-accepting if below critical risk, else pending)
    const status = score >= 22 ? "PENDING_DIRECTORATE_REVIEW" : "ACCEPTED";

    // 3. Update the Ledger
    const updatedIntake = await prisma.strategyRoomIntake.update({
      where: { id: intakeId },
      data: {
        score: Math.min(score, 25), // Cap at 25
        status,
        payload: payload, // Store the final processed JSON
      },
    });

    return res.status(200).json({ 
      success: true, 
      score: updatedIntake.score, 
      status: updatedIntake.status 
    });

  } catch (error) {
    console.error('Scoring Engine Failure:', error);
    return res.status(500).json({ error: 'Internal scoring failure.' });
  }
}

function calculateInstitutionalGravity(payload: any): number {
  let score = 0;

  // Pillar 1: External Dependency (Max 10)
  // Logic: Are they reliant on a single external node?
  if (payload.dependencyLevel === 'high') score += 10;
  else if (payload.dependencyLevel === 'medium') score += 5;

  // Pillar 2: Market Volatility (Max 8)
  // Logic: Is the sector undergoing a structural pivot?
  const volatilityMap: Record<string, number> = { 'extreme': 8, 'high': 6, 'stable': 2 };
  score += volatilityMap[payload.volatility] || 0;

  // Pillar 3: Tactical Readiness (Max 7)
  // Logic: Inverse relationship - lower readiness = higher gravity/need
  const readiness = payload.readinessScore || 5; // Default to mid
  score += (7 - readiness);

  return score;
}