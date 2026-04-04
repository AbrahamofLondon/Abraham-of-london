// app/api/telemetry/resonance/route.ts
import { NextResponse } from 'next/server';
import { TelemetryService } from '@/lib/services/telemetry-service';

export async function GET() {
  try {
    const telemetryService = TelemetryService.getInstance();
    const telemetryData = await telemetryService.fetchTelemetry();
    
    return NextResponse.json(telemetryData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('[API] Telemetry endpoint error:', error);
    
    return NextResponse.json(
      {
        resonance: 0,
        activeNodes: 0,
        logs: [
          `[${new Date().toISOString()}] ERROR: API endpoint failure`,
          `[${new Date().toISOString()}] MESSAGE: ${error instanceof Error ? error.message : 'Unknown error'}`,
          `[${new Date().toISOString()}] ACTION: Contact system administrator`
        ],
        metrics: {
          load: 0,
          friction: 0,
          dissonance: 0,
          burnoutIndex: 0,
          replacementLiability: 0,
          avgUtilization: 0
        },
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}