/**
 * OGR SOVEREIGN FLOW — LEGACY/EXPERIMENTAL
 * Not part of canonical Intelligence Foundry.
 * Do not import from Foundry modules.
 */
/* app/api/sovereign/report/route.ts — SOVEREIGN API PROTOCOL (HARDENED + AUTH-GATED) */

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  calculateDerived,
  sanitizeMetrics,
  type OGRMetrics,
} from "@/lib/ogr/manifest-engine";
import { hasValidOgrSession } from "@/lib/ogr/server-auth";
import { OGR_CLIENT_CONFIG } from "@/lib/ogr/client-config";

type IncomingMetrics = {
  resonanceScore?: unknown;
  marketFriction?: unknown;
  targetRevenue?: unknown;
};

type IncomingBody = {
  metrics?: IncomingMetrics;
  timestamp?: unknown;
  selectedBriefs?: unknown;
};

/* -------------------------------------------------------------------------- */
/* SERVER-SIDE UTILITIES                                                      */
/* -------------------------------------------------------------------------- */

function sanitizeTimestamp(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function sanitizeBriefSelection(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .slice(0, OGR_CLIENT_CONFIG.registry.maxSelectedBriefsForReport);
}

function generateReportId(): string {
  return `OGR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

/* -------------------------------------------------------------------------- */
/* CORE POST HANDLER                                                          */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    /* ---------------------------------------------------------------------- */
    /* 0. AUTHORIZATION GATE                                                  */
    /* ---------------------------------------------------------------------- */
    const authorized = await hasValidOgrSession();

    if (!authorized) {
      return NextResponse.json(
        { status: "ERROR", error: "UNAUTHORIZED_ACCESS_BLOCK", code: 401 },
        { status: 401 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* 1. SERVER CONFIG VALIDATION                                            */
    /* ---------------------------------------------------------------------- */
    const serverKey = process.env.OGR_SOVEREIGN_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { status: "ERROR", error: "SOVEREIGN_KEY_NOT_CONFIGURED", code: 500 },
        { status: 500 }
      );
    }

    const body = (await request.json()) as IncomingBody;

    /* ---------------------------------------------------------------------- */
    /* 2. CANONICAL RECOMPUTATION                                             */
    /* ---------------------------------------------------------------------- */
    // Trust boundary: incoming `body.metrics` fields are typed `unknown`
    // because we cannot trust the wire format. `sanitizeMetrics` internally
    // uses `toFiniteNumber()` to coerce each field, so the runtime is safe;
    // the cast is purely a type assertion at the trust transition. Same
    // defensive-boundary class as the billing webhook productCode guard (A6).
    const metrics = sanitizeMetrics(
      (body?.metrics ?? {}) as Partial<OGRMetrics>,
    );
    const derived = calculateDerived(metrics);

    const timestamp = sanitizeTimestamp(body?.timestamp);
    const selectedBriefs = sanitizeBriefSelection(body?.selectedBriefs);

    /* ---------------------------------------------------------------------- */
    /* 3. AUDIT RECORD GENERATION                                             */
    /* ---------------------------------------------------------------------- */
    const auditRecord = {
      reportId: generateReportId(),
      timestamp,
      metrics,
      derived,
      selectedBriefs,
      committedAt: new Date().toISOString(),
      protocolVersion: OGR_CLIENT_CONFIG.protocolVersion,
    };

    /* ---------------------------------------------------------------------- */
    /* 4. INSTITUTIONAL LOGGING                                               */
    /* ---------------------------------------------------------------------- */
    console.log(
      `[SOVEREIGN_AUDIT] Generated ${auditRecord.reportId} | C_sov: ${derived.sovereignCertainty}`
    );
    console.log(JSON.stringify(auditRecord));

    /* ---------------------------------------------------------------------- */
    /* 5. HARDENED RESPONSE                                                   */
    /* ---------------------------------------------------------------------- */
    return NextResponse.json({
      status: "SUCCESS",
      reportId: auditRecord.reportId,
      verified: {
        ...metrics,
        ...derived,
      },
      message: "Snapshot committed to Portfolio Brief.",
    });
  } catch (error) {
    console.error("[SOVEREIGN_REPORT_FAILURE]", error);
    return NextResponse.json(
      { status: "ERROR", error: "INTERNAL_CORE_FAILURE", code: 500 },
      { status: 500 }
    );
  }
}