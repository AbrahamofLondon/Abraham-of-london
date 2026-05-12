/**
 * lib/sovereign/institutional-memory.ts
 *
 * Institutional Memory — longitudinal pattern tracking across multiple
 * diagnostic sessions for the same organisation.
 *
 * The returning-client experience is not a repeated questionnaire with
 * historical tabs. It is a conversation with an advisor who has been
 * watching the organisation for months. This module provides:
 *
 * - Pattern recurrence detection
 * - Contradiction cluster detection
 * - Arc narration (the organisation's trajectory story)
 * - Improvement velocity tracking
 * - Unresolved signal tracking
 *
 * SERVER_ONLY — raw pattern detection and memory scoring must never reach the client bundle.
 */

import "server-only";

import type { IntelligenceSignal, SignalSeverity } from "./intelligence-signals";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SessionSnapshot = {
  sessionId: string;
  sessionNumber: number;
  recordedAt: string; // ISO timestamp
  posture: "SOVEREIGN" | "ALIGNED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  trajectory: "IMPROVING" | "STABLE" | "DETERIORATING" | "COLLAPSING";

  scores: {
    authorityClarity: number;
    narrativeCoherence: number;
    interventionReadiness: number;
    executionReadiness: number;
    overallReadiness: number;
  };

  activeSignalIds: string[];
  failureModeCount: number;
  revenueBand?: string;
  orgState?: string;
};

export type RecurringPattern = {
  signalId: string;
  signalName: string;
  severity: SignalSeverity;
  occurrences: number;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
  consecutiveSessions: boolean;
  status: "PERSISTING" | "WORSENING" | "IMPROVING" | "RESOLVED";
  narrative: string;
};

export type ContradictionCluster = {
  id: string;
  description: string;
  firstDetected: string; // ISO date
  sessionsPresent: number;
  scoreA: { label: string; trend: "UP" | "DOWN" | "FLAT" };
  scoreB: { label: string; trend: "UP" | "DOWN" | "FLAT" };
  interpretive: string;
};

export type TrajectoryArc = {
  startPosture: string;
  currentPosture: string;
  direction: "ASCENDING" | "FLAT" | "DESCENDING" | "VOLATILE";
  sessionsCovered: number;
  timeSpanDays: number;
  narrative: string;
  improvementVelocity: number; // score delta per session, can be negative
};

export type InstitutionalMemoryReport = {
  organisationHandle: string;
  totalSessions: number;
  firstSession: string;
  latestSession: string;
  timeSpanDays: number;
  trajectoryArc: TrajectoryArc;
  recurringPatterns: RecurringPattern[];
  contradictionClusters: ContradictionCluster[];
  unresolvedSignals: string[];
  improvementSummary: string;
  primaryNarrative: string;
};

// ─── In-Memory Session Store ──────────────────────────────────────────────────
// In production, sessions are persisted to the database. This module
// provides the analysis layer over stored sessions.

// ─── Analysis Engine ─────────────────────────────────────────────────────────

/**
 * Builds an institutional memory report from a sequence of session snapshots.
 * Sessions must be ordered chronologically (oldest first).
 */
export function buildInstitutionalMemoryReport(
  organisationHandle: string,
  sessions: SessionSnapshot[],
  currentSignals: IntelligenceSignal[],
): InstitutionalMemoryReport {
  if (sessions.length === 0) {
    return emptyReport(organisationHandle);
  }

  const first = sessions[0]!;
  const latest = sessions[sessions.length - 1]!;
  const timeSpanDays = daysBetween(first.recordedAt, latest.recordedAt);

  const trajectoryArc = computeTrajectoryArc(sessions);
  const recurringPatterns = detectRecurringPatterns(sessions, currentSignals);
  const contradictionClusters = detectContradictionClusters(sessions);
  const unresolvedSignals = findUnresolvedSignals(sessions, currentSignals);
  const improvementSummary = buildImprovementSummary(sessions);
  const primaryNarrative = buildPrimaryNarrative(
    organisationHandle,
    sessions,
    trajectoryArc,
    recurringPatterns,
    contradictionClusters,
  );

  return {
    organisationHandle,
    totalSessions: sessions.length,
    firstSession: first.recordedAt,
    latestSession: latest.recordedAt,
    timeSpanDays,
    trajectoryArc,
    recurringPatterns,
    contradictionClusters,
    unresolvedSignals,
    improvementSummary,
    primaryNarrative,
  };
}

