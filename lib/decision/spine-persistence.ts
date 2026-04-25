/**
 * Spine Persistence — two-tier storage for the intelligence spine.
 *
 * Session tier: sessionStorage (client-side, same-tab).
 * DB tier: DiagnosticJourney.mergedTensionThread (PostgreSQL, cross-device).
 *
 * Dual-write: spine saves also write backward-compatible ConstitutionalThread
 * so unmigrated pages continue to function during transition.
 */

import type { IntelligenceSpine } from "./intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SPINE_SESSION_KEY = "aol_intelligence_spine_v1";

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TIER (client-side)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save spine to sessionStorage.
 * Also writes backward-compatible ConstitutionalThread for unmigrated pages.
 */
export function saveSpineToSession(spine: IntelligenceSpine): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SPINE_SESSION_KEY, JSON.stringify(spine));
    writeBackwardCompatThread(spine);
  } catch {
    // sessionStorage unavailable or quota exceeded
  }
}

/**
 * Load spine from sessionStorage.
 */
export function loadSpineFromSession(): IntelligenceSpine | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SPINE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntelligenceSpine;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear spine from sessionStorage.
 */
export function clearSpineFromSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SPINE_SESSION_KEY);
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DB TIER (server-side, called via API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist spine to the database via API call.
 * Uses DiagnosticJourney.mergedTensionThread to store the spine snapshot.
 */
export async function persistSpineToDB(spine: IntelligenceSpine): Promise<void> {
  try {
    await fetch("/api/diagnostics/spine/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spine }),
    });
  } catch {
    // DB persistence is best-effort from client.
    // Session tier is the primary for in-flight assessments.
    console.warn("[spine-persistence] DB persist failed — session tier is authoritative");
  }
}

/**
 * Load spine from the database via API call.
 * Used for returning users or cross-device continuity.
 */
