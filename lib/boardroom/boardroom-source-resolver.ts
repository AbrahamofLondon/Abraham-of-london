/**
 * lib/boardroom/boardroom-source-resolver.ts
 *
 * Resolves the provenance source for a Boardroom Dossier.
 *
 * A dossier can originate from one of four source types:
 *   EXECUTIVE_REPORT      — an ExecutiveReportingRun record
 *   DIAGNOSTIC_RUN        — a DiagnosticJourney record
 *   ER_BOARDROOM_BRIDGE_RUN — a ResearchRun from the ER→Boardroom bridge engine
 *   MANUAL_SYNTHETIC_SAMPLE — no source record; always watermarked
 *
 * Sample dossiers are watermarked SAMPLE / INTERNAL ONLY and must never
 * be presented as real client deliverables.
 *
 * This resolver does NOT modify any records. It is read-only.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DossierSourceType =
  | "EXECUTIVE_REPORT"
  | "DIAGNOSTIC_RUN"
  | "ER_BOARDROOM_BRIDGE_RUN"
  | "MANUAL_SYNTHETIC_SAMPLE";

/** Structured provenance data returned after resolution. */
export type DossierSourceRecord =
  | { type: "EXECUTIVE_REPORT"; id: string; summary: ExecutiveReportSummary; isSample: false }
  | { type: "DIAGNOSTIC_RUN"; id: string; summary: DiagnosticRunSummary; isSample: false }
  | { type: "ER_BOARDROOM_BRIDGE_RUN"; id: string; summary: BridgeRunSummary; isSample: false }
  | { type: "MANUAL_SYNTHETIC_SAMPLE"; id: null; summary: SampleSummary; isSample: true };

export type ResolutionResult =
  | { ok: true; source: DossierSourceRecord }
  | { ok: false; reason: string };

// ─── Summary shapes ───────────────────────────────────────────────────────────

export type ExecutiveReportSummary = {
  runKey: string;
  email: string;
  fullName: string | null;
  organisation: string | null;
  role: string | null;
  sector: string | null;
  readinessTier: string | null;
  authorityType: string | null;
  createdAt: string;
  /** Watermark — always false for real records */
  isSample: false;
};

export type DiagnosticRunSummary = {
  journeyKey: string;
  email: string | null;
  organisation: string | null;
  diagnosticType: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  isSample: false;
};

export type BridgeRunSummary = {
  slug: string;
  module: string;
  severity: string;
  status: string;
  recommendation: string | null;
  createdAt: string;
  isSample: false;
};