function computeTrajectoryArc(sessions: SessionSnapshot[]): TrajectoryArc {
  const first = sessions[0]!;
  const latest = sessions[sessions.length - 1]!;
  const timeSpanDays = daysBetween(first.recordedAt, latest.recordedAt);

  const readinessScores = sessions.map((s) => s.scores.overallReadiness);
  const first3 = readinessScores.slice(0, Math.min(3, readinessScores.length));
  const last3 = readinessScores.slice(-Math.min(3, readinessScores.length));
  const avgStart = mean(first3);
  const avgEnd = mean(last3);
  const improvementVelocity =
    sessions.length > 1
      ? Math.round(((avgEnd - avgStart) / (sessions.length - 1)) * 10) / 10
      : 0;

  const isVolatile = stdDev(readinessScores) > 15;

  const direction: TrajectoryArc["direction"] = isVolatile
    ? "VOLATILE"
    : avgEnd - avgStart > 8
      ? "ASCENDING"
      : avgEnd - avgStart < -8
        ? "DESCENDING"
        : "FLAT";

  const narrativeMap: Record<TrajectoryArc["direction"], string> = {
    ASCENDING: `Over ${sessions.length} sessions spanning ${timeSpanDays} days, your organisation has shown a consistent upward trajectory. The improvement is structural, not cosmetic — your readiness scores have moved ${Math.abs(Math.round(avgEnd - avgStart))} points on average. This is the kind of change that holds under pressure.`,
    DESCENDING: `Over ${sessions.length} sessions spanning ${timeSpanDays} days, your organisation's readiness scores have declined. This is not a warning to ignore — it is the pattern that precedes significant structural events if left unaddressed. The decline is ${Math.abs(Math.round(avgEnd - avgStart))} points on average across sessions.`,
    FLAT: `Over ${sessions.length} sessions spanning ${timeSpanDays} days, your organisation's readiness profile has remained largely stable. Stability is not the same as health — your current position has been consistent, for better or worse. The question is whether this stability reflects institutional strength or an equilibrium that conceals drift.`,
    VOLATILE: `Over ${sessions.length} sessions spanning ${timeSpanDays} days, your organisation's profile has been volatile — significant swings in both directions. Volatility at this scale typically reflects an institution in a transitional state: pressures are being absorbed but not resolved at the structural level. Watch for the pattern stabilising in a direction.`,
  };

  return {
    startPosture: first.posture,
    currentPosture: latest.posture,
    direction,
    sessionsCovered: sessions.length,
    timeSpanDays,
    narrative: narrativeMap[direction],
    improvementVelocity,
  };
}

function detectRecurringPatterns(
  sessions: SessionSnapshot[],
  currentSignals: IntelligenceSignal[],
): RecurringPattern[] {
  const signalHistory: Record<string, { sessions: SessionSnapshot[]; indices: number[] }> = {};

  sessions.forEach((session, idx) => {
    for (const signalId of session.activeSignalIds) {
      if (!signalHistory[signalId]) {
        signalHistory[signalId] = { sessions: [], indices: [] };
      }
      signalHistory[signalId].sessions.push(session);
      signalHistory[signalId].indices.push(idx);
    }
  });

  const patterns: RecurringPattern[] = [];

  for (const [signalId, history] of Object.entries(signalHistory)) {
    if (history.sessions.length < 2) continue;

    const currentSignal = currentSignals.find((s) => s.id === signalId);
    const isCurrentlyActive = currentSignals.some((s) => s.id === signalId);
    const isConsecutive = history.indices.every(
      (idx, i) => i === 0 || idx === (history.indices[i - 1] ?? 0) + 1,
    );

    const firstSession = history.sessions[0]!;
    const lastSession = history.sessions[history.sessions.length - 1]!;

    let status: RecurringPattern["status"];
    if (!isCurrentlyActive) {
      status = "RESOLVED";
    } else if (isConsecutive && history.sessions.length >= 3) {
      status = "PERSISTING";
    } else {
      status = "PERSISTING";
    }

    const narrative = buildRecurringPatternNarrative(
      currentSignal?.name ?? signalId,
      history.sessions.length,
      sessions.length,
      isCurrentlyActive,
      isConsecutive,
    );

    patterns.push({
      signalId,
      signalName: currentSignal?.name ?? signalId,
      severity: currentSignal?.severity ?? "CONCERN",
      occurrences: history.sessions.length,
      firstSeen: firstSession.recordedAt,
      lastSeen: lastSession.recordedAt,
      consecutiveSessions: isConsecutive,
      status,
      narrative,
    });
  }

  return patterns.sort((a, b) => {
    const ORDER: Record<SignalSeverity, number> = { CRITICAL: 4, ALERT: 3, CONCERN: 2, WATCH: 1 };
    return (ORDER[b.severity] ?? 0) - (ORDER[a.severity] ?? 0);
  });
}

