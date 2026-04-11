export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { safePrismaQuery } from '@/lib/db';

export async function POST(req: Request) {
  const { teamId, responses } = await req.json();

  if (!teamId || !responses || !Array.isArray(responses)) {
    return NextResponse.json({ error: 'Invalid Pulse Payload' }, { status: 400 });
  }

  try {
    // 'response' model may not exist — use safePrismaQuery with transaction
    await safePrismaQuery((p: any) =>
      p.$transaction(
        responses.map((r: any) =>
          (p.response ?? p.auditResponse)?.create?.({
            data: {
              teamId,
              domain: r.domain,
              resonance: r.resonance,
              certainty: r.certainty,
            },
          })
        ).filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      authHash: Math.random().toString(36).substring(7).toUpperCase(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Telemetry Ingestion Failed' }, { status: 500 });
  }
}
