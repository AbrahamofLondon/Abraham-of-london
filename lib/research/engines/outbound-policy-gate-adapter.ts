/**
 * lib/research/engines/outbound-policy-gate-adapter.ts
 *
 * Intelligence Foundry adapter for the Outbound Policy Gate engine.
 *
 * Wraps: applySharedOutboundPolicy() from lib/outbound/core/outbound-policy-gate.ts
 *
 * Status: PRODUCTION_CALLABLE
 * - Calls real production logic: disallowed phrase detection, claim checks,
 *   frontmatter leakage, link domain validation, empty text guard
 * - No AI, no external calls, no data mutation
 * - Tests the shared gate that applies to ALL outbound providers
 *
 * Fixtures (payload fields):
 *   - text: string — post body text
 *   - title: string — post title
 *   - link: string | null — outbound link
 *   - maxChars: number — character limit (default 0 = no limit)
 *   - allowedLinkPrefixes: string[] — allowed link domains
 *   - provider: string — "facebook" | "x" | "linkedin" (for metadata)
 */

import "server-only";

import { applySharedOutboundPolicy } from "@/lib/outbound/core/outbound-policy-gate";
import type { OutboundDraft } from "@/lib/outbound/core/outbound-provider-contract";
import type { EngineRunInput, EngineRunOutput } from "@/lib/research/engine-adapter-contract";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Engine Identity ─────────────────────────────────────────────────────────

export const OUTBOUND_GATE_ENGINE_ID = "outbound-policy-gate";
export const OUTBOUND_GATE_VERSION = "1.1.0";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SAFE_FIXTURE: OutboundDraft = {
  provider: "linkedin",
  assetType: "custom",
  slug: "fixture-safe-post",
  title: "The cost of misaligned leadership",
  text: "When authority is unclear, execution falters. Abraham of London works with founders and boards to establish clear decision authority before the organisation pays the price.",
  link: "https://abrahamoflondon.com/articles/decision-authority",
  meta: {},
};

const FAILING_FIXTURE: OutboundDraft = {
  provider: "x",
  assetType: "custom",
  slug: "fixture-failing-post",
  title: "GUARANTEED results",
  text: "AI predicts your business will grow 300% guaranteed. Investment advice available. Buy now. Q2 2026 report is now available.",
  link: "https://suspicious-domain.io/offer",
  meta: {},
};

