/**
 * lib/playbooks/playbook-run-authority.ts
 *
 * Authority + dispatch for governed playbook /run experiences.
 *
 * Mirrors instrument-run-authority: maps each playbook slug → catalog entitlement,
 * routes to the correct product-specific engine, and enforces that a run cannot
 * execute for an unknown slug or an anonymous identity. Actual DB entitlement
 * verification is delegated to resolveCanonicalEntitlement (called by the API);
 * this module provides the pure, testable dispatch + structural checks.
 */

import {
  type PlaybookRunResult,
  PlaybookInputError,
} from "./playbook-run-types";
import {
  runExecutionIntegrityProtocol,
  EXECUTION_INTEGRITY_PROTOCOL_CODE,
} from "./execution-integrity-protocol";
import {
  runAlignmentAuditPlaybook,
  ALIGNMENT_AUDIT_PLAYBOOK_CODE,
} from "./alignment-audit-playbook";
import {
  runDriftDetectionFramework,
  DRIFT_DETECTION_FRAMEWORK_CODE,
} from "./drift-detection-framework";

export interface PlaybookRunConfig {
  /** URL slug under /playbooks/<slug>/run — must match the catalog successPath. */
  slug: string;
  /** canonical product code. */
  code: string;
  displayName: string;
  /** catalog entitlement slug required to run. */
  entitlementSlug: string;
  /** product-specific engine. */
  run: (input: unknown) => PlaybookRunResult<unknown>;
}

/**
 * Registry keyed by URL slug. Slugs are the exact catalog successPath segments:
 *   /playbooks/execution-integrity-protocol/run
 *   /playbooks/the-alignment-audit-playbook/run
 *   /playbooks/the-drift-detection-framework/run
 */
export const PLAYBOOK_RUN_REGISTRY: Record<string, PlaybookRunConfig> = {
  "execution-integrity-protocol": {
    slug: "execution-integrity-protocol",
    code: EXECUTION_INTEGRITY_PROTOCOL_CODE,
    displayName: "Execution Integrity Protocol",
    entitlementSlug: "playbook.execution-integrity-protocol.access",
    run: (input) => runExecutionIntegrityProtocol(input as never),
  },
  "the-alignment-audit-playbook": {
    slug: "the-alignment-audit-playbook",
    code: ALIGNMENT_AUDIT_PLAYBOOK_CODE,
    displayName: "The Alignment Audit Playbook",
    entitlementSlug: "playbook.alignment-audit.access",
    run: (input) => runAlignmentAuditPlaybook(input as never),
  },
  "the-drift-detection-framework": {
    slug: "the-drift-detection-framework",
    code: DRIFT_DETECTION_FRAMEWORK_CODE,
    displayName: "The Drift Detection Framework",
    entitlementSlug: "playbook.drift-detection-framework.access",
    run: (input) => runDriftDetectionFramework(input as never),
  },
};

export const PLAYBOOK_SLUGS = Object.keys(PLAYBOOK_RUN_REGISTRY);

export function resolvePlaybookRun(slug: string): PlaybookRunConfig | null {
  return PLAYBOOK_RUN_REGISTRY[slug] ?? null;
}

export function entitlementSlugForPlaybook(slug: string): string | null {
  return PLAYBOOK_RUN_REGISTRY[slug]?.entitlementSlug ?? null;
}

export class PlaybookRunAuthorityError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PlaybookRunAuthorityError";
    this.code = code;
  }
}

/**
 * Structural pre-execution checks (mirror of the instrument authority):
 *   1. slug must be a recognised playbook
 *   2. run must carry an identity (userId or email) — no anonymous paid runs
 * Throws PlaybookRunAuthorityError on failure. DB entitlement is checked separately.
 */
export function assertPlaybookRunAllowed(input: {
  slug: string;
  userId?: string | null;
  email?: string | null;
}): PlaybookRunConfig {
  const config = resolvePlaybookRun(input.slug);
  if (!config) {
    throw new PlaybookRunAuthorityError(
      "UNKNOWN_PLAYBOOK",
      `"${input.slug}" is not a recognised playbook. Known: ${PLAYBOOK_SLUGS.join(", ")}.`,
    );
  }
  const hasIdentity = Boolean(input.userId) || Boolean(input.email);
  if (!hasIdentity) {
    throw new PlaybookRunAuthorityError(
      "ANONYMOUS_RUN_BLOCKED",
      "Anonymous runs are not allowed for paid playbooks. Provide userId or email.",
    );
  }
  return config;
}

/**
 * Execute a playbook run (pure — no DB, no entitlement DB read).
 * Validates the slug and dispatches to the product-specific engine.
 * Re-throws PlaybookInputError from the engine (the failure case) unchanged.
 */
export function executePlaybookRun(slug: string, input: unknown): PlaybookRunResult<unknown> {
  const config = resolvePlaybookRun(slug);
  if (!config) {
    throw new PlaybookRunAuthorityError(
      "UNKNOWN_PLAYBOOK",
      `"${slug}" is not a recognised playbook. Known: ${PLAYBOOK_SLUGS.join(", ")}.`,
    );
  }
  return config.run(input);
}

export { PlaybookInputError };
