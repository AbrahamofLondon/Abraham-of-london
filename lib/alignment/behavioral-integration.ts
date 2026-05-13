// lib/alignment/behavioral-integration.ts
// Connect to real-world data sources to verify commitments
// OAuth flow: redirects to /api/integrations/<provider>/connect
// Data: fetched from /api/integrations/signals?subjectId=<userId>

import { BehavioralDataSource } from "./enhanced-types";

const BEHAVIORAL_CONNECTIONS_KEY = "aol_behavioral_connections";

// ─── Commitment Classification ────────────────────────────────────────────────

export type CommitmentCategory =
  | "MEETING_ATTENDANCE"
  | "MEETING_REDUCTION"
  | "RECURRING_CADENCE_STABILITY"
  | "RESPONSE_DISCIPLINE"
  | "EXECUTION_FOLLOW_THROUGH"
  | "UNKNOWN";

export type VerificationStatus =
  | "verified"
  | "partially_verified"
  | "contradicted"
  | "insufficient_evidence"
  | "not_applicable";

const CATEGORY_PATTERNS: Array<{ category: CommitmentCategory; keywords: string[] }> = [
  // Checked before MEETING_ATTENDANCE — "reduce meetings" is a different commitment
  // from "attend meetings" and must not be misclassified.
  {
    category: "MEETING_REDUCTION",
    keywords: [
      "reduce meetings",
      "reduce calls",
      "reduce reviews",
      "reduce sessions",
      "fewer meetings",
      "cut meetings",
      "less meetings",
      "cancel meetings",
      "cancel calls",
      "cancel reviews",
      "cancel sessions",
      "cancel meeting overload",
      "eliminate meetings",
      "reduce cadence",
      "reduce recurring meetings",
    ],
  },
  // Checked before RECURRING_CADENCE_STABILITY — "weekly call" is meeting attendance,
  // not cadence management. MEETING_ATTENDANCE must win on attendance verbs first.
  {
    category: "MEETING_ATTENDANCE",
    keywords: [
      "attend meeting",
      "attend call",
      "attend review",
      "attend session",
      "show up meeting",
      "turn up meeting",
      "be present meeting",
      "join meeting",
      "join call",
      "join review",
      "join session",
      "weekly call",
      "weekly meeting",
      "board meeting",
      "one-on-one",
      "1:1 session",
      "check-in",
    ],
  },
  {
    category: "RECURRING_CADENCE_STABILITY",
    keywords: [
      "maintain cadence",
      "keep cadence",
      "consistent cadence",
      "recurring review",
      "recurring reviews",
      "weekly review cadence",
      "daily standup",
      "daily standups",
      "monthly check-in",
      "every week",
      "every day",
      "routine",
      "stop cancelling recurring",
      "fortnightly checkpoint",
    ],
  },
  {
    category: "RESPONSE_DISCIPLINE",
    keywords: ["respond", "reply", "answer", "get back", "communication", "email", "message", "slack", "inbox", "follow up"],
  },
  {
    category: "EXECUTION_FOLLOW_THROUGH",
    keywords: ["complete", "deliver", "ship", "finish", "execute", "follow through", "action", "done", "close", "resolve", "implement", "launch"],
  },
];

/**
 * Match a keyword phrase against text using word-boundary-aware regex.
 *
 * Each token is matched as a whole token via lookarounds so substring collisions
 * like "call" inside "recall" are excluded. Multi-word phrases allow up to
 * three intervening filler words so variants like "reduce my meetings" still
 * match without treating distant, loosely related words as equivalent.
 */
function matchesKeyword(text: string, keyword: string): boolean {
  const words = keyword.split(" ");
  const pattern = words
    .map((word) => `(?<!\\w)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\w)`)
    .join("(?:\\W+\\w+){0,3}\\W+");
  return new RegExp(pattern, "i").test(text);
}

/**
 * Classify a commitment text into a deterministic category.
 * Evaluates patterns in priority order — more specific patterns first.
 * Returns UNKNOWN when no pattern matches; this is honest, not a failure.
 */
export function classifyCommitment(commitment: string): CommitmentCategory {
  for (const { category, keywords } of CATEGORY_PATTERNS) {
    if (keywords.some((kw) => matchesKeyword(commitment, kw))) {
      return category;
    }
  }
  return "UNKNOWN";
}

// ─── Signal-Based Verification ────────────────────────────────────────────────

