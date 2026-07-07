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

export const PRODUCT_MAPPERS: Record<string, ProductMapper> = {
  execution_integrity_protocol: playbookMapper("execution_integrity_run"),
  alignment_audit_playbook: playbookMapper("alignment_audit_run"),
  drift_detection_framework: playbookMapper("drift_detection_run"),
  reporting_monthly: reportingCycleMapper,
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
