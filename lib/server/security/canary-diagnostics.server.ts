import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// CANARY DIAGNOSTICS — tripwires that only attackers trigger
//
// Genuine users never encounter these because they follow the UI.
// Automated scripts and reverse-engineers trip them by:
//   1. Submitting hidden form fields
//   2. Using decoy query parameters
//   3. Hitting non-linked internal routes
//   4. Calling APIs in wrong sequence
//   5. Submitting near-duplicate requests
// ─────────────────────────────────────────────────────────────────────────────

export type CanaryResult = {
  triggered: boolean;
  tripwireType: string | null;
  severity: number;
};

const NO_TRIP: CanaryResult = { triggered: false, tripwireType: null, severity: 0 };

/**
 * Check for hidden honeypot fields in request body.
 * The UI never renders these fields. Only bots/scripts fill them.
 */
export function checkHiddenFields(body: Record<string, unknown>): CanaryResult {
  const honeypots = ["website", "middleName", "company_url", "fax", "phone2", "_token", "_debug"];
  for (const field of honeypots) {
    const val = body[field];
    if (val !== undefined && val !== null && val !== "") {
      return { triggered: true, tripwireType: "HIDDEN_FIELD", severity: 5 };
    }
  }
  return NO_TRIP;
}

/**
 * Check for decoy query parameters that are never used by the real app.
 * If someone sends ?_internal=1 or ?debug=true, they are probing.
 */
export function checkDecoyParams(query: Record<string, unknown>): CanaryResult {
  const decoys = ["_internal", "_debug", "_trace", "_raw", "_admin", "_bypass", "verbose", "format"];
  for (const param of decoys) {
    if (query[param] !== undefined) {
      return { triggered: true, tripwireType: "DECOY_PARAM", severity: 4 };
    }
  }
  return NO_TRIP;
}

/**
 * Check if the API call sequence is abnormal.
 * E.g., calling /api/diagnostics/score without first loading the diagnostic page.
 * The referer header can indicate whether the user came from the expected page.
 */
export function checkAbnormalSequence(
  route: string,
  referer: string | undefined,
  method: string,
): CanaryResult {
  // Score endpoint should have a referer from /diagnostics/fast
  if (route === "/api/diagnostics/score" && method === "POST") {
    if (!referer || (!referer.includes("/diagnostics") && !referer.includes("localhost"))) {
      return { triggered: true, tripwireType: "ABNORMAL_SEQUENCE", severity: 2 };
    }
  }
  return NO_TRIP;
}

/**
 * Detect near-duplicate requests — same identity submitting very similar
 * payloads with small systematic variations (one field changes at a time).
 * This is the strongest signal of reverse-engineering.
 */
export async function checkNearDuplicate(
  identityKey: string,
  inputHash: string,
  answerSetHash: string,
): Promise<CanaryResult> {
  // Get recent events for this identity
  const recentEvents = await prisma.abuseEvent.findMany({
    where: {
      identityKey,
      createdAt: { gte: new Date(Date.now() - 3600_000) },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { metadata: true },
  });

  if (recentEvents.length < 3) return NO_TRIP;

  // Count how many recent requests share the same inputHash but different answerSetHash
  let sameInputDiffAnswers = 0;
  for (const evt of recentEvents) {
    const meta = evt.metadata as Record<string, unknown> | null;
    if (meta?.inputHash === inputHash && meta?.answerSetHash !== answerSetHash) {
      sameInputDiffAnswers++;
    }
  }

  if (sameInputDiffAnswers >= 3) {
    return { triggered: true, tripwireType: "NEAR_DUPLICATE_SYSTEMATIC", severity: 5 };
  }
  if (sameInputDiffAnswers >= 2) {
    return { triggered: true, tripwireType: "NEAR_DUPLICATE", severity: 3 };
  }

  return NO_TRIP;
}

/**
 * Detect multiple accounts from the same fingerprint.
 * Checks if the same IP has been seen with multiple different session IDs
 * submitting diagnostic requests.
 */
export async function checkMultiAccountFingerprint(
  ipAddress: string,
): Promise<CanaryResult> {
  const distinctSessions = await prisma.abuseFingerprint.count({
    where: {
      ipAddresses: { path: [], array_contains: ipAddress },
      lastSeenAt: { gte: new Date(Date.now() - 86400_000) },
    },
  }).catch(() => 0);

  if (distinctSessions >= 5) {
    return { triggered: true, tripwireType: "MULTI_ACCOUNT", severity: 4 };
  }
  return NO_TRIP;
}

/**
 * Run all canary checks and persist any trips.
 */
export async function runCanaryDiagnostics(opts: {
  identityKey: string;
  ipAddress: string;
  route: string;
  method: string;
  referer?: string;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  inputHash: string;
  answerSetHash: string;
}): Promise<CanaryResult[]> {
  const results: CanaryResult[] = [];

  // Synchronous checks
  results.push(checkHiddenFields(opts.body));
  results.push(checkDecoyParams(opts.query));
  results.push(checkAbnormalSequence(opts.route, opts.referer, opts.method));

  // Async checks
  results.push(await checkNearDuplicate(opts.identityKey, opts.inputHash, opts.answerSetHash));
  results.push(await checkMultiAccountFingerprint(opts.ipAddress));

  // Persist any triggers
  const triggered = results.filter((r) => r.triggered);
  for (const trip of triggered) {
    await prisma.canaryTripwire.create({
      data: {
        identityKey: opts.identityKey,
        ipAddress: opts.ipAddress,
        tripwireType: trip.tripwireType!,
        tripwireId: `${opts.route}:${Date.now()}`,
        metadata: { severity: trip.severity, route: opts.route },
      },
    }).catch(() => {});
  }

  return results;
}