function buildRecurringPatternNarrative(
  signalName: string,
  occurrences: number,
  totalSessions: number,
  isActive: boolean,
  isConsecutive: boolean,
): string {
  if (!isActive) {
    return `${signalName} was detected in ${occurrences} of your ${totalSessions} sessions but has not appeared in your most recent diagnostic. This suggests the underlying pattern has shifted, but monitor for re-emergence — resolved patterns that reappear typically do so under similar pressure conditions.`;
  }
  if (isConsecutive && occurrences >= 3) {
    return `${signalName} has appeared in ${occurrences} consecutive sessions. This is no longer a signal — it is a structural feature. It will not resolve without deliberate structural intervention. Each session it persists without intervention, it becomes more embedded in the organisation's operating patterns.`;
  }
  return `${signalName} has appeared in ${occurrences} of your ${totalSessions} sessions. The recurrence indicates an underlying structural condition that has not yet been addressed. Intermittent appearance often means the pattern is being managed symptomatically rather than resolved at the root.`;
}

function detectContradictionClusters(sessions: SessionSnapshot[]): ContradictionCluster[] {
  if (sessions.length < 2) return [];

  const clusters: ContradictionCluster[] = [];

  // Contradiction 1: Improving trajectory + declining authority clarity
  const authorityTrend = scoreTrend(sessions, "authorityClarity");
  const trajectoryImproving = sessions.some(
    (s) => s.trajectory === "IMPROVING" || s.posture === "ALIGNED" || s.posture === "SOVEREIGN",
  );
  const authorityDeclining = authorityTrend < -5;

  if (trajectoryImproving && authorityDeclining) {
    const sessionsPresent = sessions.filter(
      (s) =>
        (s.trajectory === "IMPROVING" || s.posture === "ALIGNED") &&
        s.scores.authorityClarity < (sessions[0]!.scores.authorityClarity ?? 60),
    ).length;

    if (sessionsPresent >= 2) {
      clusters.push({
        id: "authority-narrative-split",
        description: "Improving narrative trajectory against declining authority clarity",
        firstDetected: sessions[0]!.recordedAt,
        sessionsPresent,
        scoreA: { label: "Posture / trajectory", trend: "UP" },
        scoreB: { label: "Authority clarity", trend: "DOWN" },
        interpretive:
          "Your overall posture and trajectory metrics are improving, but authority clarity is declining. This pattern typically means the organisation is achieving outputs through informal coordination that is becoming less sustainable. The better things look on the surface, the more important it is to address the authority ambiguity underneath — because the informal coordination will eventually break under pressure.",
      });
    }
  }

  // Contradiction 2: High intervention readiness + no improvement in posture
  const readinessHigh = sessions.some((s) => s.scores.interventionReadiness > 65);
  const postureUnchanged =
    sessions.length >= 3 &&
    sessions.slice(-3).every((s) => s.posture === sessions[sessions.length - 1]!.posture);

  if (readinessHigh && postureUnchanged && sessions.length >= 3) {
    clusters.push({
      id: "readiness-stagnation",
      description: "High intervention readiness without corresponding posture improvement",
      firstDetected: sessions[1]?.recordedAt ?? sessions[0]!.recordedAt,
      sessionsPresent: sessions.length,
      scoreA: { label: "Intervention readiness", trend: "UP" },
      scoreB: { label: "Organisational posture", trend: "FLAT" },
      interpretive:
        "Your organisation shows high readiness to act, but your posture has not shifted across multiple sessions. This contradiction suggests the interventions being taken are not the right ones for the structural condition — or the interventions are being applied correctly but the posture metric is lagging. Worth examining: what has actually changed in the organisation, and does it match what the diagnostic was asking you to address?",
    });
  }

  // Contradiction 3: Narrative coherence improving + failure mode count stable/increasing
  const coherenceTrend = scoreTrend(sessions, "narrativeCoherence");
  const failureModesTrend =
    sessions.length >= 2
      ? sessions[sessions.length - 1]!.failureModeCount - sessions[0]!.failureModeCount
      : 0;

  if (coherenceTrend > 10 && failureModesTrend >= 0 && sessions.length >= 3) {
    clusters.push({
      id: "coherence-failure-divergence",
      description: "Improving narrative coherence with stable or increasing failure mode count",
      firstDetected: sessions[0]!.recordedAt,
      sessionsPresent: sessions.length,
      scoreA: { label: "Narrative coherence", trend: "UP" },
      scoreB: { label: "Failure mode count", trend: failureModesTrend > 0 ? "UP" : "FLAT" },
      interpretive:
        "Your narrative coherence is improving — the story the organisation tells about itself is getting cleaner and more consistent. But the failure mode count is not declining. This pattern is worth examining carefully: cleaner narratives over persistent failure modes can indicate the organisation is getting better at explaining its problems rather than fixing them.",
    });
  }

  return clusters;
}

