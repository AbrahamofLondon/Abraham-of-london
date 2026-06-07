/**
 * lib/falsification/product-falsification.ts
 *
 * Generalised falsification panel for all paid product artifacts.
 *
 * Every HIGH/MEDIUM confidence claim in a paid output must have a
 * FalsificationEntry. If no falsification condition exists, confidence
 * cannot be HIGH. If source is pending, the artifact must state so and
 * lower confidence accordingly.
 *
 * Rules:
 * - HIGH/MEDIUM confidence → requires falsification entry
 * - SOURCE_PENDING → confidence must be MONITORING or LOW (never HIGH/MEDIUM without note)
 * - OVERTURNED entries must trigger artifact amendment
 * - Admin can inspect all falsification panels across the estate
 */

import { prisma } from "@/lib/prisma.server";

// ── Types ────────────────────────────────────────────────────────────────────

export type FalsificationConfidenceLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "MONITORING";

export type FalsificationStatus =
  | "MONITORING"
  | "CONFIRMED"
  | "OVERTURNED"
  | "EXPIRED";

export type FalsificationEntry = {
  id: string;
  productCode: string;
  artifactId: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  claimOrRecommendation: string;
  confidenceLevel: FalsificationConfidenceLevel;
  whatWouldChangeThisView: string;
  observableIndicator: string;
  threshold: string | null;
  reviewDate: Date | null;
  evidenceCurrentlyMissing: string | null;
  strongestCounterargument: string | null;
  responseToCounterargument: string | null;
  status: FalsificationStatus;
  overturnedAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateFalsificationInput = {
  productCode: string;
  artifactId?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  claimOrRecommendation: string;
  confidenceLevel: FalsificationConfidenceLevel;
  whatWouldChangeThisView: string;
  observableIndicator: string;
  threshold?: string | null;
  reviewDate?: Date | null;
  evidenceCurrentlyMissing?: string | null;
  strongestCounterargument?: string | null;
  responseToCounterargument?: string | null;
};

export type FalsificationPanel = {
  artifactId: string | null;
  productCode: string;
  entries: FalsificationEntry[];
  hasHighConfidenceClaims: boolean;
  allHighClaimsFalsified: boolean;
  hasUncoveredHighClaims: boolean;
  hasPendingEvidence: boolean;
  panelComplete: boolean;
  warnings: string[];
};

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate that a claim at a given confidence level is permitted.
 * HIGH/MEDIUM claims without falsification conditions are blocked.
 * SOURCE_PENDING evidence cannot support HIGH/MEDIUM confidence.
 */
export function validateClaimConfidence(input: {
  confidenceLevel: FalsificationConfidenceLevel;
  hasSourcePending: boolean;
  hasFalsificationCondition: boolean;
}): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (input.hasSourcePending && (input.confidenceLevel === "HIGH" || input.confidenceLevel === "MEDIUM")) {
    violations.push(
      `SOURCE_PENDING evidence cannot support ${input.confidenceLevel} confidence. ` +
        "Lower to MONITORING or LOW until source is verified.",
    );
  }

  if (
    (input.confidenceLevel === "HIGH" || input.confidenceLevel === "MEDIUM") &&
    !input.hasFalsificationCondition
  ) {
    violations.push(
      `${input.confidenceLevel} confidence claims require a falsification condition. ` +
        "Specify what would change this view before publishing.",
    );
  }

  return { valid: violations.length === 0, violations };
}

// ── Write Operations ─────────────────────────────────────────────────────────

