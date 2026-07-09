/**
 * lib/fulfilment/reporting/custom-reporting-service.ts
 *
 * Custom Reporting engagement orchestrator. Distinct from Monthly Reporting in:
 *   trigger      — inquiry-driven (not cadence)
 *   scope        — negotiated brief + explicit scope lock (not standard)
 *   inputs       — engagement-specific required sources
 *   output       — one bespoke deliverable per agreed scope
 *   review       — internal review + client review loop
 *   revisions    — included in-scope revisions + out-of-scope change control
 *   versioning   — scope amendments bump a scope version
 *   completion   — final approval of the agreed deliverable (not a period boundary)
 *
 * Reuses PR F DeliveryProof + idempotency and the reporting output contract
 * (custom_report profile). No separate custom-reporting fulfilment framework.
 */

import crypto from "node:crypto";
import { buildFulfilmentIdentityKey, type DeliveryProof } from "@/lib/fulfilment/fulfilment-execution-authority";
import {
  REPORT_BOUNDARY_NOTICE,
  REPORT_TYPE_PROFILES,
  REPORTING_OUTPUT_INVARIANTS,
} from "@/lib/product/reporting-output-contract";
import type {
  BriefInput,
  CustomEngagement,
  CustomEngagementStore,
  CustomReportDeliverer,
  CustomReportGenerator,
  CycleValidation,
  InquiryInput,
  ReportOutput,
} from "./custom-reporting-types";

export const REPORTING_CUSTOM_PRODUCT_CODE = "reporting_custom";
const DEFAULT_INCLUDED_REVISIONS = 2;

function now(): string {
  return new Date().toISOString();
}

export function createInMemoryEngagementStore(): CustomEngagementStore {
  const map = new Map<string, CustomEngagement>();
  return {
    async get(id) {
      return map.get(id) ?? null;
    },
    async put(e) {
      map.set(e.engagementId, structuredClone(e));
    },
    async list() {
      return Array.from(map.values());
    },
  };
}

// ── Real generator + validator (custom_report profile) ────────────────────────

export const buildCustomReportOutput: CustomReportGenerator = async (e) => {
  if (!e.scope.locked) throw new Error("Cannot produce a custom report before scope is locked.");
  if (e.resolvedSources.length === 0) throw new Error("Cannot produce a custom report with no resolved sources.");
  const sections = [
    { heading: `Bespoke deliverable — ${e.scope.deliverable}`, body: `Scope v${e.scope.version}. Prepared for ${e.client.org ?? e.client.email} against the accepted brief.` },
    { heading: "Analysis", body: `Interpretation drawn from ${e.resolvedSources.length} agreed source(s): ${e.resolvedSources.join(", ")}. Descriptive only; not authority-granting.` },
  ];
  const disclosures = [...(REPORT_TYPE_PROFILES.custom_report.requiredDisclosures ?? [])];
  const basis = JSON.stringify({ sections, disclosures, deliverable: e.scope.deliverable, version: e.scope.version, sources: e.resolvedSources });
  const contentHash = crypto.createHash("sha256").update(basis).digest("hex");
  const output: ReportOutput = {
    reportCode: `${REPORTING_CUSTOM_PRODUCT_CODE}:${e.engagementId}:v${e.scope.version}`,
    outputType: "custom_report",
    periodLabel: `v${e.scope.version}`,
    sections,
    disclosures,
    boundaryNotice: REPORT_BOUNDARY_NOTICE,
    contentHash,
  };
  return output;
};

