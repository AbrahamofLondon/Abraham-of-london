// lib/server/audit-edge.ts
export async function logAuditEvent(event: {
  action: string;
  resource?: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  // Send to your audit API endpoint
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/audit/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    console.error('Failed to log audit event:', await response.text());
  }
}
