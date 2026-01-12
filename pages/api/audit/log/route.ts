// app/api/audit/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the audit event
    if (!body.action || !body.severity) {
      return NextResponse.json(
        { error: 'Invalid audit event: action and severity are required' },
        { status: 400 }
      );
    }

    // Add client context
    const event = {
      ...body,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      userAgent: request.headers.get('user-agent'),
      sessionId: request.cookies.get('session_id')?.value,
    };

    // Log the event
    const logger = getAuditLogger();
    const logEntry = await logger.log(event);

    return NextResponse.json(
      { success: true, logId: logEntry?.id },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[AuditAPI] Failed to log event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Add authentication and authorization here
  const { searchParams } = new URL(request.url);
  
  const filters = {
    actorId: searchParams.get('actorId') || undefined,
    action: searchParams.get('action') || undefined,
    severity: searchParams.get('severity') as any,
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
  };

  try {
    const logger = getAuditLogger();
    const logs = await logger.query(filters);

    return NextResponse.json({ logs });
    
  } catch (error) {
    console.error('[AuditAPI] Failed to query logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}