export function validateCustomReportOutput(output: ReportOutput | null, deliverable: string): CycleValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!output) return { ok: false, errors: ["No output to validate."], warnings };
  if (!output.boundaryNotice || !output.boundaryNotice.includes("not itself authority-granting")) {
    errors.push("Missing or invalid evidence-boundary notice.");
  }
  for (const d of REPORT_TYPE_PROFILES.custom_report.requiredDisclosures ?? []) {
    if (!output.disclosures.includes(d)) errors.push(`Missing required disclosure: ${d}`);
  }
  if (!output.sections.some((s) => s.body.trim().length > 0)) errors.push("Report has no non-empty section content.");
  // completion criterion: the deliverable must actually be addressed.
  if (deliverable && !output.sections.some((s) => s.heading.includes(deliverable))) {
    errors.push("Output does not reference the agreed deliverable.");
  }
  const haystack = JSON.stringify(output).toLowerCase();
  for (const claim of REPORTING_OUTPUT_INVARIANTS.forbiddenClaimsAcrossAllReports) {
    if (haystack.includes(claim.toLowerCase())) errors.push(`Forbidden claim present: "${claim}".`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

// ── Engagement lifecycle ──────────────────────────────────────────────────────

async function mustGet(store: CustomEngagementStore, id: string): Promise<CustomEngagement> {
  const e = await store.get(id);
  if (!e) throw new Error(`Custom engagement not found: ${id}`);
  return e;
}

/** Open (or replay) an inquiry. Idempotent by engagementId. */
export async function openInquiry(store: CustomEngagementStore, input: InquiryInput): Promise<CustomEngagement> {
  const existing = await store.get(input.engagementId);
  if (existing) return existing;
  void buildFulfilmentIdentityKey({ productCode: REPORTING_CUSTOM_PRODUCT_CODE, sourceId: input.engagementId, email: input.clientEmail });
  const ts = now();
  const e: CustomEngagement = {
    engagementId: input.engagementId,
    productCode: "reporting_custom",
    client: { email: input.clientEmail, org: input.clientOrg ?? null },
    state: "INQUIRY",
    qualification: { qualified: null, reason: null },
    brief: { draft: null, accepted: false, acceptedAt: null },
    scope: { locked: false, lockedAt: null, version: 0, deliverable: "", requiredSources: [] },
    scopeHistory: [],
    resolvedSources: [],
    output: null,
    validation: null,
    review: { internalApprovedBy: null, clientApprovedAt: null, finalApprovedBy: null },
    revisions: { includedAllowance: DEFAULT_INCLUDED_REVISIONS, includedUsed: 0 },
    changeRequests: [],
    deliveryProof: null,
    attempts: { generation: 0, delivery: 0 },
    createdAt: ts,
    updatedAt: ts,
  };
  await store.put(e);
  return e;
}

/** Qualification gate with an explicit rejection path. */
export async function qualifyEngagement(
  store: CustomEngagementStore,
  id: string,
  decision: { qualified: boolean; reason: string },
): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "INQUIRY") return e;
  e.qualification = { qualified: decision.qualified, reason: decision.reason };
  e.state = decision.qualified ? "QUALIFIED" : "REJECTED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Draft the brief (only after qualification). */
export async function draftBrief(store: CustomEngagementStore, id: string, brief: BriefInput): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "QUALIFIED") return e;
  e.brief.draft = brief.draft;
  e.scope.deliverable = brief.deliverable;
  e.scope.requiredSources = [...brief.requiredSources];
  e.state = "BRIEF_DRAFTED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Client accepts the brief. Without acceptance, scope cannot lock. */
export async function acceptBrief(store: CustomEngagementStore, id: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "BRIEF_DRAFTED") return e;
  e.brief.accepted = true;
  e.brief.acceptedAt = now();
  e.state = "BRIEF_ACCEPTED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Explicit scope lock. Records scope version 1. */
export async function lockScope(store: CustomEngagementStore, id: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "BRIEF_ACCEPTED") return e;
  e.scope.locked = true;
  e.scope.lockedAt = now();
  e.scope.version = 1;
  e.scopeHistory.push({ version: 1, deliverable: e.scope.deliverable, requiredSources: [...e.scope.requiredSources], lockedAt: e.scope.lockedAt, reason: "initial scope lock" });
  e.state = "SCOPE_LOCKED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Provide sources. Only after scope lock. Enforces scope: unknown sources are ignored. */
export async function provideSources(store: CustomEngagementStore, id: string, sources: string[]): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (!e.scope.locked) throw new Error("Cannot provide sources before scope lock.");
  e.resolvedSources = sources.filter((s) => e.scope.requiredSources.includes(s));
  const complete = e.scope.requiredSources.every((s) => e.resolvedSources.includes(s));
  e.state = complete ? "SCOPE_LOCKED" : "MISSING_SOURCES";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Begin production. Gate: scope locked + all sources resolved. */
export async function startProduction(store: CustomEngagementStore, id: string, generator: CustomReportGenerator): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  const complete = e.scope.locked && e.scope.requiredSources.every((s) => e.resolvedSources.includes(s));
  if (!complete) return e; // gated
  e.state = "IN_PRODUCTION";
  e.attempts.generation += 1;
  await store.put(e);
  try {
    e.output = await generator(e);
    e.state = "OUTPUT_GENERATED";
  } catch (err) {
    e.state = "GENERATION_FAILED";
    e.validation = { ok: false, errors: [`Generation failed: ${(err as Error).message}`], warnings: [] };
  }
  e.updatedAt = now();
  await store.put(e);
  return e;
}

export async function validateEngagementOutput(store: CustomEngagementStore, id: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "OUTPUT_GENERATED") return e;
  const v = validateCustomReportOutput(e.output, e.scope.deliverable);
  e.validation = v;
  e.state = v.ok ? "INTERNAL_REVIEW" : "VALIDATION_FAILED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

export async function internalReview(store: CustomEngagementStore, id: string, reviewer: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "INTERNAL_REVIEW") return e;
  e.review.internalApprovedBy = reviewer;
  e.state = "CLIENT_REVIEW";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Client requests an in-scope revision (consumes included allowance). */
export async function requestIncludedRevision(store: CustomEngagementStore, id: string): Promise<{ engagement: CustomEngagement; accepted: boolean }> {
  const e = await mustGet(store, id);
  if (e.state !== "CLIENT_REVIEW") return { engagement: e, accepted: false };
  if (e.revisions.includedUsed >= e.revisions.includedAllowance) {
    // exhausted → must be handled as a change request instead
    return { engagement: e, accepted: false };
  }
  e.revisions.includedUsed += 1;
  e.state = "REVISION_IN_PROGRESS";
  e.updatedAt = now();
  await store.put(e);
  return { engagement: e, accepted: true };
}

