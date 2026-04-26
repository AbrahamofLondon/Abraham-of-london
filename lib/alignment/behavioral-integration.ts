// lib/alignment/behavioral-integration.ts
// Connect to real-world data sources to verify commitments
// OAuth flow: redirects to /api/integrations/<provider>/connect
// Data: fetched from /api/integrations/signals?subjectId=<userId>

import { BehavioralDataSource } from "./enhanced-types";

const BEHAVIORAL_CONNECTIONS_KEY = "aol_behavioral_connections";

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
    // Primary: fetch from server with real OAuth data
    const response = await fetch(`/api/integrations/signals?subjectId=${encodeURIComponent(subjectId)}`, {
      credentials: "include",
    });

    if (response.ok) {
      const data: BehavioralDataSource[] = await response.json();
      // Cache in localStorage for quick access
      if (data.length > 0) {
        for (const source of data) {
          saveBehavioralConnection(source);
        }
      }
      return data;
    }

    // If server returns 401 (not authenticated), fall back to cached connections
    if (response.status === 401) {
      console.warn("[BEHAVIORAL_INTEGRATION] User not authenticated, using cached data");
      return getBehavioralConnections().filter(c => c.connectionId === subjectId);
    }

    console.warn(`[BEHAVIORAL_INTEGRATION] Server returned ${response.status}, using cached data`);
    return getBehavioralConnections().filter(c => c.connectionId === subjectId);
  } catch {
    // Fallback: return stored connections from localStorage
    console.warn("[BEHAVIORAL_INTEGRATION] Network error, using cached data");
    return getBehavioralConnections().filter(c => c.connectionId === subjectId);
  }
}

// ─── Contract Verification ────────────────────────────────────────────────────

/**
 * Verify contract completion using behavioral signals from connected data sources.
 *
 * This is the core function that the Pattern-Breaker Contract system uses to
 * verify whether a commitment has been fulfilled, using real data from
 * Google Calendar, Slack, and other integrated providers.
 */
export async function verifyWithBehavioralData(
  contractId: string,
  subjectId: string,
  commitment: string
): Promise<{ confidence: "high" | "medium" | "low"; status: "likely_completed" | "likely_not_completed" | "inconclusive"; evidence: string }> {
  const behavioralData = await getBehavioralData(subjectId);

  if (behavioralData.length === 0) {
    return {
      confidence: "low",
      status: "inconclusive",
      evidence: "No behavioral data sources connected. Connect Google Calendar or Slack in Settings > Integrations to enable behavioral verification."
    };
  }

  const signals = behavioralData.flatMap(d => Object.entries(d.signals));
  let confidenceScore = 0;
  const evidence: string[] = [];

  // Calendar integration: check meeting completion
  if (commitment.toLowerCase().includes("meeting") || commitment.toLowerCase().includes("call")) {
    const calendarData = behavioralData.find(d => d.type === "calendar");
    if (calendarData?.signals.meetingCompletion !== undefined) {
      const completion = calendarData.signals.meetingCompletion;
      if (completion > 0.7) {
        confidenceScore += 30;
        evidence.push(`Calendar shows ${Math.round(completion * 100)}% meeting completion rate`);
      } else if (completion < 0.3) {
        confidenceScore -= 20;
        evidence.push(`Calendar shows low meeting completion (${Math.round(completion * 100)}%)`);
      } else {
        confidenceScore += 10;
        evidence.push(`Calendar shows moderate meeting completion (${Math.round(completion * 100)}%)`);
      }
    }
  }

  // Task management: check task closure
  if (commitment.toLowerCase().includes("task") || commitment.toLowerCase().includes("complete")) {
    const taskData = behavioralData.find(d => d.type === "jira" || d.type === "linear");
    if (taskData?.signals.taskClosureRate !== undefined) {
      if (taskData.signals.taskClosureRate > 0.6) {
        confidenceScore += 25;
        evidence.push(`Task closure rate: ${Math.round(taskData.signals.taskClosureRate * 100)}%`);
      } else if (taskData.signals.taskClosureRate > 0.3) {
        confidenceScore += 10;
        evidence.push(`Task closure rate: ${Math.round(taskData.signals.taskClosureRate * 100)}% (moderate)`);
      } else {
        confidenceScore -= 15;
        evidence.push(`Task closure rate: ${Math.round(taskData.signals.taskClosureRate * 100)}% (low)`);
      }
    }
  }

  // Communication: check responsiveness
  if (commitment.toLowerCase().includes("respond") || commitment.toLowerCase().includes("answer")) {
    const emailData = behavioralData.find(d => d.type === "email");
    if (emailData?.signals.emailResponsiveness !== undefined && emailData.signals.emailResponsiveness < 24) {
      confidenceScore += 15;
      evidence.push(`Email response time: ${emailData.signals.emailResponsiveness} hours (within threshold)`);
    }

    const slackData = behavioralData.find(d => d.type === "slack");
    if (slackData?.signals.slackResponsiveness !== undefined) {
      const resp = slackData.signals.slackResponsiveness;
      if (resp < 4) {
        confidenceScore += 20;
        evidence.push(`Slack response time: ${resp} hours (responsive)`);
      } else if (resp < 24) {
        confidenceScore += 10;
        evidence.push(`Slack response time: ${resp} hours (moderate)`);
      } else {
        confidenceScore -= 10;
        evidence.push(`Slack response time: ${resp} hours (slow)`);
      }
    }
  }

  let status: "likely_completed" | "likely_not_completed" | "inconclusive";
  let confidence: "high" | "medium" | "low";

  if (confidenceScore >= 50) {
    status = "likely_completed";
    confidence = "high";
  } else if (confidenceScore <= -20) {
    status = "likely_not_completed";
    confidence = "high";
  } else if (confidenceScore > 0) {
    status = "likely_completed";
    confidence = "medium";
  } else {
    status = "inconclusive";
    confidence = "low";
  }

  return {
    confidence,
    status,
    evidence: evidence.join("; ") || "Insufficient behavioral signals from connected data sources"
  };
}
