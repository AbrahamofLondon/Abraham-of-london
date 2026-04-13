// lib/analytics/session-tracker.ts
// ─── CONSTITUTIONAL SESSION TRACKING V2.0 ─────────────────────────────────────
// C7 DEBT: db.constitutionalSession and db.constitutionalSessionEvent do not
// exist in the Prisma schema. All DB persistence is stubbed. Business logic,
// types, and in-memory cache are preserved. Restore when C7 is resolved.

import { CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";
import { ConstitutionalDecision } from "@/lib/constitution/rules";

export type SessionEventType =
  | "SESSION_INIT"
  | "IMPRESSION"
  | "FOLLOW_UP"
  | "CONVERSION"
  | "INTERVENTION_CREATED"
  | "REPORT_VIEWED"
  | "PDF_EXPORTED"
  | "JSON_EXPORTED"
  | "CONSTITUTIONAL_APPEAL"
  | "CONSTITUTIONAL_OVERRIDE";

export interface SessionEvent {
  id: string;
  sessionId: string;
  campaignId: string;
  userId: string;
  eventType: SessionEventType;
  timestamp: string;
  canonicalSnapshot: CanonicalSectionsEnvelope | null;
  constitutionalDecision: ConstitutionalDecision | null;
  metadata: {
    url?: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
    duration?: number;
    score?: number;
    band?: string;
    route?: string;
    [key: string]: unknown;
  };
}

export interface Session {
  id: string;
  campaignId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  events: SessionEvent[];
  initialCanonicalSnapshot: CanonicalSectionsEnvelope | null;
  finalCanonicalSnapshot: CanonicalSectionsEnvelope | null;
  conversionAt?: string;
  conversionType?: SessionEventType;
  metadata: {
    userAgent?: string;
    ip?: string;
    source?: string;
    [key: string]: unknown;
  };
}

class ConstitutionalSessionTracker {
  private static instance: ConstitutionalSessionTracker;
  private sessionCache: Map<string, Session> = new Map();

  static getInstance(): ConstitutionalSessionTracker {
    if (!ConstitutionalSessionTracker.instance) {
      ConstitutionalSessionTracker.instance = new ConstitutionalSessionTracker();
    }
    return ConstitutionalSessionTracker.instance;
  }

  async initSession(
    campaignId: string,
    userId: string,
    canonicalSnapshot: CanonicalSectionsEnvelope,
    metadata?: {
      userAgent?: string;
      ip?: string;
      source?: string;
      url?: string;
    }
  ): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const session: Session = {
      id: sessionId,
      campaignId,
      userId,
      startedAt: now,
      lastActivityAt: now,
      events: [],
      initialCanonicalSnapshot: canonicalSnapshot,
      finalCanonicalSnapshot: null,
      metadata: {
        userAgent: metadata?.userAgent,
        ip: metadata?.ip,
        source: metadata?.source,
      },
    };

    await this.recordEvent(
      sessionId,
      campaignId,
      userId,
      "SESSION_INIT",
      canonicalSnapshot,
      null,
      { url: metadata?.url }
    );

    this.sessionCache.set(sessionId, session);

    // STUB: db.constitutionalSession.create not available (C7 debt)

    return session;
  }

  async recordEvent(
    sessionId: string,
    campaignId: string,
    userId: string,
    eventType: SessionEventType,
    canonicalSnapshot: CanonicalSectionsEnvelope | null,
    constitutionalDecision: ConstitutionalDecision | null = null,
    metadata?: Record<string, unknown>
  ): Promise<SessionEvent> {
    const now = new Date().toISOString();
    const event: SessionEvent = {
      id: crypto.randomUUID(),
      sessionId,
      campaignId,
      userId,
      eventType,
      timestamp: now,
      canonicalSnapshot,
      constitutionalDecision,
      metadata: metadata || {},
    };

    const cachedSession = this.sessionCache.get(sessionId);
    if (cachedSession) {
      cachedSession.events.push(event);
      cachedSession.lastActivityAt = now;
      if (eventType === "CONVERSION") {
        cachedSession.conversionAt = now;
        cachedSession.conversionType = eventType;
        cachedSession.finalCanonicalSnapshot = canonicalSnapshot;
      }
      this.sessionCache.set(sessionId, cachedSession);
    }

    // STUB: db.constitutionalSessionEvent.create not available (C7 debt)
    // STUB: db.constitutionalSession.update not available (C7 debt)

    return event;
  }

  async recordReportView(
    sessionId: string,
    campaignId: string,
    userId: string,
    canonicalSnapshot: CanonicalSectionsEnvelope,
    reportData?: {
      band?: string;
      score?: number;
      route?: string;
    }
  ): Promise<SessionEvent> {
    return this.recordEvent(
      sessionId,
      campaignId,
      userId,
      "REPORT_VIEWED",
      canonicalSnapshot,
      null,
      {
        band: reportData?.band,
        score: reportData?.score,
        route: reportData?.route,
        viewDuration: 0,
      }
    );
  }

  async recordPDFExport(
    sessionId: string,
    campaignId: string,
    userId: string,
    canonicalSnapshot: CanonicalSectionsEnvelope
  ): Promise<SessionEvent> {
    return this.recordEvent(
      sessionId,
      campaignId,
      userId,
      "PDF_EXPORTED",
      canonicalSnapshot,
      null,
      { format: "PDF" }
    );
  }

  async recordJSONExport(
    sessionId: string,
    campaignId: string,
    userId: string,
    canonicalSnapshot: CanonicalSectionsEnvelope
  ): Promise<SessionEvent> {
    return this.recordEvent(
      sessionId,
      campaignId,
      userId,
      "JSON_EXPORTED",
      canonicalSnapshot,
      null,
      { format: "JSON" }
    );
  }

  async recordConversion(
    sessionId: string,
    campaignId: string,
    userId: string,
    conversionType: SessionEventType,
    canonicalSnapshot: CanonicalSectionsEnvelope,
    constitutionalDecision: ConstitutionalDecision | null = null,
    metadata?: Record<string, unknown>
  ): Promise<SessionEvent> {
    return this.recordEvent(
      sessionId,
      campaignId,
      userId,
      conversionType,
      canonicalSnapshot,
      constitutionalDecision,
      { ...metadata, isConversion: true }
    );
  }

  async getSession(sessionId: string): Promise<Session | null> {
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId) || null;
    }

    // STUB: db.constitutionalSession.findUnique not available (C7 debt)
    return null;
  }

  async endSession(
    sessionId: string,
    finalCanonicalSnapshot?: CanonicalSectionsEnvelope
  ): Promise<void> {
    const cachedSession = this.sessionCache.get(sessionId);
    if (cachedSession) {
      cachedSession.endedAt = new Date().toISOString();
      if (finalCanonicalSnapshot) {
        cachedSession.finalCanonicalSnapshot = finalCanonicalSnapshot;
      }
      this.sessionCache.set(sessionId, cachedSession);
    }

    // STUB: db.constitutionalSession.update not available (C7 debt)
  }

  async getCampaignAnalytics(campaignId: string): Promise<{
    totalSessions: number;
    conversions: number;
    conversionRate: number;
    averageSessionDuration: number;
    eventBreakdown: Record<SessionEventType, number>;
    exportCount: number;
    reportViews: number;
    interventionCreated: number;
  }> {
    // STUB: db.constitutionalSession.findMany not available (C7 debt)
    // Returns zero-state analytics until C7 schema extension is applied.
    const sessions: Session[] = [];

    let totalDuration = 0;
    let conversions = 0;
    const eventBreakdown: Record<SessionEventType, number> = {} as Record<SessionEventType, number>;
    let exportCount = 0;
    let reportViews = 0;
    let interventionCreated = 0;

    for (const session of sessions) {
      if (session.conversionAt) conversions++;
      if (session.startedAt && session.lastActivityAt) {
        const duration =
          new Date(session.lastActivityAt).getTime() -
          new Date(session.startedAt).getTime();
        totalDuration += duration;
      }
      for (const event of session.events) {
        eventBreakdown[event.eventType] =
          (eventBreakdown[event.eventType] || 0) + 1;
        if (
          event.eventType === "PDF_EXPORTED" ||
          event.eventType === "JSON_EXPORTED"
        )
          exportCount++;
        if (event.eventType === "REPORT_VIEWED") reportViews++;
        if (event.eventType === "INTERVENTION_CREATED") interventionCreated++;
      }
    }

    return {
      totalSessions: sessions.length,
      conversions,
      conversionRate:
        sessions.length > 0 ? (conversions / sessions.length) * 100 : 0,
      averageSessionDuration:
        sessions.length > 0 ? totalDuration / sessions.length : 0,
      eventBreakdown,
      exportCount,
      reportViews,
      interventionCreated,
    };
  }
}

export const sessionTracker = ConstitutionalSessionTracker.getInstance();