/** Re-run production for an in-scope revision. */
export async function applyRevision(store: CustomEngagementStore, id: string, generator: CustomReportGenerator): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "REVISION_IN_PROGRESS") return e;
  e.state = "SCOPE_LOCKED"; // back through production within the SAME locked scope
  await store.put(e);
  await startProduction(store, id, generator);
  return validateEngagementOutput(store, id);
}

/** Client raises an out-of-scope change request. */
export async function raiseChangeRequest(store: CustomEngagementStore, id: string, description: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "CLIENT_REVIEW" && e.state !== "SCOPE_LOCKED") return e;
  e.changeRequests.push({ id: crypto.randomUUID(), description, inScope: false, resolvedByAmendmentVersion: null, createdAt: now() });
  e.state = "CHANGE_REQUESTED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Amend scope (versioned). Resolves the open change request; re-locks at new version. */
export async function amendScope(
  store: CustomEngagementStore,
  id: string,
  amendment: { deliverable?: string; addSources?: string[]; reason: string },
): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "CHANGE_REQUESTED") return e;
  e.scope.version += 1;
  if (amendment.deliverable) e.scope.deliverable = amendment.deliverable;
  if (amendment.addSources) e.scope.requiredSources = Array.from(new Set([...e.scope.requiredSources, ...amendment.addSources]));
  e.scope.lockedAt = now();
  e.scopeHistory.push({ version: e.scope.version, deliverable: e.scope.deliverable, requiredSources: [...e.scope.requiredSources], lockedAt: e.scope.lockedAt, reason: amendment.reason });
  const open = e.changeRequests.find((c) => c.resolvedByAmendmentVersion === null);
  if (open) open.resolvedByAmendmentVersion = e.scope.version;
  // new sources may now be missing → require re-collection
  const complete = e.scope.requiredSources.every((s) => e.resolvedSources.includes(s));
  e.state = complete ? "SCOPE_LOCKED" : "MISSING_SOURCES";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Final approval — completion criterion. Requires internal + client review passage. */
export async function finalApprove(store: CustomEngagementStore, id: string, approver: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "CLIENT_REVIEW") return e;
  e.review.clientApprovedAt = now();
  e.review.finalApprovedBy = approver;
  e.state = "FINAL_APPROVED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Deliver via the approved channel. Gate: FINAL_APPROVED. Idempotent. */
export async function deliverEngagement(
  store: CustomEngagementStore,
  id: string,
  deliverer: CustomReportDeliverer,
): Promise<{ engagement: CustomEngagement; proof: DeliveryProof | null; alreadyDelivered: boolean }> {
  const e = await mustGet(store, id);
  if (e.state === "DELIVERED" || e.state === "ARCHIVED") return { engagement: e, proof: e.deliveryProof, alreadyDelivered: true };
  if (e.state !== "FINAL_APPROVED" && e.state !== "DELIVERY_FAILED") return { engagement: e, proof: null, alreadyDelivered: false };
  if (!e.output) return { engagement: e, proof: null, alreadyDelivered: false };
  e.attempts.delivery += 1;
  try {
    const proof = await deliverer(e, e.output);
    e.deliveryProof = proof;
    e.state = "DELIVERED";
    e.updatedAt = now();
    await store.put(e);
    return { engagement: e, proof, alreadyDelivered: false };
  } catch (err) {
    e.state = "DELIVERY_FAILED";
    e.validation = { ok: e.validation?.ok ?? true, errors: [...(e.validation?.errors ?? []), `Delivery failed: ${(err as Error).message}`], warnings: e.validation?.warnings ?? [] };
    e.updatedAt = now();
    await store.put(e);
    return { engagement: e, proof: null, alreadyDelivered: false };
  }
}

export async function archiveEngagement(store: CustomEngagementStore, id: string): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state !== "DELIVERED") throw new Error(`Cannot archive engagement in state ${e.state}; only DELIVERED may archive.`);
  e.state = "ARCHIVED";
  e.updatedAt = now();
  await store.put(e);
  return e;
}

/** Recover a failed engagement (generation or delivery). */
export async function resumeEngagement(
  store: CustomEngagementStore,
  id: string,
  ports: { generator: CustomReportGenerator; deliverer: CustomReportDeliverer },
): Promise<CustomEngagement> {
  const e = await mustGet(store, id);
  if (e.state === "GENERATION_FAILED") {
    e.state = "SCOPE_LOCKED";
    await store.put(e);
    await startProduction(store, id, ports.generator);
    return validateEngagementOutput(store, id);
  }
  if (e.state === "DELIVERY_FAILED") {
    const { engagement } = await deliverEngagement(store, id, ports.deliverer);
    return engagement;
  }
  return e;
}
