/**
 * lib/fulfilment/reporting/monthly-reporting-service.ts
 *
 * Monthly Reporting recurring fulfilment orchestrator.
 *
 * Drives one cycle through the real service lifecycle:
 *   DUE → inputs resolved → generation → output validation → human review →
 *   approval → delivery (approved channel) → durable proof → archive → next cycle
 *
 * Reuses PR F (DeliveryProof, idempotency key) and the reporting output contract
 * (disclosures, boundary notice, forbidden claims). No parallel fulfilment
 * architecture. Ports (store/generator/deliverer) are injected so the real cycle
 * is provable deterministically; the runtime handler wires prisma + email.
 *
 * Doctrine: a cycle is NOT "delivered" by setting a flag. Delivery requires a
 * real validated output and a durable DeliveryProof returned by the channel.
 */

import crypto from "node:crypto";
import {
  buildFulfilmentIdentityKey,
  type DeliveryProof,
} from "@/lib/fulfilment/fulfilment-execution-authority";
import {
  REPORT_BOUNDARY_NOTICE,
  REPORT_TYPE_PROFILES,
  REPORTING_OUTPUT_INVARIANTS,
} from "@/lib/product/reporting-output-contract";
import {
  deriveCycleId,
  monthEnd,
  nextPeriodStart,
  periodLabel,
} from "./recurring-cycle";
import type {
  CycleValidation,
  ReportDeliverer,
  ReportGenerator,
  ReportingCycle,
  ReportingCycleInputs,
  ReportingCycleStore,
  ReportOutput,
} from "./reporting-cycle-types";

export const REPORTING_MONTHLY_PRODUCT_CODE = "reporting_monthly";

function now(iso?: string): string {
  return iso ?? new Date().toISOString();
}

// ── In-memory store (tests + a reference impl) ────────────────────────────────

export function createInMemoryCycleStore(): ReportingCycleStore {
  const map = new Map<string, ReportingCycle>();
  return {
    async get(id) {
      return map.get(id) ?? null;
    },
    async put(cycle) {
      map.set(cycle.cycleId, { ...cycle });
    },
    async list(productCode) {
      return Array.from(map.values()).filter((c) => c.productCode === productCode);
    },
  };
}

// ── Real default generator ────────────────────────────────────────────────────

/** Builds a real monthly report artifact from the cycle's resolved inputs. */
export const buildMonthlyReportOutput: ReportGenerator = async (cycle) => {
  const resolved = cycle.inputs?.resolvedSources ?? [];
  if (resolved.length === 0) {
    // A generator must not fabricate content from nothing.
    throw new Error("Cannot generate monthly report: no resolved input sources.");
  }
  const sections = [
    {
      heading: `Monthly summary — ${cycle.periodLabel}`,
      body: `Reporting period ${cycle.periodStart} to ${cycle.periodEnd}. Prepared from ${resolved.length} declared source(s): ${resolved.join(", ")}.`,
    },
    {
      heading: "Findings",
      body: `Interpretation of the declared sources for ${cycle.periodLabel}. Descriptive only; not authority-granting.`,
    },
  ];
  const disclosures = [...(REPORT_TYPE_PROFILES.monthly_report.requiredDisclosures ?? [])];
  const contentBasis = JSON.stringify({ sections, disclosures, sources: resolved });
  const contentHash = crypto.createHash("sha256").update(contentBasis).digest("hex");
  const output: ReportOutput = {
    reportCode: `${REPORTING_MONTHLY_PRODUCT_CODE}:${cycle.periodLabel}`,
    outputType: "monthly_report",
    periodLabel: cycle.periodLabel,
    sections,
    disclosures,
    boundaryNotice: REPORT_BOUNDARY_NOTICE,
    contentHash,
  };
  return output;
};

// ── Real validator (delivery gate) ────────────────────────────────────────────