export async function loadSpineFromDB(email: string): Promise<IntelligenceSpine | null> {
  try {
    const res = await fetch(`/api/diagnostics/spine/load?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json() as { spine?: IntelligenceSpine };
    return data.spine ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE PERSISTENCE (for API routes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Server-side spine persistence. Called from API routes.
 * Upserts the spine into DiagnosticJourney.mergedTensionThread.
 */
export async function persistSpineToJourney(
  spine: IntelligenceSpine,
  prismaClient: {
    diagnosticJourney: {
      upsert: (args: {
        where: { journeyKey: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<unknown>;
    };
  },
): Promise<void> {
  const journeyKey = `spine_${spine.email ?? spine.id}`;
  const subjectKey = spine.email ?? spine.userId ?? spine.id;

  await prismaClient.diagnosticJourney.upsert({
    where: { journeyKey },
    create: {
      journeyKey,
      subjectKey,
      email: spine.email ?? null,
      userId: spine.userId ?? null,
      diagnosticType: "intelligence_spine",
      mergedTensionThread: spine as unknown as Record<string, unknown>,
      status: "active",
    },
    update: {
      mergedTensionThread: spine as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    },
  });
}

/**
 * Server-side spine loading. Called from API routes.
 */
export async function loadSpineFromJourney(
  email: string,
  prismaClient: {
    diagnosticJourney: {
      findFirst: (args: {
        where: Record<string, unknown>;
        orderBy: Record<string, string>;
      }) => Promise<{ mergedTensionThread: unknown } | null>;
    };
  },
): Promise<IntelligenceSpine | null> {
  const record = await prismaClient.diagnosticJourney.findFirst({
    where: {
      email,
      diagnosticType: "intelligence_spine",
      status: "active",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!record?.mergedTensionThread) return null;

  const spine = record.mergedTensionThread as unknown as IntelligenceSpine;
  if (!spine.id || !spine.case) return null;

  return spine;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPATIBILITY — ConstitutionalThread dual-write
// ─────────────────────────────────────────────────────────────────────────────

const CONSTITUTIONAL_THREAD_KEY = "aol_constitutional_thread_v1";

/**
 * Write a backward-compatible ConstitutionalThread from spine state.
 * This allows unmigrated pages (Team, Enterprise) to continue reading
 * from the old sessionStorage key during transition.
 */
function writeBackwardCompatThread(spine: IntelligenceSpine): void {
  if (typeof window === "undefined") return;

  // Only write if we have constitutional stage data
  const constitutionalEvent = spine.history.find((e) => e.stage === "constitutional");

  const thread = {
    source: "constitutional-diagnostic" as const,
    createdAt: spine.createdAt,
    route: mapConditionToRoute(spine.deterministic.conditionClass),
    routeHref: "/diagnostics/team-assessment",
    confidence: Math.round(spine.c3.specificityScore * 100),
    posture: spine.deterministic.conditionClass,
    readinessTier: spine.c3.tier === "FULL_SYNTHESIS" ? "EXECUTION_READY" : "DIAGNOSTIC",
    authorityType: spine.deterministic.conditionClass === "authority" ? "UNCLEAR" : "DIRECT",
    domainScores: constitutionalEvent?.snapshot?.domainScores ?? {
      coherence: 50,
      authority: spine.deterministic.conditionClass === "authority" ? 30 : 60,
      trust: 50,
      pressure: 50,
      friction: 50,
      seriousness: 50,
      governance: 50,
    },
    failureModes: [spine.deterministic.conditionClass],
    recommendedInterventions: [spine.synthesis?.concreteMove ?? "Complete structural assessment"],
    rationale: [spine.synthesis?.verdict ?? `Condition: ${spine.deterministic.conditionClass}`],
    summary: {
      title: spine.synthesis?.verdict?.slice(0, 80) ?? `${spine.deterministic.conditionClass} condition detected`,
      narrative: spine.synthesis?.verdict ?? "Complete the structural assessment ladder for full analysis.",
      whatThisStageTests: "Structural conditions sustaining the decision state",
    },
    bridge: {
      teamAssessment: {
        prompts: ["How does the team perceive this decision?"],
        hypotheses: [`The ${spine.deterministic.conditionClass} condition may be reflected in team perception gaps.`],
      },
      enterpriseAssessment: {
        watchpoints: [spine.deterministic.conditionClass],
        rationale: `Fast diagnostic identified ${spine.deterministic.conditionClass} — enterprise assessment will test institutional scale.`,
      },
      strategyRoom: {
        summary: spine.synthesis?.verdict ?? "Awaiting deeper assessment",
        route: "DIAGNOSTIC",
        escalationAllowed: spine.c3.tier === "FULL_SYNTHESIS",
      },
    },

    // Accumulated findings from spine history
    teamFindings: extractTeamFindings(spine),
    enterpriseFindings: extractEnterpriseFindings(spine),
    executiveFindings: extractExecutiveFindings(spine),
  };

  try {
    window.sessionStorage.setItem(CONSTITUTIONAL_THREAD_KEY, JSON.stringify(thread));
  } catch {
    // ignore
  }
}

function mapConditionToRoute(conditionClass: string): "REJECT" | "DIAGNOSTIC" | "STRATEGY" {
  if (conditionClass === "instability") return "DIAGNOSTIC";
  return "STRATEGY";
}

function extractTeamFindings(spine: IntelligenceSpine) {
  const event = spine.history.find((e) => e.stage === "team");
  if (!event) return undefined;
  return event.snapshot as Record<string, unknown>;
}

function extractEnterpriseFindings(spine: IntelligenceSpine) {
  const event = spine.history.find((e) => e.stage === "enterprise");
  if (!event) return undefined;
  return event.snapshot as Record<string, unknown>;
}

function extractExecutiveFindings(spine: IntelligenceSpine) {
  const event = spine.history.find((e) => e.stage === "executive_reporting");
  if (!event) return undefined;
  return event.snapshot as Record<string, unknown>;
}