interface CategoryVerificationResult {
  verificationStatus: VerificationStatus;
  evidenceNotes: string[];
}

function verifyByCategory(
  category: CommitmentCategory,
  calendarData: BehavioralDataSource | undefined,
  taskData: BehavioralDataSource | undefined,
  slackData: BehavioralDataSource | undefined,
  emailData: BehavioralDataSource | undefined,
): CategoryVerificationResult {
  const notes: string[] = [];

  switch (category) {
    case "MEETING_ATTENDANCE": {
      const cal = calendarData?.signals;
      if (!cal) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["No calendar integration connected. Connect Google Calendar to verify meeting attendance commitments."] };
      }
      const attendanceRate = cal.meetingAttendanceRate;
      const cancellationRate = cal.meetingCancellationRate;

      if (attendanceRate === undefined) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["Calendar connected but no self-attendance data available for the period."] };
      }

      if (attendanceRate >= 0.75) {
        notes.push(`Meeting attendance rate is ${Math.round(attendanceRate * 100)}% — strong execution signal.`);
      } else if (attendanceRate >= 0.50) {
        notes.push(`Meeting attendance rate is ${Math.round(attendanceRate * 100)}% — moderate. Below the 75% threshold for full verification.`);
      } else {
        notes.push(`Meeting attendance rate is ${Math.round(attendanceRate * 100)}% — below the threshold expected for this commitment.`);
      }

      if (cancellationRate !== undefined && cancellationRate >= 0.40) {
        notes.push(`Cancellation rate is ${Math.round(cancellationRate * 100)}% — this challenges claimed attendance commitment even where confirmed meetings show good attendance.`);
      }

      const status =
        attendanceRate >= 0.75 && (cancellationRate === undefined || cancellationRate < 0.40) ? "verified"
        : attendanceRate >= 0.75 ? "partially_verified"
        : attendanceRate >= 0.50 ? "partially_verified"
        : "contradicted";

      return { verificationStatus: status, evidenceNotes: notes };
    }

    case "MEETING_REDUCTION": {
      const cal = calendarData?.signals;
      if (!cal || cal.meetingCancellationRate === undefined) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["No calendar data available to assess meeting reduction commitment."] };
      }
      const rate = cal.meetingCancellationRate;
      // High cancellation rate supports this commitment — the user is actively reducing meetings.
      if (rate >= 0.30) {
        notes.push(`Cancellation rate is ${Math.round(rate * 100)}% — consistent with an active meeting reduction commitment.`);
        return { verificationStatus: "partially_verified", evidenceNotes: notes };
      }
      if (rate < 0.10) {
        notes.push(`Cancellation rate is ${Math.round(rate * 100)}% — very few meetings are being cancelled. This contradicts a stated reduction commitment.`);
        return { verificationStatus: "contradicted", evidenceNotes: notes };
      }
      notes.push(`Cancellation rate is ${Math.round(rate * 100)}% — some reduction activity, but below the threshold to confirm a systematic commitment.`);
      return { verificationStatus: "insufficient_evidence", evidenceNotes: notes };
    }

    case "RECURRING_CADENCE_STABILITY": {
      const cal = calendarData?.signals;
      if (!cal || cal.recurringMeetingStability === undefined) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["No recurring meeting data available. Calendar may not have recurring events in the period, or Google Calendar is not connected."] };
      }
      const stability = cal.recurringMeetingStability;
      if (stability >= 0.75) {
        notes.push(`Recurring meeting stability is ${Math.round(stability * 100)}% — commitment to cadence is well-supported.`);
        return { verificationStatus: "verified", evidenceNotes: notes };
      }
      if (stability >= 0.50) {
        notes.push(`Recurring meeting stability is ${Math.round(stability * 100)}% — moderate. Below the 75% threshold for full verification.`);
        return { verificationStatus: "partially_verified", evidenceNotes: notes };
      }
      notes.push(`Recurring meeting stability is ${Math.round(stability * 100)}% — cadence has collapsed below the level expected for this commitment.`);
      return { verificationStatus: "contradicted", evidenceNotes: notes };
    }

    case "RESPONSE_DISCIPLINE": {
      const slack = slackData?.signals?.slackResponsiveness;
      const email = emailData?.signals?.emailResponsiveness;

      if (slack === undefined && email === undefined) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["No communication platform data available. Connect Slack to verify response discipline commitments."] };
      }

      if (slack !== undefined) {
        if (slack < 4) {
          notes.push(`Slack response time is ${slack} hours — within the threshold for responsive communication.`);
          return { verificationStatus: "verified", evidenceNotes: notes };
        }
        if (slack < 24) {
          notes.push(`Slack response time is ${slack} hours — moderate response time. Commitment partially supported.`);
          if (email !== undefined && email < 24) {
            notes.push(`Email response time is ${email} hours — also within daily threshold.`);
          }
          return { verificationStatus: "partially_verified", evidenceNotes: notes };
        }
        notes.push(`Slack response time is ${slack} hours — exceeds 24-hour threshold. Contradicts a response discipline commitment.`);
        return { verificationStatus: "contradicted", evidenceNotes: notes };
      }

      // Slack not available — fall back to email only
      if (email !== undefined) {
        if (email < 24) {
          notes.push(`Email response time is ${email} hours. Partial corroboration (Slack data unavailable).`);
          return { verificationStatus: "partially_verified", evidenceNotes: notes };
        }
        notes.push(`Email response time is ${email} hours — exceeds daily threshold.`);
        return { verificationStatus: "contradicted", evidenceNotes: notes };
      }

      return { verificationStatus: "insufficient_evidence", evidenceNotes: notes };
    }

    case "EXECUTION_FOLLOW_THROUGH": {
      const task = taskData?.signals;
      const cal = calendarData?.signals;

      if (!task && !cal) {
        return { verificationStatus: "insufficient_evidence", evidenceNotes: ["No task management or calendar data available to verify execution follow-through."] };
      }

      if (task?.taskClosureRate !== undefined) {
        const rate = task.taskClosureRate;
        if (rate >= 0.60) {
          notes.push(`Task closure rate is ${Math.round(rate * 100)}% — strong execution signal.`);
          return { verificationStatus: "verified", evidenceNotes: notes };
        }
        if (rate >= 0.30) {
          notes.push(`Task closure rate is ${Math.round(rate * 100)}% — partial execution evidence.`);
          return { verificationStatus: "partially_verified", evidenceNotes: notes };
        }
        notes.push(`Task closure rate is ${Math.round(rate * 100)}% — below threshold. Contradicts execution follow-through commitment.`);
        return { verificationStatus: "contradicted", evidenceNotes: notes };
      }

      // Fall back to calendar completion as a proxy for execution follow-through
      if (cal?.meetingCompletion !== undefined) {
        const completion = cal.meetingCompletion;
        notes.push(`Task management data unavailable. Using calendar completion (${Math.round(completion * 100)}%) as a weak proxy for execution follow-through.`);
        if (completion >= 0.75) {
          return { verificationStatus: "partially_verified", evidenceNotes: notes };
        }
        return { verificationStatus: "insufficient_evidence", evidenceNotes: notes };
      }

      return { verificationStatus: "insufficient_evidence", evidenceNotes: ["Signal coverage is insufficient to verify this execution commitment."] };
    }

    case "UNKNOWN":
      return {
        verificationStatus: "insufficient_evidence",
        evidenceNotes: ["Commitment could not be classified into a verifiable category. Behavioral signals require a recognisable commitment type to apply evidence rules."],
      };
  }
}

