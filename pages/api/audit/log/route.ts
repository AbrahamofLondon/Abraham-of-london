/* app/api/audit/log/route.ts */
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger } from '@/lib/audit/audit-logger';
import { getServerSession } from 'next-auth/next'; 
import { authOptions } from '@/lib/auth/auth-options';

/**
 * INSTITUTIONAL PROTOCOL:
 * 1. Authenticate Principal
 * 2. Capture Environmental Context (IP, UA, Session)
 * 3. Persist Event with Systemic Metadata
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // 1. Integrity Check: Action, Severity, and Resource Context required
    if (!body.action || !body.severity || !body.resourceId) {
      return NextResponse.json(
        { error: 'Audit Integrity Failure: Action, Severity, and ResourceID are mandatory.' },
        { status: 400 }
      );
    }

    // 2. Enrich Event with Institutional Context
    const event = {
      ...body,
      actorId: session?.user?.id || 'ANONYMOUS_PRINCIPAL',
      actorName: session?.user?.name || 'Unauthenticated Request',
      actorEmail: session?.user?.email || 'N/A',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'LOCAL_OR_VPN',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      // Adding a hash-ready structure for future tamper-evidence
      traceId: crypto.randomUUID(),
      environment: process.env.NODE_ENV,
    };

    // 3. Persist to Registry
    const logger = getAuditLogger();
    const logEntry = await logger.log(event);

    return NextResponse.json(
      { 
        success: true, 
        logId: logEntry?.id,
        traceId: event.traceId,
        verifiedAt: event.timestamp 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Registry_Failure] Critical error in audit persistence:', error);
    return NextResponse.json(
      { error: 'Systemic Registry Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 1. Authorization: Only 'Admin' or 'Auditor' roles can query the full registry
  const session = await getServerSession(authOptions);
  if (!session || !['admin', 'auditor'].includes(session.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized Access to Institutional Logs' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  
  const filters = {
    actorId: searchParams.get('actorId') || undefined,
    resourceId: searchParams.get('resourceId') || undefined,
    action: searchParams.get('action') || undefined,
    severity: searchParams.get('severity') as any,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    limit: Math.min(parseInt(searchParams.get('limit')!) || 100, 1000), // Safety cap
  };

  try {
    const logger = getAuditLogger();
    const logs = await logger.query(filters);

    return NextResponse.json({ 
      count: logs.length,
      logs,
      queriedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Registry_Query_Failure] Failed to retrieve logs:', error);
    return NextResponse.json(
      { error: 'Internal Registry Query Error' },
      { status: 500 }
    );
  }
}