import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { teamId, responses } = await req.json();

  if (!teamId || !responses || !Array.isArray(responses)) {
    return NextResponse.json({ error: 'Invalid Pulse Payload' }, { status: 400 });
  }

  try {
    const operations = responses.map((r: any) => 
      prisma.response.create({
        data: {
          teamId,
          domain: r.domain,
          resonance: r.resonance,
          certainty: r.certainty
        }
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ 
      success: true, 
      authHash: Math.random().toString(36).substring(7).toUpperCase() 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Telemetry Ingestion Failed' }, { status: 500 });
  }
}