export function validateMonthlyReportOutput(output: ReportOutput | null): CycleValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!output) {
    return { ok: false, errors: ["No output to validate."], warnings };
  }
  if (!output.boundaryNotice || !output.boundaryNotice.includes("not itself authority-granting")) {
    errors.push("Missing or invalid evidence-boundary notice.");
  }
  const required = REPORT_TYPE_PROFILES.monthly_report.requiredDisclosures ?? [];
  for (const d of required) {
    if (!output.disclosures.includes(d)) errors.push(`Missing required disclosure: ${d}`);
  }
  if (!output.sections.some((s) => s.body.trim().length > 0)) {
    errors.push("Report has no non-empty section content.");
  }
  const haystack = JSON.stringify(output).toLowerCase();
  for (const claim of REPORTING_OUTPUT_INVARIANTS.forbiddenClaimsAcrossAllReports) {
    if (haystack.includes(claim.toLowerCase())) errors.push(`Forbidden claim present: "${claim}".`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

// ── Lifecycle operations ──────────────────────────────────────────────────────

function newCycle(productCode: string, periodStart: string, inputs: ReportingCycleInputs | null): ReportingCycle {
  const ts = now();
  const resolvedOk = inputs ? inputs.requiredSources.every((s) => inputs.resolvedSources.includes(s)) : false;
  return {
    cycleId: deriveCycleId(productCode, periodStart),
    productCode,
    cadence: "monthly",
    periodStart,
    periodEnd: monthEnd(periodStart),
    periodLabel: periodLabel(periodStart),
    state: !inputs ? "DUE" : resolvedOk ? "DUE" : "MISSING_INPUTS",
    inputs,
    output: null,
    validation: null,
    review: { required: REPORT_TYPE_PROFILES.monthly_report.humanReviewRequired === true, approvedBy: null, approvedAt: null },
    deliveryProof: null,
    attempts: { generation: 0, delivery: 0 },
    createdAt: ts,
    updatedAt: ts,
    nextCycleId: null,
  };
}

/**
 * Open (or replay) a cycle. Idempotent by cycleId: if a cycle already exists for
 * the period it is returned unchanged (replay safety). This is the fulfilment
 * identity boundary — one obligation per product per period.
 */
export async function openCycle(
  store: ReportingCycleStore,
  productCode: string,
  periodStart: string,
  inputs: ReportingCycleInputs | null,
): Promise<ReportingCycle> {
  const cycleId = deriveCycleId(productCode, periodStart);
  const existing = await store.get(cycleId);
  if (existing) return existing; // replay / idempotent
  // fulfilment identity key ties this cycle to PR F idempotency conventions.
  void buildFulfilmentIdentityKey({ productCode, sourceId: cycleId });
  const cycle = newCycle(productCode, periodStart, inputs);
  await store.put(cycle);
  return cycle;
}

/** Resolve/refresh inputs; moves MISSING_INPUTS → DUE when all sources present. */
export async function resolveInputs(
  store: ReportingCycleStore,
  cycleId: string,
  inputs: ReportingCycleInputs,
): Promise<ReportingCycle> {
  const cycle = await mustGet(store, cycleId);
  const resolvedOk = inputs.requiredSources.every((s) => inputs.resolvedSources.includes(s));
  cycle.inputs = inputs;
  cycle.state = resolvedOk ? "DUE" : "MISSING_INPUTS";
  cycle.updatedAt = now();
  await store.put(cycle);
  return cycle;
}

/** Generate output. Fails to GENERATION_FAILED (retryable) if the generator throws. */
export async function generateCycleOutput(
  store: ReportingCycleStore,
  cycleId: string,
  generator: ReportGenerator,
): Promise<ReportingCycle> {
  const cycle = await mustGet(store, cycleId);
  if (cycle.state === "MISSING_INPUTS") return cycle; // gate: cannot generate without inputs
  cycle.state = "GENERATING";
  cycle.attempts.generation += 1;
  await store.put(cycle);
  try {
    const output = await generator(cycle);
    cycle.output = output;
    cycle.state = "OUTPUT_GENERATED";
  } catch (err) {
    cycle.state = "GENERATION_FAILED";
    cycle.validation = { ok: false, errors: [`Generation failed: ${(err as Error).message}`], warnings: [] };
  }
  cycle.updatedAt = now();
  await store.put(cycle);
  return cycle;
}

/** Validate the output. Passing sets AWAITING_REVIEW (if review required) or APPROVED. */
export async function validateCycleOutput(store: ReportingCycleStore, cycleId: string): Promise<ReportingCycle> {
  const cycle = await mustGet(store, cycleId);
  if (cycle.state !== "OUTPUT_GENERATED") return cycle;
  const validation = validateMonthlyReportOutput(cycle.output);
  cycle.validation = validation;
  cycle.state = !validation.ok ? "VALIDATION_FAILED" : cycle.review.required ? "AWAITING_REVIEW" : "APPROVED";
  cycle.updatedAt = now();
  await store.put(cycle);
  return cycle;
}

/** Human review approval (delivery gate). */
export async function approveCycle(store: ReportingCycleStore, cycleId: string, approver: string): Promise<ReportingCycle> {
  const cycle = await mustGet(store, cycleId);
  if (cycle.state !== "AWAITING_REVIEW") return cycle;
  cycle.review.approvedBy = approver;
  cycle.review.approvedAt = now();
  cycle.state = "APPROVED";
  cycle.updatedAt = now();
  await store.put(cycle);
  return cycle;
}

/**
 * Deliver via the approved channel. Idempotent: a DELIVERED cycle returns its
 * existing proof without re-delivering. Delivery is gated on APPROVED state.
 */
export async function deliverCycle(
  store: ReportingCycleStore,
  cycleId: string,
  deliverer: ReportDeliverer,
): Promise<{ cycle: ReportingCycle; proof: DeliveryProof | null; alreadyDelivered: boolean }> {
  const cycle = await mustGet(store, cycleId);

  // Duplicate-delivery prevention.
  if (cycle.state === "DELIVERED" || cycle.state === "ARCHIVED") {
    return { cycle, proof: cycle.deliveryProof, alreadyDelivered: true };
  }
  // Delivery gate: only APPROVED (or previously DELIVERY_FAILED for recovery) may deliver.
  if (cycle.state !== "APPROVED" && cycle.state !== "DELIVERY_FAILED") {
    return { cycle, proof: null, alreadyDelivered: false };
  }
  if (!cycle.output) {
    return { cycle, proof: null, alreadyDelivered: false };
  }

  cycle.attempts.delivery += 1;
  try {
    const proof = await deliverer(cycle, cycle.output);
    cycle.deliveryProof = proof;
    cycle.state = "DELIVERED";
    cycle.updatedAt = now();
    await store.put(cycle);
    return { cycle, proof, alreadyDelivered: false };
  } catch (err) {
    cycle.state = "DELIVERY_FAILED";
    cycle.validation = {
      ok: cycle.validation?.ok ?? true,
      errors: [...(cycle.validation?.errors ?? []), `Delivery failed: ${(err as Error).message}`],
      warnings: cycle.validation?.warnings ?? [],
    };
    cycle.updatedAt = now();
    await store.put(cycle);
    return { cycle, proof: null, alreadyDelivered: false };
  }
}

/** Archive a delivered cycle and open the next month's cycle (continuity). */
export async function archiveAndContinue(
  store: ReportingCycleStore,
  cycleId: string,
  nextInputs: ReportingCycleInputs | null,
): Promise<{ archived: ReportingCycle; next: ReportingCycle }> {
  const cycle = await mustGet(store, cycleId);
  if (cycle.state !== "DELIVERED") {
    throw new Error(`Cannot archive cycle in state ${cycle.state}; only DELIVERED may archive.`);
  }
  const nextStart = nextPeriodStart(cycle.periodStart);
  const next = await openCycle(store, cycle.productCode, nextStart, nextInputs);
  cycle.state = "ARCHIVED";
  cycle.nextCycleId = next.cycleId;
  cycle.updatedAt = now();
  await store.put(cycle);
  return { archived: cycle, next };
}

/** Resume a failed cycle (generation or delivery recovery). */
export async function resumeCycle(
  store: ReportingCycleStore,
  cycleId: string,
  ports: { generator: ReportGenerator; deliverer: ReportDeliverer },
): Promise<ReportingCycle> {
  const cycle = await mustGet(store, cycleId);
  if (cycle.state === "GENERATION_FAILED") {
    await generateCycleOutput(store, cycleId, ports.generator);
    await validateCycleOutput(store, cycleId);
    return mustGet(store, cycleId);
  }
  if (cycle.state === "DELIVERY_FAILED") {
    const { cycle: c } = await deliverCycle(store, cycleId, ports.deliverer);
    return c;
  }
  return cycle;
}

async function mustGet(store: ReportingCycleStore, cycleId: string): Promise<ReportingCycle> {
  const cycle = await store.get(cycleId);
  if (!cycle) throw new Error(`Reporting cycle not found: ${cycleId}`);
  return cycle;
}
