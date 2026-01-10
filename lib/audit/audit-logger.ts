interface AuditEvent {
  action: string;
  userId: string;
  userAgent?: string;
  ip?: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp?: string;
}

export class AuditLogger {
  private service: string;
  private environment: string;

  constructor(config: { service: string; environment: string }) {
    this.service = config.service;
    this.environment = config.environment;
  }

  async log(event: Omit<AuditEvent, 'timestamp'>) {
    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // In development, log to console
    if (this.environment === 'development') {
      console.log('[AUDIT]', fullEvent);
    }

    // In production, send to logging service
    if (this.environment === 'production') {
      try {
        await fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullEvent),
        });
      } catch (error) {
        console.error('Failed to send audit log:', error);
      }
    }

    // Optionally save to localStorage for debugging
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.unshift(fullEvent);
      if (logs.length > 100) logs.pop(); // Keep last 100 logs
      localStorage.setItem('audit_logs', JSON.stringify(logs));
    }

    return fullEvent;
  }

  async query(filters: Partial<AuditEvent>) {
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      return logs.filter((log: AuditEvent) => {
        return Object.entries(filters).every(([key, value]) => 
          log[key as keyof AuditEvent] === value
        );
      });
    }
    return [];
  }
}