export type SampleSummary = {
  watermark: "SAMPLE — INTERNAL ONLY. NOT FOR CLIENT DELIVERY.";
  note: string;
  isSample: true;
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

export const BoardroomSourceResolver = {

  /**
   * Resolve the provenance source for a dossier's sourceType + sourceId.
   *
   * Returns structured summary data. The raw DB record is not returned —
   * only the fields relevant to provenance display and delivery gating.
   */
  async resolve(
    sourceType: DossierSourceType,
    sourceId: string | null | undefined,
  ): Promise<ResolutionResult> {
    switch (sourceType) {
      case "EXECUTIVE_REPORT":
        return resolveExecutiveReport(sourceId);

      case "DIAGNOSTIC_RUN":
        return resolveDiagnosticRun(sourceId);

      case "ER_BOARDROOM_BRIDGE_RUN":
        return resolveBridgeRun(sourceId);

      case "MANUAL_SYNTHETIC_SAMPLE":
        return {
          ok: true,
          source: {
            type: "MANUAL_SYNTHETIC_SAMPLE",
            id: null,
            isSample: true,
            summary: {
              watermark: "SAMPLE — INTERNAL ONLY. NOT FOR CLIENT DELIVERY.",
              note: "This dossier was generated from synthetic data. It must not be delivered to a real client without re-generation from a verified source record.",
              isSample: true,
            },
          },
        };

      default:
        return { ok: false, reason: `Unknown sourceType: ${String(sourceType)}` };
    }
  },

  /**
   * Returns true if a dossier with the given source type is safe for client delivery.
   * MANUAL_SYNTHETIC_SAMPLE is never safe for real delivery.
   */
  isDeliverable(sourceType: DossierSourceType): boolean {
    return sourceType !== "MANUAL_SYNTHETIC_SAMPLE";
  },

  /**
   * Returns the watermark text for a dossier source type.
   * Returns null for non-sample sources (no watermark needed).
   */
  getWatermark(sourceType: DossierSourceType): string | null {
    if (sourceType === "MANUAL_SYNTHETIC_SAMPLE") {
      return "SAMPLE — INTERNAL ONLY. NOT FOR CLIENT DELIVERY.";
    }
    return null;
  },
};

// ─── Internal resolvers ───────────────────────────────────────────────────────

async function resolveExecutiveReport(sourceId: string | null | undefined): Promise<ResolutionResult> {
  if (!sourceId) {
    return { ok: false, reason: "sourceId required for EXECUTIVE_REPORT source type" };
  }

  const run = await prisma.executiveReportingRun.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      runKey: true,
      email: true,
      fullName: true,
      organisation: true,
      role: true,
      sector: true,
      readinessTier: true,
      authorityType: true,
      createdAt: true,
    },
  });

  if (!run) {
    return { ok: false, reason: `ExecutiveReportingRun "${sourceId}" not found` };
  }

  return {
    ok: true,
    source: {
      type: "EXECUTIVE_REPORT",
      id: run.id,
      isSample: false,
      summary: {
        runKey: run.runKey,
        email: run.email,
        fullName: run.fullName,
        organisation: run.organisation,
        role: run.role,
        sector: run.sector,
        readinessTier: run.readinessTier,
        authorityType: run.authorityType,
        createdAt: run.createdAt.toISOString(),
        isSample: false,
      },
    },
  };
}

async function resolveDiagnosticRun(sourceId: string | null | undefined): Promise<ResolutionResult> {
  if (!sourceId) {
    return { ok: false, reason: "sourceId required for DIAGNOSTIC_RUN source type" };
  }

  const journey = await prisma.diagnosticJourney.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      journeyKey: true,
      email: true,
      organisation: true,
      diagnosticType: true,
      status: true,
      completedAt: true,
      createdAt: true,
    },
  });

  if (!journey) {
    return { ok: false, reason: `DiagnosticJourney "${sourceId}" not found` };
  }

  return {
    ok: true,
    source: {
      type: "DIAGNOSTIC_RUN",
      id: journey.id,
      isSample: false,
      summary: {
        journeyKey: journey.journeyKey,
        email: journey.email,
        organisation: journey.organisation,
        diagnosticType: journey.diagnosticType,
        status: journey.status,
        completedAt: journey.completedAt?.toISOString() ?? null,
        createdAt: journey.createdAt.toISOString(),
        isSample: false,
      },
    },
  };
}

async function resolveBridgeRun(sourceId: string | null | undefined): Promise<ResolutionResult> {
  if (!sourceId) {
    return { ok: false, reason: "sourceId required for ER_BOARDROOM_BRIDGE_RUN source type" };
  }

  const run = await prisma.researchRun.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      slug: true,
      module: true,
      severity: true,
      status: true,
      recommendation: true,
      createdAt: true,
    },
  });

  if (!run) {
    return { ok: false, reason: `ResearchRun "${sourceId}" not found` };
  }

  return {
    ok: true,
    source: {
      type: "ER_BOARDROOM_BRIDGE_RUN",
      id: run.id,
      isSample: false,
      summary: {
        slug: run.slug,
        module: run.module,
        severity: run.severity,
        status: run.status,
        recommendation: run.recommendation,
        createdAt: run.createdAt.toISOString(),
        isSample: false,
      },
    },
  };
}
