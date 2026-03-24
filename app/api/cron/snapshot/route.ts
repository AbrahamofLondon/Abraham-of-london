import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureInstitutionalSnapshot } from '@/lib/alignment/snapshot-service';

export async function GET(req: Request) {
  // 1. Security Check (e.g., Vercel Cron Secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Capture Global Baseline
    await captureInstitutionalSnapshot(undefined, "Weekly Institutional Baseline");

    // 3. Capture Granular Team Baselines
    const teams = await prisma.team.findMany();
    const snapshots = await Promise.all(
      teams.map(team => captureInstitutionalSnapshot(team.id, `Weekly Team Snapshot: ${team.name}`))
    );

    return NextResponse.json({ 
      success: true, 
      captured: snapshots.filter(Boolean).length + 1 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Snapshot Automation Failed' }, { status: 500 });
  }
}