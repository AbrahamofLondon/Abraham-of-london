/* pages/api/strategy-room/submit.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Strict Method Enforcement
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fullName, organisation, ...payload } = req.body;

  // 2. Data Integrity Check
  if (!fullName || !organisation) {
    return res.status(400).json({ 
      error: 'Incomplete Dossier: Principal Identity and Institutional Affiliation required.' 
    });
  }

  try {
    // 3. Create the Base Ledger Entry
    // We initialize with a score of 0 and status "PROCESSING"
    const intake = await prisma.strategyRoomIntake.create({
      data: {
        fullName,
        organisation,
        score: 0,
        status: "PROCESSING",
        payload: payload, // The rest of the dynamic form data
      },
    });

    // 4. Return the unique ID for the subsequent Analysis ping
    return res.status(201).json({ 
      success: true, 
      intakeId: intake.id 
    });

  } catch (error) {
    console.error('Directorate Submission Error:', error);
    return res.status(500).json({ 
      error: 'System failure during intake registration.' 
    });
  }
}