function findUnresolvedSignals(
  sessions: SessionSnapshot[],
  currentSignals: IntelligenceSignal[],
): string[] {
  const currentSignalIds = new Set(currentSignals.map((s) => s.id));
  const pastSignalIds = new Set(sessions.flatMap((s) => s.activeSignalIds));

  // Signals present in past sessions and still active now
  return Array.from(currentSignalIds).filter((id) => pastSignalIds.has(id));
}

function buildImprovementSummary(sessions: SessionSnapshot[]): string {
  if (sessions.length < 2) return "Insufficient session history for improvement summary.";

  const first = sessions[0]!;
  const latest = sessions[sessions.length - 1]!;

  const deltas = {
    authorityClarity: latest.scores.authorityClarity - first.scores.authorityClarity,
    narrativeCoherence: latest.scores.narrativeCoherence - first.scores.narrativeCoherence,
    interventionReadiness:
      latest.scores.interventionReadiness - first.scores.interventionReadiness,
    executionReadiness: latest.scores.executionReadiness - first.scores.executionReadiness,
  };

  const improved = Object.entries(deltas)
    .filter(([, v]) => v > 5)
    .map(([k]) => formatMetricName(k));

  const declined = Object.entries(deltas)
    .filter(([, v]) => v < -5)
    .map(([k]) => formatMetricName(k));

  const parts: string[] = [];

  if (improved.length > 0) {
    parts.push(`Improved since first session: ${improved.join(", ")}.`);
  }
  if (declined.length > 0) {
    parts.push(`Declined since first session: ${declined.join(", ")}.`);
  }
  if (improved.length === 0 && declined.length === 0) {
    parts.push("Scores have remained largely stable across all tracked metrics.");
  }

  return parts.join(" ");
}

function buildPrimaryNarrative(
  handle: string,
  sessions: SessionSnapshot[],
  arc: TrajectoryArc,
  recurring: RecurringPattern[],
  contradictions: ContradictionCluster[],
): string {
  const parts: string[] = [];

  parts.push(arc.narrative);

  if (recurring.filter((p) => p.status === "PERSISTING").length > 0) {
    const persistingNames = recurring
      .filter((p) => p.status === "PERSISTING")
      .slice(0, 2)
      .map((p) => p.signalName)
      .join(" and ");
    parts.push(
      `The patterns that have persisted across your sessions — ${persistingNames} — have not resolved through the interventions attempted so far. Persistence across ${recurring[0]?.occurrences ?? 2}+ sessions signals a structural condition rather than a situational one.`,
    );
  }

  if (contradictions.length > 0) {
    parts.push(
      `Your diagnostic history contains ${contradictions.length} contradiction cluster${contradictions.length > 1 ? "s" : ""} — places where two scores are moving in directions that don't align. These are worth examining specifically, as they often reveal where the organisation's self-model is diverging from its operating reality.`,
    );
  }

  return parts.join(" ");
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function scoreTrend(
  sessions: SessionSnapshot[],
  metric: keyof SessionSnapshot["scores"],
): number {
  if (sessions.length < 2) return 0;
  const first = sessions[0]!.scores[metric];
  const last = sessions[sessions.length - 1]!.scores[metric];
  return last - first;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length);
}

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay);
}

function formatMetricName(key: string): string {
  const labels: Record<string, string> = {
    authorityClarity: "authority clarity",
    narrativeCoherence: "narrative coherence",
    interventionReadiness: "intervention readiness",
    executionReadiness: "execution readiness",
  };
  return labels[key] ?? key;
}

function emptyReport(handle: string): InstitutionalMemoryReport {
  return {
    organisationHandle: handle,
    totalSessions: 0,
    firstSession: "",
    latestSession: "",
    timeSpanDays: 0,
    trajectoryArc: {
      startPosture: "",
      currentPosture: "",
      direction: "FLAT",
      sessionsCovered: 0,
      timeSpanDays: 0,
      narrative: "No prior session history. This is your first diagnostic.",
      improvementVelocity: 0,
    },
    recurringPatterns: [],
    contradictionClusters: [],
    unresolvedSignals: [],
    improvementSummary: "First session — no improvement history yet.",
    primaryNarrative:
      "This is your first diagnostic session. Your institutional memory begins here. Future sessions will reveal patterns, trajectory, and the structural arc of your organisation over time.",
  };
}
