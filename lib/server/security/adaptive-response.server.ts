import "server-only";

import type { WatchdogVerdict, WatchdogInput } from "./ip-abuse-watchdog.server";
import { evaluateRequest, quickHash, degradeResult } from "./ip-abuse-watchdog.server";
import { runCanaryDiagnostics, type CanaryResult } from "./canary-diagnostics.server";
import { recordCanaryTrip, recordWatchdogEscalation } from "./evidence-vault.server";

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTIVE RESPONSE — unified shield combining watchdog + canary signals
//
// This is the single entry point for all protected routes.
// It combines behavioural analysis (watchdog) with tripwire detection (canary)
// to produce a unified response decision.
//
// Never reveals: rule names, thresholds, detection methods, or monitoring status.
// ─────────────────────────────────────────────────────────────────────────────

export type ShieldInput = {
  ipAddress: string;
  sessionId?: string;
  route: string;
  method: string;
  referer?: string;
  userAgent?: string;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  /** Primary input hash (e.g., decision text) */
  inputHash?: string;
  /** Full answer set hash */
  answerSetHash?: string;
  /** Time elapsed since page load (ms) */
  elapsedMs?: number;
};

export type ShieldVerdict = {
  allowed: boolean;
  action: "allow" | "slow" | "verify" | "degrade" | "block";
  delayMs: number;
  degradeResponse: boolean;
  /** Public-safe message — reveals nothing */
  publicMessage?: string;
  /** Internal audit trail — never sent to client */
  internalSummary: string;
};

function identityKey(ip: string, session?: string): string {
  return session ? `${ip}::${session}` : ip;
}

/**
 * Run the full Anti-Reconnaissance Shield.
 * Called by protected routes before processing.
 */
export async function runShield(input: ShieldInput): Promise<ShieldVerdict> {
  const key = identityKey(input.ipAddress, input.sessionId);
  const iHash = input.inputHash ?? quickHash(JSON.stringify(input.body).slice(0, 500));
  const aHash = input.answerSetHash ?? quickHash(JSON.stringify(input.body));

  // 1. Run watchdog (behavioural analysis)
  let watchdog: WatchdogVerdict;
  try {
    const watchdogInput: WatchdogInput = {
      ipAddress: input.ipAddress,
      sessionId: input.sessionId,
      route: input.route,
      inputHash: iHash,
      answerSetHash: aHash,
      submissionTimeMs: input.elapsedMs,
      userAgent: input.userAgent,
    };
    watchdog = await evaluateRequest(watchdogInput);
  } catch {
    watchdog = { level: 0, action: "allow", internalReason: "Watchdog unavailable" };
  }

  // 2. Run canary diagnostics (tripwire detection)
  let canaries: CanaryResult[] = [];
  try {
    canaries = await runCanaryDiagnostics({
      identityKey: key,
      ipAddress: input.ipAddress,
      route: input.route,
      method: input.method,
      referer: input.referer,
      body: input.body,
      query: input.query,
      inputHash: iHash,
      answerSetHash: aHash,
    });
  } catch {
    // Canary failure — continue with watchdog only
  }

  // 3. Combine signals
  const canaryTripped = canaries.filter((c) => c.triggered);
  const maxCanarySeverity = canaryTripped.reduce((max, c) => Math.max(max, c.severity), 0);
  const watchdogLevel = watchdog.level;

  // Combined threat score
  const combinedThreat = watchdogLevel + maxCanarySeverity;

  // 4. Record evidence for significant events
  if (canaryTripped.length > 0) {
    for (const trip of canaryTripped) {
      void recordCanaryTrip({
        identityKey: key,
        tripwireType: trip.tripwireType!,
        severity: trip.severity,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        route: input.route,
        requestSnapshot: sanitizeForEvidence(input.body),
      });
    }
  }

  if (watchdogLevel >= 2) {
    void recordWatchdogEscalation({
      identityKey: key,
      level: watchdogLevel,
      action: watchdog.action,
      internalReason: watchdog.internalReason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      route: input.route,
    });
  }

  // 5. Produce unified verdict
  return produceVerdict(combinedThreat, watchdog, canaryTripped, key);
}

function produceVerdict(
  combinedThreat: number,
  watchdog: WatchdogVerdict,
  canaryTrips: CanaryResult[],
  key: string,
): ShieldVerdict {
  const canaryTypes = canaryTrips.map((c) => c.tripwireType).join(",");
  const summary = `W:L${watchdog.level}(${watchdog.internalReason}) C:[${canaryTypes}] T:${combinedThreat}`;

  // Any canary trip with severity >= 5 is immediate block
  if (canaryTrips.some((c) => c.severity >= 5)) {
    return {
      allowed: false,
      action: "block",
      delayMs: 0,
      degradeResponse: false,
      publicMessage: "We could not complete this request. Please try again later.",
      internalSummary: summary,
    };
  }

  // Watchdog block
  if (watchdog.action === "block_temp" || watchdog.action === "block_perm") {
    return {
      allowed: false,
      action: "block",
      delayMs: 0,
      degradeResponse: false,
      publicMessage: watchdog.publicMessage ?? "We could not complete this request. Please try again later.",
      internalSummary: summary,
    };
  }

  // High combined threat — degrade
  if (combinedThreat >= 6) {
    return {
      allowed: true,
      action: "degrade",
      delayMs: 2000,
      degradeResponse: true,
      internalSummary: summary,
    };
  }

  // Moderate threat — verify/slow
  if (combinedThreat >= 3) {
    return {
      allowed: true,
      action: "verify",
      delayMs: 3000,
      degradeResponse: false,
      publicMessage: "Additional verification is required.",
      internalSummary: summary,
    };
  }

  // Low threat — silent slow
  if (combinedThreat >= 1) {
    return {
      allowed: true,
      action: "slow",
      delayMs: 1500,
      degradeResponse: false,
      internalSummary: summary,
    };
  }

  // Clean
  return {
    allowed: true,
    action: "allow",
    delayMs: 0,
    degradeResponse: false,
    internalSummary: summary,
  };
}

/**
 * Strip PII from request body for evidence storage.
 * Keep structural patterns, discard content.
 */
function sanitizeForEvidence(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      sanitized[key] = `[string:${value.length}]`;
    } else if (typeof value === "number") {
      sanitized[key] = "[number]";
    } else if (typeof value === "boolean") {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = `[${typeof value}]`;
    }
  }
  return sanitized;
}

// Re-export degradeResult for route handlers
export { degradeResult } from "./ip-abuse-watchdog.server";