// ─── Legacy confidence/status mapping ─────────────────────────────────────────
// Preserves the existing return shape for callers that depend on it.

function toLegacyConfidence(status: VerificationStatus): "high" | "medium" | "low" {
  switch (status) {
    case "verified": return "high";
    case "partially_verified": return "medium";
    case "contradicted": return "high";
    default: return "low";
  }
}

function toLegacyStatus(status: VerificationStatus): "likely_completed" | "likely_not_completed" | "inconclusive" {
  switch (status) {
    case "verified": return "likely_completed";
    case "partially_verified": return "likely_completed";
    case "contradicted": return "likely_not_completed";
    default: return "inconclusive";
  }
}

// ─── OAuth Initiation ─────────────────────────────────────────────────────────

/**
 * Connect to Google Calendar via OAuth.
 * Redirects to the server-side OAuth flow which handles the full
 * authorization code grant flow, token storage, and callback.
 *
 * After successful authorization, the user is redirected back to
 * /settings/integrations?success=google_calendar
 */
export async function connectGoogleCalendar(): Promise<BehavioralDataSource | null> {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  window.location.href = `${baseUrl}/api/integrations/google/connect`;
  return null; // The redirect handles the flow; callback returns to settings page
}

/**
 * Connect to Slack via OAuth.
 * Redirects to the server-side OAuth flow.
 *
 * After successful authorization, the user is redirected back to
 * /settings/integrations?success=slack
 */
