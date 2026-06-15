/**
 * lib/living-intelligence/living-state-report-loader.ts
 *
 * Safe server-side loader for the living-state report files.
 *
 * Reads the committed JSON reports and returns typed projections for the
 * operator surface. This keeps the page thin and testable, and ensures the
 * page never touches the engine directly — it only reads what the runner wrote.
 *
 * The loader returns null for any report that cannot be read, so the page
 * degrades gracefully if the runner has not yet been executed.
 */

import fs from "node:fs";
import path from "node:path";

import type { LivingStateViewModel } from "@/lib/living-intelligence/living-state-view-model";
import type { LivingStateObjectsPayload } from "@/lib/living-intelligence/living-state-report-composer";
import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivingStateReportSnapshot = {
  /** Whether all reports were loaded successfully. */
  loaded: boolean;
  /** ISO timestamp of when the reports were generated. */
  generatedAt: string | null;
  /** Engine version that produced the reports. */
  engineVersion: string | null;
  /** Estate-level rollup. */
  estate: {
    totalObjects: number;
    blocked: number;
    warnings: number;
    governedTensions: number;
    safeToShowUser: number;
    safeToShowOperator: number;
  } | null;
  /** Per-domain rollups. */
  byDomain: Record<string, {
    total: number;
    blocked: number;
    awaitingVerification: number;
    awaitingConsent: number;
    artifactIncomplete: number;
    missingRepairRoute: number;
    readyForReview: number;
  }> | null;
  /** All evaluated objects (full detail for operator surface). */
  objects: LivingStateObject[];
  /** Commercial-domain objects only. */
  commercialObjects: LivingStateObject[];
  /** Fulfilment-domain objects only. */
  fulfilmentObjects: LivingStateObject[];
  /** Objects with blockers. */
  blockedObjects: LivingStateObject[];
  /** Objects with missing repair routes. */
  objectsWithMissingRepairRoutes: LivingStateObject[];
  /** Objects that are not safe to automate. */
  unsafeAutomationObjects: LivingStateObject[];
  /** Objects with incomplete artefacts. */
  artifactIncompleteObjects: LivingStateObject[];
  /** Operator-facing projections. */
  operatorFacing: Array<{
    objectId: string;
    title: string;
    summary: string;
    blockers: string[];
    nextActions: string[];
    repairRoutes: string[];
    missingRoutes: string[];
  }>;
  /** Things the engine refused to infer. */
  refusedToInfer: string[];
  /** Memory summary. */
  memory: {
    newIssues: number;
    repeatedIssues: number;
    resolvedIssues: number;
    regressions: number;
    rememberedObjects: number;
  } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

function readJson<T>(relPath: string): T | null {
  try {
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) return null;
    return JSON.parse(fs.readFileSync(abs, "utf8")) as T;
  } catch {
    return null;
  }
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export function loadLivingStateReports(): LivingStateReportSnapshot {
  const viewModel = readJson<LivingStateViewModel>("reports/living-state-view-model.json");
  const objectsPayload = readJson<LivingStateObjectsPayload>("reports/living-state-objects.json");

  const objects = objectsPayload?.objects ?? viewModel?.objects ?? [];

  const commercialObjects = objects.filter((o) => o.domain === "commercial");
  const fulfilmentObjects = objects.filter((o) => o.domain === "fulfilment");

  const blockedObjects = objects.filter((o) =>
    o.blockers.some((b) => b.severity === "blocker"),
  );

  const objectsWithMissingRepairRoutes = objects.filter((o) =>
    o.blockers.some(
      (b) => b.code === "missing_repair_path" || b.code === "route_missing",
    ),
  );

  const unsafeAutomationObjects = objects.filter((o) => !o.safeToAutomate);

  const artifactIncompleteObjects = objects.filter(
    (o) =>
      o.artifact.status === "missing" ||
      o.artifact.status === "stub_only" ||
      o.artifact.status === "incomplete",
  );

  const loaded = viewModel !== null || objectsPayload !== null;

  return {
    loaded,
    generatedAt: viewModel?.generatedAt ?? objectsPayload?.generatedAt ?? null,
    engineVersion: viewModel?.engineVersion ?? objectsPayload?.engineVersion ?? null,
    estate: viewModel?.estate ?? null,
    byDomain: viewModel?.byDomain ?? null,
    objects,
    commercialObjects,
    fulfilmentObjects,
    blockedObjects,
    objectsWithMissingRepairRoutes,
    unsafeAutomationObjects,
    artifactIncompleteObjects,
    operatorFacing: viewModel?.operatorFacing ?? [],
    refusedToInfer: viewModel?.refusedToInfer ?? [],
    memory: viewModel?.memory ?? null,
  };
}
