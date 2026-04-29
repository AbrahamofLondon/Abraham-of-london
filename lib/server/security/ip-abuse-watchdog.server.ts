import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — internal only. Never exposed in any response.
// ─────────────────────────────────────────────────────────────────────────────

/** Response levels — the attacker must never know which level they are on */
export type AbuseLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type WatchdogVerdict = {
  level: AbuseLevel;
  action: "allow" | "slow" | "verify" | "degrade" | "block_temp" | "block_perm";
  /** Public-safe message — reveals nothing about detection */
  publicMessage?: string;
  /** Internal-only — never sent to client */
  internalReason: string;
};

export type WatchdogInput = {
  ipAddress: string;
  sessionId?: string;
  route: string;
  /** Hash of the primary input (decision text) — not the text itself */
  inputHash: string;
  /** Hash of full answer set */
  answerSetHash: string;
  /** Time between page load and submission (ms) */
  submissionTimeMs?: number;
  /** User agent */
  userAgent?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECTION RULES — thresholds are internal constants, never exposed
// ─────────────────────────────────────────────────────────────────────────────

/** Simple hash for identity grouping */
function identityKey(ip: string, session?: string): string {
  return session ? `${ip}::${session}` : ip;
}

/** Detect if submission is faster than humanly possible */
function isTooFast(ms?: number): boolean {
  // A real user takes at least 30 seconds to answer 6 questions
  return typeof ms === "number" && ms > 0 && ms < 25_000;
}

/** Simple string hash for input comparison (not cryptographic) */
export function quickHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE WATCHDOG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a request against the abuse detection system.
 * Called BEFORE scoring. Returns a verdict that determines how to proceed.
 *
 * The watchdog NEVER reveals:
 * - which rule triggered
 * - what threshold was crossed
 * - what behaviour caused the decision
 * - whether the user is being monitored
 */
export async function evaluateRequest(input: WatchdogInput): Promise<WatchdogVerdict> {
  const key = identityKey(input.ipAddress, input.sessionId);

  // 1. Check for permanent block
  try {
    const blocked = await prisma.blockedIdentity.findUnique({
      where: { identityKey: key },
    });
    if (blocked) {
      if (blocked.permanent || !blocked.expiresAt || blocked.expiresAt > new Date()) {
        return {
          level: 5,
          action: "block_perm",
          publicMessage: "We could not complete this request. Please try again later.",
          internalReason: `Blocked identity: ${blocked.reason}`,
        };
      }
      // Block expired — clean up
      await prisma.blockedIdentity.delete({ where: { identityKey: key } }).catch(() => {});
    }
  } catch {
    // DB failure — allow (fail-open for this check only, rate limiting is separate)
  }

  // 2. Get or create fingerprint
  let fingerprint = await getOrCreateFingerprint(key, input);

  // 3. Run detection rules
  const events: Array<{ rule: string; severity: number }> = [];

  // Rule A: Too-fast submission
  if (isTooFast(input.submissionTimeMs)) {
    events.push({ rule: "SPEED", severity: 3 });
  }

  // Rule B: High request frequency (many requests from same identity in short window)
  const recentCount = await countRecentRequests(key, 3600_000); // 1 hour
  if (recentCount > 15) {
    events.push({ rule: "FREQUENCY_HIGH", severity: 4 });
  } else if (recentCount > 8) {
    events.push({ rule: "FREQUENCY_MODERATE", severity: 2 });
  }

  // Rule C: Input variation pattern (same decision, different parameters)
  if (fingerprint.variationScore > 0.7) {
    events.push({ rule: "VARIATION", severity: 4 });
  } else if (fingerprint.variationScore > 0.4) {
    events.push({ rule: "VARIATION_MODERATE", severity: 2 });
  }

  // Rule D: Many distinct inputs from same identity (mapping the engine)
  if (fingerprint.distinctInputs > 20) {
    events.push({ rule: "HARVESTING", severity: 5 });
  } else if (fingerprint.distinctInputs > 10) {
    events.push({ rule: "HARVESTING_MODERATE", severity: 3 });
  }

  // Rule E: Missing or suspicious user agent
  if (!input.userAgent || input.userAgent.length < 10) {
    events.push({ rule: "UA_SUSPICIOUS", severity: 1 });
  }

  // 4. Persist events
  for (const evt of events) {
    await persistEvent(key, input, evt.rule, evt.severity).catch(() => {});
  }

  // 5. Update fingerprint with new request data
  fingerprint = await updateFingerprint(key, input, fingerprint);

  // 6. Compute verdict from accumulated evidence
  const totalSeverity = events.reduce((s, e) => s + e.severity, 0);
  const historicalSeverity = await getHistoricalSeverity(key, 86400_000); // 24h

  const combinedScore = totalSeverity + historicalSeverity * 0.5;

  return computeVerdict(combinedScore, key, events.map(e => e.rule).join(","));
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE LADDER
// ─────────────────────────────────────────────────────────────────────────────

function computeVerdict(score: number, key: string, internalRules: string): WatchdogVerdict {
  // Level 0 — clean
  if (score <= 1) {
    return { level: 0, action: "allow", internalReason: "Clean" };
  }

  // Level 1 — silently slow (add 1-3s delay)
  if (score <= 3) {
    return { level: 1, action: "slow", internalReason: `Low signal: ${internalRules}` };
  }

  // Level 2 — require friction
  if (score <= 6) {
    return {
      level: 2,
      action: "verify",
      publicMessage: "Additional verification is required.",
      internalReason: `Moderate signal: ${internalRules}`,
    };
  }

  // Level 3 — return reduced-detail DTO
  if (score <= 10) {
    return {
      level: 3,
      action: "degrade",
      internalReason: `High signal: ${internalRules}`,
    };
  }

  // Level 4 — temporary block
  if (score <= 18) {
    // Persist block
    void persistBlock(key, false, `Score ${Math.round(score)}: ${internalRules}`, 3600_000);
    return {
      level: 4,
      action: "block_temp",
      publicMessage: "We could not complete this request. Please try again later.",
      internalReason: `Block: ${internalRules}`,
    };
  }

  // Level 5 — permanent block
  void persistBlock(key, true, `Score ${Math.round(score)}: ${internalRules}`, null);
  return {
    level: 5,
    action: "block_perm",
    publicMessage: "We could not complete this request. Please try again later.",
    internalReason: `Permanent block: ${internalRules}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEGRADED DTO — when level 3, strip detail from response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip detail from a diagnostic result when abuse is suspected.
 * Returns a minimal DTO that gives the attacker less to work with.
 */
export function degradeResult<T extends Record<string, unknown>>(result: T): T {
  const degraded = { ...result } as Record<string, unknown>;

  // Remove synthesis detail — only keep verdict
  if (degraded.synthesis && typeof degraded.synthesis === "object") {
    const synth = degraded.synthesis as Record<string, unknown>;
    degraded.synthesis = {
      verdict: synth.verdict ?? "Analysis complete.",
      primaryContradiction: "Further detail requires deeper assessment.",
      avoidedDecision: "Continue to the next stage for specifics.",
      whyPriorAttemptsFailed: "The system has identified a structural pattern.",
      concreteMove: "Run the Constitutional Diagnostic for the full reading.",
      defaultPathForecast: "The condition will compound without intervention.",
      certaintyBoundary: "Surface-level assessment only.",
      quotedUserLanguage: [],
    } as unknown;
  }

  // Remove forecast detail
  if ("forecast" in degraded && degraded.forecast) {
    degraded.forecast = {
      sevenDays: "The condition persists.",
      thirtyDays: "Without action, the condition embeds.",
      ninetyDays: "Recovery cost increases significantly.",
      controlShiftSummary: "Monitor and reassess.",
    } as unknown;
  }

  // Remove elevation layer detail
  delete degraded.costOfInaction;
  delete degraded.executionFailure;
  delete degraded.authorityIndex;
  delete degraded.memoryTrend;

  return degraded as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE — Postgres-authoritative evidence
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateFingerprint(
  key: string,
  input: WatchdogInput,
) {
  const existing = await prisma.abuseFingerprint.findUnique({
    where: { identityKey: key },
  }).catch(() => null);

  if (existing) return existing;

  return prisma.abuseFingerprint.create({
    data: {
      identityKey: key,
      ipAddresses: [input.ipAddress],
      sessionIds: input.sessionId ? [input.sessionId] : [],
      requestCount: 0,
      distinctInputs: 0,
      variationScore: 0,
      lastSeenAt: new Date(),
    },
  });
}

async function updateFingerprint(
  key: string,
  input: WatchdogInput,
  current: { requestCount: number; distinctInputs: number; ipAddresses: unknown; sessionIds: unknown },
) {
  const ips = Array.isArray(current.ipAddresses) ? current.ipAddresses : [];
  const sessions = Array.isArray(current.sessionIds) ? current.sessionIds : [];

  if (!ips.includes(input.ipAddress)) ips.push(input.ipAddress);
  if (input.sessionId && !sessions.includes(input.sessionId)) sessions.push(input.sessionId);

  // Variation score: ratio of distinct inputs to total requests
  const newDistinct = current.distinctInputs + 1;
  const newCount = current.requestCount + 1;
  const variationScore = newCount > 0 ? Math.min(1, newDistinct / Math.max(1, newCount * 0.5)) : 0;

  return prisma.abuseFingerprint.update({
    where: { identityKey: key },
    data: {
      ipAddresses: ips,
      sessionIds: sessions,
      requestCount: { increment: 1 },
      distinctInputs: { increment: 1 },
      variationScore,
      lastSeenAt: new Date(),
    },
  });
}

async function persistEvent(
  key: string,
  input: WatchdogInput,
  rule: string,
  severity: number,
) {
  await prisma.abuseEvent.create({
    data: {
      identityKey: key,
      ipAddress: input.ipAddress,
      sessionId: input.sessionId,
      route: input.route,
      ruleTriggered: rule,
      severity,
      metadata: {
        userAgent: input.userAgent?.slice(0, 200),
        submissionTimeMs: input.submissionTimeMs,
        inputHash: input.inputHash,
      },
    },
  });
}

async function persistBlock(
  key: string,
  permanent: boolean,
  reason: string,
  durationMs: number | null,
) {
  const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

  await prisma.blockedIdentity.upsert({
    where: { identityKey: key },
    create: {
      identityKey: key,
      reason,
      permanent,
      evidenceCount: 1,
      expiresAt,
    },
    update: {
      reason,
      permanent: permanent || undefined,
      evidenceCount: { increment: 1 },
      expiresAt,
    },
  });
}

async function countRecentRequests(key: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  return prisma.abuseEvent.count({
    where: { identityKey: key, createdAt: { gte: since } },
  });
}

async function getHistoricalSeverity(key: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  const result = await prisma.abuseEvent.aggregate({
    where: { identityKey: key, createdAt: { gte: since } },
    _sum: { severity: true },
  });
  return result._sum.severity ?? 0;
}
