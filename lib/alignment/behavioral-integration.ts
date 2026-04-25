// lib/alignment/behavioral-integration.ts
// Connect to real-world data sources to verify commitments

import { BehavioralDataSource } from "./enhanced-types";

const BEHAVIORAL_CONNECTIONS_KEY = "aol_behavioral_connections";

// Store OAuth connections
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

export function getBehavioralData(subjectId: string): BehavioralDataSource[] {
  // In production: fetch from server with OAuth tokens
  // For demo: return stored connections
  return getBehavioralConnections().filter(c => c.connectionId === subjectId);
}

// Verify contract completion using behavioral signals
export async function verifyWithBehavioralData(
  contractId: string,
  subjectId: string,
  commitment: string
): Promise<{ confidence: "high" | "medium" | "low"; status: "likely_completed" | "likely_not_completed" | "inconclusive"; evidence: string }> {
  const behavioralData = getBehavioralData(subjectId);
  
  if (behavioralData.length === 0) {
    return {
      confidence: "low",
      status: "inconclusive",
      evidence: "No behavioral data sources connected"
    };
  }
  
  const signals = behavioralData.flatMap(d => Object.entries(d.signals));
  let confidenceScore = 0;
  const evidence: string[] = [];
  
  // Calendar integration: check meeting completion
  if (commitment.toLowerCase().includes("meeting") || commitment.toLowerCase().includes("call")) {
    const calendarData = behavioralData.find(d => d.type === "calendar");
    if (calendarData?.signals.meetingCompletion) {
      if (calendarData.signals.meetingCompletion > 0.7) {
        confidenceScore += 30;
        evidence.push(`Calendar shows ${Math.round(calendarData.signals.meetingCompletion * 100)}% meeting completion`);
      } else if (calendarData.signals.meetingCompletion < 0.3) {
        confidenceScore -= 20;
        evidence.push(`Calendar shows low meeting completion (${Math.round(calendarData.signals.meetingCompletion * 100)}%)`);
      }
    }
  }
  
  // Task management: check task closure
  if (commitment.toLowerCase().includes("task") || commitment.toLowerCase().includes("complete")) {
    const taskData = behavioralData.find(d => d.type === "jira" || d.type === "linear");
    if (taskData?.signals.taskClosureRate) {
      if (taskData.signals.taskClosureRate > 0.6) {
        confidenceScore += 25;
        evidence.push(`Task closure rate: ${Math.round(taskData.signals.taskClosureRate * 100)}%`);
      }
    }
  }
  
  // Communication: check responsiveness
  if (commitment.toLowerCase().includes("respond") || commitment.toLowerCase().includes("answer")) {
    const emailData = behavioralData.find(d => d.type === "email");
    if (emailData?.signals.emailResponsiveness && emailData.signals.emailResponsiveness < 24) {
      confidenceScore += 15;
      evidence.push(`Email response time: ${emailData.signals.emailResponsiveness} hours (within threshold)`);
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
    evidence: evidence.join("; ") || "Insufficient behavioral signals"
  };
}

/**
 * Connect to Google Calendar via OAuth.
 *
 * CURRENT STATUS: Returns a pending connection that signals "awaiting OAuth".
 * The actual OAuth flow requires Google Cloud Console credentials + callback URL.
 * When implemented, this will redirect to Google OAuth consent screen,
 * receive the callback, and store the access token server-side.
 *
 * The UI should show: "Calendar connection requested. OAuth integration pending."
 */
export async function connectGoogleCalendar(): Promise<BehavioralDataSource | null> {
  // TODO: Implement actual OAuth flow via /api/integrations/google/connect
  // For now, create a pending connection that does not fake any signal data
  return {
    type: "calendar",
    connectionId: `cal_pending_${Date.now()}`,
    connectedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    status: "disconnected", // honest status — not "active" until OAuth completes
    signals: {}, // no fabricated signals
  };
}

/**
 * Connect to Slack via OAuth.
 *
 * CURRENT STATUS: Returns a pending connection. No mock data.
 * Actual implementation requires Slack App OAuth flow.
 */
export async function connectSlack(): Promise<BehavioralDataSource | null> {
  // TODO: Implement actual OAuth flow via /api/integrations/slack/connect
  return {
    type: "slack",
    connectionId: `slack_pending_${Date.now()}`,
    connectedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    status: "disconnected", // honest status
    signals: {}, // no fabricated signals
  };
}