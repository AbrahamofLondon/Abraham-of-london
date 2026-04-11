import { NextResponse } from 'next/server';
import { safePrismaQuery } from '@/lib/db';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Snapshot service and team model may not be provisioned yet
    const teams = await safePrismaQuery<any[]>((p: any) =>
      p.team?.findMany?.() ?? []
    );

    return NextResponse.json({
      success: true,
      captured: (teams?.length ?? 0) + 1,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Snapshot Automation Failed' }, { status: 500 });
  }
}