export async function createFalsificationEntry(
  input: CreateFalsificationInput,
): Promise<FalsificationEntry> {
  const validation = validateClaimConfidence({
    confidenceLevel: input.confidenceLevel,
    hasSourcePending: Boolean(input.evidenceCurrentlyMissing),
    hasFalsificationCondition: Boolean(input.whatWouldChangeThisView?.trim()),
  });

  if (!validation.valid) {
    throw new Error(
      `Falsification validation failed: ${validation.violations.join("; ")}`,
    );
  }

  const record = await prisma.falsificationEntry.create({
    data: {
      productCode: input.productCode,
      artifactId: input.artifactId ?? null,
      sourceEntityType: input.sourceEntityType ?? null,
      sourceEntityId: input.sourceEntityId ?? null,
      claimOrRecommendation: input.claimOrRecommendation,
      confidenceLevel: input.confidenceLevel,
      whatWouldChangeThisView: input.whatWouldChangeThisView,
      observableIndicator: input.observableIndicator,
      threshold: input.threshold ?? null,
      reviewDate: input.reviewDate ?? null,
      evidenceCurrentlyMissing: input.evidenceCurrentlyMissing ?? null,
      strongestCounterargument: input.strongestCounterargument ?? null,
      responseToCounterargument: input.responseToCounterargument ?? null,
      status: "MONITORING",
    },
  });

  return parseFalsificationRecord(record);
}

export async function createFalsificationPanel(
  inputs: CreateFalsificationInput[],
): Promise<FalsificationEntry[]> {
  return Promise.all(inputs.map(createFalsificationEntry));
}

export async function updateFalsificationStatus(
  id: string,
  status: FalsificationStatus,
): Promise<FalsificationEntry> {
  const now = new Date();
  const record = await prisma.falsificationEntry.update({
    where: { id },
    data: {
      status,
      ...(status === "CONFIRMED" ? { confirmedAt: now } : {}),
      ...(status === "OVERTURNED" ? { overturnedAt: now } : {}),
    },
  });
  return parseFalsificationRecord(record);
}

// ── Read Operations ──────────────────────────────────────────────────────────

export async function getFalsificationPanel(
  artifactId: string,
): Promise<FalsificationPanel> {
  const entries = await prisma.falsificationEntry.findMany({
    where: { artifactId },
    orderBy: { createdAt: "asc" },
  });

  const parsed = entries.map(parseFalsificationRecord);
  return buildPanel(artifactId, null, parsed);
}

export async function getFalsificationPanelForProduct(
  productCode: string,
  sourceEntityId: string,
): Promise<FalsificationPanel> {
  const entries = await prisma.falsificationEntry.findMany({
    where: { productCode, sourceEntityId },
    orderBy: { createdAt: "asc" },
  });

  const parsed = entries.map(parseFalsificationRecord);
  return buildPanel(null, productCode, parsed);
}

export async function getUncoveredHighConfidenceClaims(
  artifactId: string,
): Promise<FalsificationEntry[]> {
  const panel = await getFalsificationPanel(artifactId);
  return panel.entries.filter(
    (e) =>
      (e.confidenceLevel === "HIGH" || e.confidenceLevel === "MEDIUM") &&
      e.status === "MONITORING" &&
      !e.whatWouldChangeThisView,
  );
}

export async function getOverturnedEntries(
  productCode?: string,
): Promise<FalsificationEntry[]> {
  const records = await prisma.falsificationEntry.findMany({
    where: {
      status: "OVERTURNED",
      ...(productCode ? { productCode } : {}),
    },
    orderBy: { overturnedAt: "desc" },
    take: 100,
  });
  return records.map(parseFalsificationRecord);
}

export async function getEntriesDueForReview(
  beforeDate?: Date,
): Promise<FalsificationEntry[]> {
  const cutoff = beforeDate ?? new Date();
  const records = await prisma.falsificationEntry.findMany({
    where: {
      status: "MONITORING",
      reviewDate: { lte: cutoff },
    },
    orderBy: { reviewDate: "asc" },
  });
  return records.map(parseFalsificationRecord);
}

// ── Panel Builder ─────────────────────────────────────────────────────────────

