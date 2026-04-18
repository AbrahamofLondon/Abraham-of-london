/**
 * lib/diagnostics/session-thread.ts — Accumulative constitutional thread
 *
 * The thread starts at Stage 1 (Constitutional Diagnostic) and accumulates
 * findings from each downstream stage. Strategy Room and Executive Reporting
 * consume the accumulated thread as journey context.
 *
 * Thread is session-scoped (sessionStorage). No cross-device persistence.
 */

export const CONSTITUTIONAL_THREAD_KEY = "aol_constitutional_thread_v1";

// ---------------------------------------------------------------------------
// Stage finding types
// ---------------------------------------------------------------------------

export type TeamFindings = {
  completedAt: string;
  fragilityStatus: "STABLE" | "VOLATILE" | "FRACTURED" | "INSUFFICIENT_DATA";
  fragilityScore: number;
  dominantGapDomains: string[];
  overallGap: number;
  patternTitle: string;
  escalationRoute: string;
  narrative: string;
};

export type EnterpriseFindings = {
  completedAt: string;
  band: string;
  totalPct: number;
  weakBlocks: string[];
  patternTitle: string;
  route: string;
  narrative: string;
  decisionClarity?: number;
};

export type ExecutiveFindings = {
  completedAt: string;
  runKey: string;
  route: string;
  orgState: string;
  readinessTier: string;
  narrativeHeadline: string;
};

// ---------------------------------------------------------------------------
// Thread type
// ---------------------------------------------------------------------------

export type ConstitutionalThread = {
  source: "constitutional-diagnostic";
  createdAt: string;
  route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
  routeHref: string;
  confidence: number;
  posture: string;
  readinessTier: string;
  authorityType: string;
  domainScores: {
    coherence: number;
    authority: number;
    trust: number;
    pressure: number;
    friction: number;
    seriousness: number;
    governance: number;
  };
  failureModes: string[];
  recommendedInterventions: string[];
  rationale: string[];
  summary: {
    title: string;
    narrative: string;
    whatThisStageTests: string;
  };
  bridge: {
    teamAssessment: {
      prompts: string[];
      hypotheses: string[];
    };
    enterpriseAssessment: {
      watchpoints: string[];
      rationale: string;
    };
    strategyRoom: {
      summary: string;
      route: string;
      escalationAllowed: boolean;
    };
  };

  // Accumulated downstream findings
  teamFindings?: TeamFindings;
  enterpriseFindings?: EnterpriseFindings;
  executiveFindings?: ExecutiveFindings;
};

// ---------------------------------------------------------------------------
// Core persistence
// ---------------------------------------------------------------------------

export function saveConstitutionalThread(thread: ConstitutionalThread): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CONSTITUTIONAL_THREAD_KEY,
      JSON.stringify(thread),
    );
  } catch {
    // sessionStorage unavailable
  }
}

export function readConstitutionalThread(): ConstitutionalThread | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONSTITUTIONAL_THREAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConstitutionalThread;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearConstitutionalThread(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CONSTITUTIONAL_THREAD_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Accumulation: downstream stages write findings back into the thread
// ---------------------------------------------------------------------------

export function mergeTeamFindingsIntoThread(
  findings: TeamFindings,
): void {
  const thread = readConstitutionalThread();
  if (!thread) return;

  thread.teamFindings = findings;
  saveConstitutionalThread(thread);
}

export function mergeEnterpriseFindingsIntoThread(
  findings: EnterpriseFindings,
): void {
  const thread = readConstitutionalThread();
  if (!thread) return;

  thread.enterpriseFindings = findings;
  saveConstitutionalThread(thread);
}

export function mergeExecutiveFindingsIntoThread(
  findings: ExecutiveFindings,
): void {
  const thread = readConstitutionalThread();
  if (!thread) return;

  thread.executiveFindings = findings;
  saveConstitutionalThread(thread);
}

// ---------------------------------------------------------------------------
// Journey summary for display
// ---------------------------------------------------------------------------

export function getJourneySummary(thread: ConstitutionalThread): string[] {
  const lines: string[] = [];

  lines.push(
    `Constitutional reading: ${thread.route} (confidence ${thread.confidence}%, posture ${thread.posture})`,
  );

  if (thread.teamFindings) {
    lines.push(
      `Team assessment: ${thread.teamFindings.fragilityStatus} (gap ${thread.teamFindings.overallGap}pt, pattern: ${thread.teamFindings.patternTitle})`,
    );
  }

  if (thread.enterpriseFindings) {
    lines.push(
      `Enterprise assessment: ${thread.enterpriseFindings.band} (${thread.enterpriseFindings.totalPct}%, pattern: ${thread.enterpriseFindings.patternTitle})`,
    );
  }

  if (thread.executiveFindings) {
    lines.push(
      `Executive reporting: ${thread.executiveFindings.route} (${thread.executiveFindings.orgState})`,
    );
  }

  return lines;
}

export function getStageDeltaSummary(thread: ConstitutionalThread): string[] {
  const lines: string[] = [];
  const weakestDomain = Object.entries(thread.domainScores)
    .sort((a, b) => a[1] - b[1])[0];
  const firstFailure = thread.failureModes[0];

  lines.push(
    `Stage 1 identified ${firstFailure || `${weakestDomain?.[0] || "constitutional"} strain`} with ${thread.route.toLowerCase()} routing.`,
  );

  if (thread.teamFindings) {
    const domains = thread.teamFindings.dominantGapDomains.slice(0, 2).join(", ");
    lines.push(
      `Stage 2 confirmed ${Math.abs(thread.teamFindings.overallGap)}-point leadership-team divergence${domains ? ` across ${domains}` : ""}.`,
    );
  }

  if (thread.enterpriseFindings) {
    const weak = thread.enterpriseFindings.weakBlocks.slice(0, 2).join(", ");
    const decision = typeof thread.enterpriseFindings.decisionClarity === "number"
      ? `; recent-decision clarity ${thread.enterpriseFindings.decisionClarity}%`
      : "";
    lines.push(
      `Stage 3 found ${thread.enterpriseFindings.patternTitle || thread.enterpriseFindings.band}${weak ? ` in ${weak}` : ""}${decision}.`,
    );
  }

  if (thread.executiveFindings) {
    lines.push(
      `Stage 4 translated the ladder signal into ${thread.executiveFindings.route.toLowerCase()} executive interpretation.`,
    );
  }

  return lines.slice(0, 4);
}
