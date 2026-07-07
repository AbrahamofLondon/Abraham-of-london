/**
 * lib/intelligence/interaction-spine/product-interaction-mappers.ts
 *
 * OPP-05/06 — the registry that maps each product's PRODUCT-SPECIFIC typed output
 * into the canonical spine StructuredResult, without flattening it into a prose
 * summary. One mapping point per product family; an unmapped product fails closed
 * (it cannot silently write ungoverned memory). Runtime callers (playbook /run,
 * completeInstrumentRun, reporting cycle) map then call recordProductInteraction.
 */

import type { StructuredResult } from "./product-interaction-spine";
import type { PlaybookRunResult, Contradiction, PlaybookAction, Severity } from "@/lib/playbooks/playbook-run-types";

export class MapperError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(`[${code}] ${message}`); this.name = "MapperError"; this.code = code; }
}

export interface MappedInteraction {
  interactionType: string;
  structuredResult: StructuredResult;
}
export type ProductMapper = (native: unknown) => MappedInteraction;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}

/**
 * Playbook mapper — shared by the three governed playbooks. Preserves the typed
 * dimensions (contradictions, evidence gaps, severity, score) rather than a summary
 * string. Actions are recorded as forward commitments only when they carry an owner
 * intent; otherwise they remain recommendations (not fabricated commitments).
 */
export function playbookMapper(interactionType: string): ProductMapper {
  return (native: unknown): MappedInteraction => {
    const r = native as PlaybookRunResult<unknown>;
    if (!r || typeof r !== "object" || !("posture" in r) || !("overallSeverity" in r)) {
      throw new MapperError("INVALID_PLAYBOOK_RESULT", "Native result is not a PlaybookRunResult.");
    }
    const sev = r.overallSeverity as Severity;
    const structuredResult: StructuredResult = {
      summary: `${r.posture} · ${sev}`,
      contradictions: (r.contradictions ?? []).map((c: Contradiction) => ({ key: slug(c.ref), detail: c.detail, severity: sev })),
      evidenceGaps: (r.evidenceGaps ?? []).map((g: string) => ({ key: slug(g), detail: g })),
      signals: [{ key: `${interactionType}_score`, value: r.score ?? undefined, trend: undefined }],
      confidence: r.score == null ? 0.4 : Math.min(1, r.score / 100),
    };
    return { interactionType, structuredResult };
  };
}

/** Reporting-cycle mapper — one longitudinal datapoint per cycle (OPP-09). */
export const reportingCycleMapper: ProductMapper = (native: unknown): MappedInteraction => {
  const c = native as { periodLabel?: string; state?: string; findings?: { contradictions?: { key: string; detail?: string }[]; evidenceGaps?: { key: string }[]; signals?: { key: string; value?: number; trend?: "worsening" | "improving" | "flat" }[] } };
  if (!c || typeof c !== "object") throw new MapperError("INVALID_REPORTING_CYCLE", "Native result is not a reporting cycle.");
  return {
    interactionType: "reporting_cycle",
    structuredResult: {
      summary: `cycle ${c.periodLabel ?? "?"} · ${c.state ?? "?"}`,
      contradictions: (c.findings?.contradictions ?? []).map((x) => ({ key: x.key, detail: x.detail })),
      evidenceGaps: (c.findings?.evidenceGaps ?? []).map((x) => ({ key: x.key })),
      signals: (c.findings?.signals ?? []).map((s) => ({ key: s.key, value: s.value, trend: s.trend })),
    },
  };
};

/**
 * Decision-instrument mapper (OPP-05, §3.2) — shared by all governed instruments.
 * Instruments emit numeric scores + an optional typed result carrying contradictions,
 * evidence gaps and exposure state. We preserve those dimensions (not a prose blob);
 * numeric scores become signals so the twin can track movement across runs. The
 * result may name explicit exposures (e.g. regime/dependency exposure) — recorded as
 * signals prefixed `exposure_` so the cross-moat brief can intersect them with GMI.
 */
export const instrumentMapper: ProductMapper = (native: unknown): MappedInteraction => {
  const p = native as {
    instrumentSlug?: string;
    scores?: Record<string, unknown> | number[];
    result?: {
      contradictions?: { key?: string; ref?: string; detail?: string }[];
      evidenceGaps?: (string | { key: string; detail?: string })[];
      exposures?: (string | { key: string; detail?: string })[];
    };
  };
  if (!p || typeof p !== "object") throw new MapperError("INVALID_INSTRUMENT_RESULT", "Native result is not an instrument run.");
  const name = p.instrumentSlug ? slug(p.instrumentSlug) : "instrument";
  const result = p.result ?? {};
  const signals: NonNullable<StructuredResult["signals"]> = [];
  if (Array.isArray(p.scores)) {
    p.scores.forEach((v, i) => { if (typeof v === "number") signals.push({ key: `${name}_score_${i}` }); });
  } else if (p.scores && typeof p.scores === "object") {
    for (const [k, v] of Object.entries(p.scores)) if (typeof v === "number") signals.push({ key: slug(`${name}_${k}`), value: v });
  }
  for (const ex of result.exposures ?? []) {
    const key = typeof ex === "string" ? ex : ex.key;
    if (key) signals.push({ key: slug(`exposure_${key}`) });
  }
  const contradictions = (result.contradictions ?? []).map((c) => ({ key: slug(c.key ?? c.ref ?? "contradiction"), detail: c.detail }));
  const evidenceGaps = (result.evidenceGaps ?? []).map((g) => (typeof g === "string" ? { key: slug(g), detail: g } : { key: slug(g.key), detail: g.detail }));
  return {
    interactionType: "instrument_run",
    structuredResult: { summary: `${name} · instrument`, contradictions, evidenceGaps, signals },
  };
};

/** The 11 governed decision instruments (slugs from instrument-run-authority). */
const INSTRUMENT_SLUGS = [
  "decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector",
  "escalation-readiness-scorecard", "structural-failure-diagnostic-canvas", "execution-risk-index",
  "team-alignment-gap-map", "governance-drift-detector", "strategic-priority-stack-builder",
  "board-brief-builder", "operator-decision-pack",
] as const;

export const PRODUCT_MAPPERS: Record<string, ProductMapper> = {
  execution_integrity_protocol: playbookMapper("execution_integrity_run"),
  alignment_audit_playbook: playbookMapper("alignment_audit_run"),
  drift_detection_framework: playbookMapper("drift_detection_run"),
  reporting_monthly: reportingCycleMapper,
  ...Object.fromEntries(INSTRUMENT_SLUGS.map((s) => [s, instrumentMapper])),
};

export function isMappedProduct(productCode: string): boolean {
  return productCode in PRODUCT_MAPPERS;
}

/** Map a product's native structured output to a canonical interaction. Fail-closed. */
export function mapProductResultToInteraction(productCode: string, native: unknown): MappedInteraction {
  const mapper = PRODUCT_MAPPERS[productCode];
  if (!mapper) {
    throw new MapperError("UNMAPPED_PRODUCT", `"${productCode}" has no interaction mapper; it cannot write governed memory until mapped.`);
  }
  return mapper(native);
}
