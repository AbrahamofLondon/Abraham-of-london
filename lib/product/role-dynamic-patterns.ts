/**
 * Role-Dynamic Pattern Extraction
 *
 * Detects recurring institutional patterns by role category across
 * diagnostic records, membership data, and corridor events.
 *
 * Uses only safe, non-sensitive metadata:
 * - roleTitle, functionName, seniorityBand, isExecutive
 * - decisionOwnerRole, respondentRole, sponsorRole, operatorRole
 *
 * Never exposes specific people unless already user-provided and surface-safe.
 */

import { prisma } from "@/lib/prisma.server";

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export type EvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "OPERATOR_REVIEWED"
  | "VERIFIED"
  | "INSUFFICIENT_DATA";

export type RoleDynamicPatternSummary = {
  posture: "INSUFFICIENT_DATA" | "EMERGING" | "RECURRING" | "MATERIAL";
  visibleLabel: string;
  explanation: string;
  affectedRoleCategories: string[];
  evidencePosture: EvidencePosture;
  suppressedReason?: string;
};

export type RoleDynamicIntelligence = {
  patterns: RoleDynamicPatternSummary[];
  thinState: boolean;
  sampleSize: number;
  sourceLabel: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const MINIMUM_SAMPLE = 3;
const RECURRENCE_THRESHOLD = 2;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function extractRoleDynamicPatterns(input: {
  organisationId?: string | null;
  email?: string | null;
}): Promise<RoleDynamicIntelligence> {
  const patterns: RoleDynamicPatternSummary[] = [];

  // ── 1. Load membership role data ──
  const memberships = input.organisationId
    ? await prisma.organisationMembership.findMany({
        where: { organisationId: input.organisationId, status: "active" },
        select: { roleTitle: true, isExecutive: true, email: true },
        take: 200,
      }).catch(() => [])
    : [];

  // ── 2. Load diagnostic records for role metadata ──
  const diagnosticWhere: Record<string, unknown> = {};
  if (input.organisationId) {
    const emails = memberships.map((m) => m.email.toLowerCase());
    if (emails.length > 0) diagnosticWhere.userEmail = { in: emails };
  } else if (input.email) {
    diagnosticWhere.userEmail = input.email;
  }

  const diagnosticRecords = await prisma.diagnosticRecord.findMany({
    where: diagnosticWhere,
    select: { responsesJson: true, diagnosticType: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const sampleSize = diagnosticRecords.length;

  if (sampleSize < MINIMUM_SAMPLE) {
    return {
      patterns: [{
        posture: "INSUFFICIENT_DATA",
        visibleLabel: "Insufficient retained role history",
        explanation: "Not enough diagnostic records to detect role-level patterns. Additional cycles required.",
        affectedRoleCategories: [],
        evidencePosture: "INSUFFICIENT_DATA",
      }],
      thinState: true,
      sampleSize,
      sourceLabel: "Role-dynamic pattern extraction — insufficient sample",
    };
  }

  // ── 3. Extract role patterns from diagnostic responses ──
  const blockerRoles = new Map<string, number>();
  const ownerRoles = new Map<string, number>();
  let formalRealMismatchCount = 0;
  let executiveAgreeOperatorBlockCount = 0;
  let sponsorAbsentCount = 0;

  for (const record of diagnosticRecords) {
    try {
      const parsed = asRecord(JSON.parse(record.responsesJson || "{}"));
      const blocker = asString(parsed.blocker) ?? asString(parsed.primary_blocker);
      const owner = asString(parsed.claimedOwner) ?? asString(parsed.decision_owner);
      const forcedAction = asString(parsed.forcedAction);

      // Blocker role accumulation
      if (blocker) {
        const roleMatch = blocker.match(/\b(CEO|CFO|COO|CTO|VP|board|director|manager|lead|head of|legal|finance|HR|compliance|executive)\b/i);
        if (roleMatch) {
          const role = roleMatch[1]!.toLowerCase();
          blockerRoles.set(role, (blockerRoles.get(role) ?? 0) + 1);
        }
      }

      // Owner role accumulation
      if (owner) {
        const roleMatch = owner.match(/\b(CEO|CFO|COO|CTO|VP|board|director|manager|lead|head of|legal|finance|HR|compliance|executive)\b/i);
        if (roleMatch) {
          const role = roleMatch[1]!.toLowerCase();
          ownerRoles.set(role, (ownerRoles.get(role) ?? 0) + 1);
        }
      }

      // Formal/real owner mismatch
      if (owner && forcedAction && forcedAction.toLowerCase().includes("i would")) {
        formalRealMismatchCount++;
      }

      // Executive agree / operator block pattern
      if (blocker && /wait|defer|delay/i.test(blocker) && parsed.isExecutive) {
        executiveAgreeOperatorBlockCount++;
      }

      // Sponsor absent from follow-through
      if (parsed.checkpointResponseStatus === "ABANDONED" || parsed.checkpointResponseStatus === "BLOCKED") {
        sponsorAbsentCount++;
      }
    } catch { /* skip */ }
  }

  // ── 4. Generate patterns from accumulated data ──

  // Repeated blocker role
  for (const [role, count] of blockerRoles) {
    if (count >= RECURRENCE_THRESHOLD) {
      patterns.push({
        posture: count >= 4 ? "MATERIAL" : count >= 3 ? "RECURRING" : "EMERGING",
        visibleLabel: "Repeated blocker role",
        explanation: `The role "${role}" has appeared as a decision blocker ${count} time${count !== 1 ? "s" : ""} across the retained record.`,
        affectedRoleCategories: [role],
        evidencePosture: "SYSTEM_INFERRED",
      });
    }
  }

  // Formal owner differs from real operator
  if (formalRealMismatchCount >= RECURRENCE_THRESHOLD) {
    patterns.push({
      posture: formalRealMismatchCount >= 4 ? "MATERIAL" : "RECURRING",
      visibleLabel: "Formal owner differs from real operator",
      explanation: `In ${formalRealMismatchCount} case${formalRealMismatchCount !== 1 ? "s" : ""}, the stated decision owner was not the person who would actually take action.`,
      affectedRoleCategories: ["formal_owner", "actual_operator"],
      evidencePosture: "SYSTEM_INFERRED",
    });
  }

  // Executive agreement but operator blockage
  if (executiveAgreeOperatorBlockCount >= RECURRENCE_THRESHOLD) {
    patterns.push({
      posture: "RECURRING",
      visibleLabel: "Executive alignment but operational blockage",
      explanation: "Executive-level agreement is present but operational execution is repeatedly deferred or blocked.",
      affectedRoleCategories: ["executive", "operator"],
      evidencePosture: "SYSTEM_INFERRED",
    });
  }

  // Sponsor absent from follow-through
  if (sponsorAbsentCount >= RECURRENCE_THRESHOLD) {
    patterns.push({
      posture: sponsorAbsentCount >= 4 ? "MATERIAL" : "RECURRING",
      visibleLabel: "Sponsor repeatedly absent from execution follow-through",
      explanation: `${sponsorAbsentCount} checkpoint${sponsorAbsentCount !== 1 ? "s" : ""} abandoned or blocked, suggesting the sponsoring role is not present during execution.`,
      affectedRoleCategories: ["sponsor"],
      evidencePosture: "SYSTEM_INFERRED",
    });
  }

  // Role-level escalation recurrence (from membership data)
  if (memberships.length > 0) {
    const executiveCount = memberships.filter((m) => m.isExecutive).length;
    const nonExecutiveCount = memberships.length - executiveCount;
    if (executiveCount > 0 && nonExecutiveCount > executiveCount * 3) {
      patterns.push({
        posture: "EMERGING",
        visibleLabel: "Executive layer thin relative to operational layer",
        explanation: "The ratio of executive to operational roles suggests decision authority may be concentrated. This is an observation, not a diagnosis.",
        affectedRoleCategories: ["executive", "operational"],
        evidencePosture: "SYSTEM_INFERRED",
      });
    }
  }

  return {
    patterns: patterns.slice(0, 10),
    thinState: patterns.length === 0,
    sampleSize,
    sourceLabel: "Role-dynamic pattern extraction — sponsor-safe aggregate only",
  };
}