function buildPanel(
  artifactId: string | null,
  productCode: string | null,
  entries: FalsificationEntry[],
): FalsificationPanel {
  const warnings: string[] = [];

  const highOrMedium = entries.filter(
    (e) => e.confidenceLevel === "HIGH" || e.confidenceLevel === "MEDIUM",
  );
  const covered = highOrMedium.filter((e) => e.whatWouldChangeThisView?.trim());
  const pendingEvidence = entries.filter(
    (e) => e.evidenceCurrentlyMissing?.trim(),
  );

  if (pendingEvidence.length > 0) {
    warnings.push(
      `${pendingEvidence.length} claim(s) have pending evidence. ` +
        "These must not be presented as settled.",
    );
  }

  const hasUncoveredHighClaims =
    highOrMedium.length > 0 && covered.length < highOrMedium.length;
  if (hasUncoveredHighClaims) {
    warnings.push(
      `${highOrMedium.length - covered.length} HIGH/MEDIUM claim(s) lack falsification conditions.`,
    );
  }

  const overturned = entries.filter((e) => e.status === "OVERTURNED");
  if (overturned.length > 0) {
    warnings.push(
      `${overturned.length} claim(s) have been overturned. Artifact amendment required.`,
    );
  }

  const panelComplete =
    entries.length > 0 &&
    highOrMedium.length > 0 &&
    covered.length === highOrMedium.length &&
    pendingEvidence.length === 0 &&
    overturned.length === 0;

  return {
    artifactId,
    productCode: productCode ?? entries[0]?.productCode ?? "",
    entries,
    hasHighConfidenceClaims: highOrMedium.length > 0,
    allHighClaimsFalsified: highOrMedium.length > 0 && covered.length === highOrMedium.length,
    hasUncoveredHighClaims,
    hasPendingEvidence: pendingEvidence.length > 0,
    panelComplete,
    warnings,
  };
}

// ── Inline (no-DB) Panel Builder ─────────────────────────────────────────────
// For building panels from static data (e.g. GMI source rows) without DB writes.

export function buildInlineFalsificationPanel(
  entries: Array<{
    claim: string;
    confidence: FalsificationConfidenceLevel;
    whatWouldChangeThisView: string;
    observableIndicator: string;
    evidenceCurrentlyMissing?: string | null;
    strongestCounterargument?: string | null;
  }>,
): { panelComplete: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const highMedium = entries.filter(
    (e) => e.confidence === "HIGH" || e.confidence === "MEDIUM",
  );
  const covered = highMedium.filter((e) => e.whatWouldChangeThisView?.trim());
  const pending = entries.filter((e) => e.evidenceCurrentlyMissing?.trim());

  if (pending.length > 0) {
    warnings.push(
      `${pending.length} claim(s) have pending evidence. Do not present as settled.`,
    );
  }
  if (highMedium.length > covered.length) {
    warnings.push(
      `${highMedium.length - covered.length} HIGH/MEDIUM claim(s) lack falsification conditions.`,
    );
  }

  return {
    panelComplete:
      entries.length > 0 &&
      highMedium.length > 0 &&
      covered.length === highMedium.length &&
      pending.length === 0,
    warnings,
  };
}

// ── Parser ───────────────────────────────────────────────────────────────────

function parseFalsificationRecord(record: Record<string, unknown>): FalsificationEntry {
  return {
    id: record.id as string,
    productCode: record.productCode as string,
    artifactId: (record.artifactId as string | null) ?? null,
    sourceEntityType: (record.sourceEntityType as string | null) ?? null,
    sourceEntityId: (record.sourceEntityId as string | null) ?? null,
    claimOrRecommendation: record.claimOrRecommendation as string,
    confidenceLevel: record.confidenceLevel as FalsificationConfidenceLevel,
    whatWouldChangeThisView: record.whatWouldChangeThisView as string,
    observableIndicator: record.observableIndicator as string,
    threshold: (record.threshold as string | null) ?? null,
    reviewDate: (record.reviewDate as Date | null) ?? null,
    evidenceCurrentlyMissing: (record.evidenceCurrentlyMissing as string | null) ?? null,
    strongestCounterargument: (record.strongestCounterargument as string | null) ?? null,
    responseToCounterargument: (record.responseToCounterargument as string | null) ?? null,
    status: record.status as FalsificationStatus,
    overturnedAt: (record.overturnedAt as Date | null) ?? null,
    confirmedAt: (record.confirmedAt as Date | null) ?? null,
    createdAt: record.createdAt as Date,
    updatedAt: record.updatedAt as Date,
  };
}
