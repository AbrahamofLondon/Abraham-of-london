/**
 * Authority Gate Hierarchy
 *
 * Defines which gates block authority restoration.
 * Non-negotiable: If ANY blocking gate fails, authority cannot be restored.
 * "All gates passing" must not be reported while blocking gates fail.
 */

export type AuthorityGateSeverity = "blocking" | "non_blocking" | "informational";

export type AuthorityGateStatus = "passed" | "failed" | "passed_with_findings" | "not_run";

export type AuthorityReadinessState =
  | "authority_safe"
  | "authority_blocked_by_failing_gates"
  | "authority_pending_reconciliation"
  | "authority_not_assessed";

export interface AuthorityGate {
  gateId: string;
  gateName: string;
  severity: AuthorityGateSeverity;
  status: AuthorityGateStatus;
  findings: string[];
  blockingReasons?: string[];
  mustPassForAuthority: boolean;
}

export interface AuthorityGateResult {
  timestamp: string;
  overallState: AuthorityReadinessState;
  productsAllowedPositiveAuthority: number;
  productsBlockedFromRestoration: number;
  failingBlockingGates: string[];
  passingGates: string[];
  gatesWithFindings: string[];
  recommendedAction: string;
}

/**
 * Authority Blocking Gates
 * If ANY of these gates fail, authority cannot be restored.
 */
export const AUTHORITY_BLOCKING_GATES = [
  {
    gateId: "authority_grant_firewall",
    gateName: "Authority Grant Firewall",
    description: "Prevents fraudulent authority grants",
    mustBlockAuthority: true,
  },
  {
    gateId: "evidence_ledger_artifact_verification",
    gateName: "Evidence Ledger Artifact Verification",
    description: "Ensures ledger artifacts are trustworthy",
    mustBlockAuthority: true,
  },
  {
    gateId: "report_as_evidence_violations",
    gateName: "Report-As-Evidence Violations",
    description: "Prevents reports from being misused as evidence",
    mustBlockAuthority: true,
  },
  {
    gateId: "no_mock_authority_critical_paths",
    gateName: "No-Mock Authority (Critical Paths)",
    description: "Prevents mock authority in paths that grant real authority",
    mustBlockAuthority: true,
  },
  {
    gateId: "surface_claim_authority",
    gateName: "Surface Claim Authority",
    description: "Ensures public surfaces don't make unsupported claims",
    mustBlockAuthority: true,
  },
  {
    gateId: "product_authority_contract_consistency",
    gateName: "ProductAuthorityContract Consistency",
    description: "Ensures contract is consistent with evidence and runtime state",
    mustBlockAuthority: true,
  },
  {
    gateId: "board_facing_language_guard",
    gateName: "Board-Facing Language Guard",
    description: "Prevents board-facing products from overclaiming",
    mustBlockAuthority: true,
  },
];

/**
 * Non-Blocking Gates
 * These provide useful information but don't block authority restoration alone.
 */
export const AUTHORITY_INFORMATIONAL_GATES = [
  {
    gateId: "market_adoption_posture",
    gateName: "Market Adoption Posture",
    description: "Tracks market readiness",
  },
  {
    gateId: "estate_integrity",
    gateName: "Estate Integrity",
    description: "Verifies general estate health (but not authority safety alone)",
  },
  {
    gateId: "effective_authority_surface_migration",
    gateName: "Effective Authority Surface Migration",
    description: "Tracks migration to effective authority usage",
  },
];

/**
 * Determine if authority can be restored given gate results
 */
export function canRestoreAuthority(gates: AuthorityGate[]): {
  canRestore: boolean;
  blockingReasons: string[];
  state: AuthorityReadinessState;
} {
  const failingBlockingGates = gates.filter(
    (g) =>
      AUTHORITY_BLOCKING_GATES.some((bg) => bg.gateId === g.gateId) &&
      g.status === "failed"
  );

  if (failingBlockingGates.length > 0) {
    return {
      canRestore: false,
      blockingReasons: failingBlockingGates.map(
        (g) => `${g.gateName}: ${g.findings[0] || "Failed"}`
      ),
      state: "authority_blocked_by_failing_gates",
    };
  }

  const gatesWithCriticalFindings = gates.filter(
    (g) =>
      AUTHORITY_BLOCKING_GATES.some((bg) => bg.gateId === g.gateId) &&
      g.status === "passed_with_findings" &&
      g.blockingReasons &&
      g.blockingReasons.length > 0
  );

  if (gatesWithCriticalFindings.length > 0) {
    return {
      canRestore: false,
      blockingReasons: gatesWithCriticalFindings.map(
        (g) => `${g.gateName}: ${g.blockingReasons?.[0] || "Critical findings"}`
      ),
      state: "authority_blocked_by_failing_gates",
    };
  }

  return {
    canRestore: false, // Default to false for safety
    blockingReasons: ["No positive authority has been verified in this validation cycle"],
    state: "authority_pending_reconciliation",
  };
}

/**
 * Format gate result for reporting
 */
export function formatAuthorityGateResult(result: AuthorityGateResult): string {
  const lines: string[] = [];

  lines.push("AUTHORITY GATE ENFORCEMENT RESULT");
  lines.push("================================\n");

  lines.push(`Overall State: ${result.overallState}`);
  lines.push(`Timestamp: ${result.timestamp}\n`);

  lines.push(`Products Allowed Positive Authority: ${result.productsAllowedPositiveAuthority}`);
  lines.push(`Products Blocked From Restoration: ${result.productsBlockedFromRestoration}\n`);

  if (result.failingBlockingGates.length > 0) {
    lines.push("FAILING BLOCKING GATES:");
    result.failingBlockingGates.forEach((g) => lines.push(`  ✗ ${g}`));
    lines.push("");
  }

  if (result.passingGates.length > 0) {
    lines.push("PASSING GATES:");
    result.passingGates.forEach((g) => lines.push(`  ✓ ${g}`));
    lines.push("");
  }

  if (result.gatesWithFindings.length > 0) {
    lines.push("GATES WITH FINDINGS:");
    result.gatesWithFindings.forEach((g) => lines.push(`  ⚠ ${g}`));
    lines.push("");
  }

  lines.push(`Recommended Action: ${result.recommendedAction}`);

  return lines.join("\n");
}

/**
 * Non-negotiable rule: Never report "authority safe" if blocking gates fail
 */
export function sanitizeAuthorityLanguage(input: string): string {
  const unsafePatterns = [
    /authority\s+safe/gi,
    /market\s+ready/gi,
    /fully\s+operational/gi,
    /all\s+gates\s+passing/gi,
    /validated\s+estate/gi,
    /proven\s+authority/gi,
    /authority\s+restoration\s+complete/gi,
  ];

  let sanitized = input;
  for (const pattern of unsafePatterns) {
    if (pattern.test(sanitized)) {
      return "[UNSANITIZED: Authority language detected in blocked state]";
    }
  }

  return sanitized;
}