const ALLOWED_PREFIXES = ["https://abrahamoflondon.com", "https://www.abrahamoflondon.com"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDraft(payload: Record<string, unknown>): OutboundDraft {
  const useFailingFixture = payload.useFailingFixture === true;
  if (useFailingFixture) return FAILING_FIXTURE;

  const useSafeFixture = payload.useSafeFixture === true || !("text" in payload);
  if (useSafeFixture) return SAFE_FIXTURE;

  return {
    provider: ((payload.provider as string) ?? "linkedin") as OutboundDraft["provider"],
    assetType: "custom",
    slug: (payload.slug as string) ?? "custom-draft",
    title: (payload.title as string) ?? "",
    text: (payload.text as string) ?? "",
    link: (payload.link as string | null) ?? null,
    meta: (payload.meta as Record<string, unknown>) ?? {},
  };
}

// ─── Self-test ────────────────────────────────────────────────────────────────

async function selfTest(): Promise<{ ok: boolean; message: string }> {
  try {
    const result = applySharedOutboundPolicy(SAFE_FIXTURE, {
      allowedLinkPrefixes: ALLOWED_PREFIXES,
    });
    if (typeof result.allowed !== "boolean") {
      return { ok: false, message: "applySharedOutboundPolicy returned invalid output" };
    }
    const failResult = applySharedOutboundPolicy(FAILING_FIXTURE, {
      allowedLinkPrefixes: ALLOWED_PREFIXES,
    });
    if (failResult.allowed) {
      return { ok: false, message: "Failing fixture unexpectedly passed the gate" };
    }
    return { ok: true, message: `Safe: allowed=${result.allowed}, Failing: blockers=${failResult.blockers.length}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Self-test failed" };
  }
}

function getVersion(): string {
  return OUTBOUND_GATE_VERSION;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(input: EngineRunInput): Promise<EngineRunOutput> {
  const startTime = Date.now();

  const payload = (input?.payload ?? {}) as Record<string, unknown>;

  const draft = buildDraft(payload);
  const maxChars = typeof payload.maxChars === "number" ? payload.maxChars : 0;
  const allowedLinkPrefixes =
    Array.isArray(payload.allowedLinkPrefixes) ? payload.allowedLinkPrefixes as string[] : ALLOWED_PREFIXES;

  // ── Call production gate ────────────────────────────────────────────────────
  const gateResult = applySharedOutboundPolicy(draft, {
    maxChars: maxChars > 0 ? maxChars : undefined,
    allowedLinkPrefixes,
  });

  // ── Formula steps ───────────────────────────────────────────────────────────
  const formulaSteps: FormulaStep[] = [
    {
      stepId: "gate-input",
      label: "Gate input",
      inputs: {
        provider: draft.provider,
        textLength: draft.text.length,
        hasTitle: draft.title.length > 0 ? "yes" : "no",
        hasLink: draft.link !== null ? "yes" : "no",
        maxChars: maxChars || "no limit",
      },
      output: `text: ${draft.text.length} chars`,
      sourceRule: "applySharedOutboundPolicy() — lib/outbound/core/outbound-policy-gate.ts",
      engineVersion: OUTBOUND_GATE_VERSION,
    },
    {
      stepId: "gate-evaluation",
      label: "Shared policy gate",
      inputs: {
        allowed: String(gateResult.allowed),
        blockerCount: gateResult.blockers.length,
        warningCount: gateResult.warnings.length,
      },
      intermediate: {
        blockers: gateResult.blockers.join(" | ") || "none",
        warnings: gateResult.warnings.join(" | ") || "none",
      },
      output: gateResult.allowed ? "ALLOWED" : "BLOCKED",
      sourceRule: "applySharedOutboundPolicy() — lib/outbound/core/outbound-policy-gate.ts",
      engineVersion: OUTBOUND_GATE_VERSION,
    },
  ];

  // ── Map to findings ─────────────────────────────────────────────────────────
  const findings: Finding[] = [];

  for (const blocker of gateResult.blockers) {
    findings.push({
      id: `outbound-blocker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "Policy blocker",
      description: blocker,
      severity: "HIGH",
      source: `${OUTBOUND_GATE_ENGINE_ID}::shared-policy-gate::blocker`,
      evidence: `Draft text (first 200 chars): ${draft.text.slice(0, 200)}`,
      remediation: "Remove the disallowed phrase or claim before publishing.",
    });
  }

  for (const warning of gateResult.warnings) {
    findings.push({
      id: `outbound-warning-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: "Policy warning",
      description: warning,
      severity: "MEDIUM",
      source: `${OUTBOUND_GATE_ENGINE_ID}::shared-policy-gate::warning`,
      evidence: `Draft text (first 200 chars): ${draft.text.slice(0, 200)}`,
      remediation: "Review and adjust language before publishing.",
    });
  }

  if (gateResult.allowed && findings.length === 0) {
    findings.push({
      id: `outbound-clear-${Date.now()}`,
      title: "Shared policy gate: CLEAR",
      description: "No blockers or warnings detected by the shared outbound policy gate.",
      severity: "INFO",
      source: `${OUTBOUND_GATE_ENGINE_ID}::shared-policy-gate::clear`,
      evidence: `${draft.text.length} chars reviewed for ${draft.provider}`,
    });
  }

  const severity = gateResult.blockers.length > 0 ? "HIGH"
    : gateResult.warnings.length > 0 ? "MEDIUM"
    : "INFO";

  const summary = gateResult.allowed
    ? `Shared policy gate ALLOWED — ${gateResult.warnings.length} warning(s).`
    : `Shared policy gate BLOCKED — ${gateResult.blockers.length} blocker(s), ${gateResult.warnings.length} warning(s).`;

  const durationMs = Date.now() - startTime;

  return {
    findings,
    summary,
    severity,
    engineVersion: OUTBOUND_GATE_VERSION,
    durationMs,
    limitations: [
      "Shared policy gate only — provider-specific constraints (X weighted chars, LinkedIn org URN) are not checked here.",
      "Approval workflow not simulated. This is a dry-run gate evaluation.",
    ],
    rawOutput: {
      engineId: OUTBOUND_GATE_ENGINE_ID,
      runAt: new Date().toISOString(),
      formulaSteps,
      allowed: gateResult.allowed,
      blockers: gateResult.blockers,
      warnings: gateResult.warnings,
    },
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const outboundPolicyGateAdapter = {
  id: OUTBOUND_GATE_ENGINE_ID,
  run,
  selfTest,
  getVersion,
};