export async function connectSlack(): Promise<BehavioralDataSource | null> {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  window.location.href = `${baseUrl}/api/integrations/slack/connect`;
  return null; // The redirect handles the flow; callback returns to settings page
}

// ─── Local Storage Cache (for quick UI state) ─────────────────────────────────

export function saveBehavioralConnection(connection: BehavioralDataSource): void {
  try {
    const connections = getBehavioralConnections();
    const updated = [...connections.filter(c => c.type !== connection.type), connection];
    localStorage.setItem(BEHAVIORAL_CONNECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save behavioral connection:", error);
  }
}

export function getBehavioralConnections(): BehavioralDataSource[] {
  try {
    const raw = localStorage.getItem(BEHAVIORAL_CONNECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get behavioral data for a subject.
 * In production: fetches from server with OAuth tokens via /api/integrations/signals.
 * Falls back to localStorage cache for demo/offline.
 */
export async function getBehavioralData(subjectId: string): Promise<BehavioralDataSource[]> {
  try {
    const response = await fetch(`/api/integrations/signals?subjectId=${encodeURIComponent(subjectId)}`, {
      credentials: "include",
    });

    if (response.ok) {
      const data: BehavioralDataSource[] = await response.json();
      if (data.length > 0) {
        for (const source of data) {
          saveBehavioralConnection(source);
        }
      }
      return data;
    }

    if (response.status === 401) {
      console.warn("[BEHAVIORAL_INTEGRATION] User not authenticated, using cached data");
      return getBehavioralConnections().filter(c => c.connectionId === subjectId);
    }

    console.warn(`[BEHAVIORAL_INTEGRATION] Server returned ${response.status}, using cached data`);
    return getBehavioralConnections().filter(c => c.connectionId === subjectId);
  } catch {
    console.warn("[BEHAVIORAL_INTEGRATION] Network error, using cached data");
    return getBehavioralConnections().filter(c => c.connectionId === subjectId);
  }
}

// ─── Contract Verification ────────────────────────────────────────────────────

/**
 * Verify contract completion using behavioral signals from connected data sources.
 *
 * Classifies the commitment text into a deterministic category, then applies
 * evidence rules specific to that category. Evidence is matched to the signal
 * type that is actually relevant — not via keyword scoring, which conflates
 * surface text with behavioral reality.
 *
 * The existing confidence/status fields are preserved for backward compatibility.
 * Callers that want structured output should use verificationStatus and evidenceNotes.
 */
export async function verifyWithBehavioralData(
  contractId: string,
  subjectId: string,
  commitment: string,
): Promise<{
  confidence: "high" | "medium" | "low";
  status: "likely_completed" | "likely_not_completed" | "inconclusive";
  evidence: string;
  verificationStatus: VerificationStatus;
  evidenceNotes: string[];
  category: CommitmentCategory;
}> {
  const behavioralData = await getBehavioralData(subjectId);

  if (behavioralData.length === 0) {
    return {
      confidence: "low",
      status: "inconclusive",
      evidence: "No behavioral data sources connected. Connect Google Calendar or Slack in Settings > Integrations to enable behavioral verification.",
      verificationStatus: "insufficient_evidence",
      evidenceNotes: ["No behavioral data sources connected."],
      category: "UNKNOWN",
    };
  }

  const category = classifyCommitment(commitment);

  const calendarData = behavioralData.find((d) => d.type === "calendar");
  const taskData = behavioralData.find((d) => d.type === "jira" || d.type === "linear");
  const slackData = behavioralData.find((d) => d.type === "slack");
  const emailData = behavioralData.find((d) => d.type === "email");

  const { verificationStatus, evidenceNotes } = verifyByCategory(
    category,
    calendarData,
    taskData,
    slackData,
    emailData,
  );

  return {
    confidence: toLegacyConfidence(verificationStatus),
    status: toLegacyStatus(verificationStatus),
    evidence: evidenceNotes.join(" ") || "Insufficient behavioral signals from connected data sources.",
    verificationStatus,
    evidenceNotes,
    category,
  };
}
