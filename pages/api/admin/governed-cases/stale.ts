/**
 * pages/api/admin/governed-cases/stale.ts
 *
 * GET /api/admin/governed-cases/stale
 *
 * Operator/admin endpoint. Authenticated user must hold the ADMIN role.
 * Returns all active DiagnosticJourney records that have not been
 * updated within the WATCH threshold (≥ 30 days), classified by
 * staleness band (WATCH / ALERT / CRITICAL).
 *
 * Query params:
 *   band   — optional: "WATCH" | "ALERT" | "CRITICAL" (filter to one band)
 *   limit  — optional: number (max 500, default 100)
 *
 * Response shape: StaleCasesApiResponse
 *
 * Safe fields only. No evidence text, suppression details, or internal
 * notes are returned. Email is included for operator use only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import {
  detectStaleCases,
  staleCaseSummary,
  STALE_THRESHOLDS_DAYS,
  type StaleCaseResult,
  type StalenessBand,
} from "@/lib/product/stale-governed-case-detector";
import { deriveOversightOperatorRole } from "@/lib/product/operator-role-access";

// ─── Response types ───────────────────────────────────────────────────────────

export type StaleCasesApiResponse = {
  ok: true;
  generatedAt: string;
  summary: {
    total: number;
    watch: number;
    alert: number;
    critical: number;
  };
  cases: (StaleCaseResult & { email?: string | null })[];
};

type ErrorResponse = { error: string };

// ─── Band guard ───────────────────────────────────────────────────────────────

const VALID_BANDS: StalenessBand[] = ["WATCH", "ALERT", "CRITICAL"];

function isValidBand(b: unknown): b is StalenessBand {
  return typeof b === "string" && (VALID_BANDS as string[]).includes(b);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaleCasesApiResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authentication required
  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Operator role required (any oversight role qualifies for this read endpoint)
  const role = deriveOversightOperatorRole(identity.email);
  if (!role) {
    return res.status(403).json({ error: "Operator role required" });
  }

  // Parse query params
  const rawBand = req.query.band;
  const bandFilter: StalenessBand | null = isValidBand(rawBand) ? rawBand : null;

  const rawLimit = parseInt(String(req.query.limit ?? "100"), 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100;

  const generatedAt = new Date();

  // The staleness threshold for the DB query is always the minimum (WATCH = 30 days)
  // so we fetch all potentially stale cases and let the detector classify them.
  const thresholdDate = new Date(
    generatedAt.getTime() - STALE_THRESHOLDS_DAYS.WATCH * 24 * 60 * 60 * 1000,
  );

  try {
    const rawCases = await prisma.diagnosticJourney.findMany({
      where: {
        status: "active",
        updatedAt: { lte: thresholdDate },
      },
      select: {
        journeyKey: true,
        email: true,
        status: true,
        updatedAt: true,
        routeDecisions: true,
      },
      orderBy: { updatedAt: "asc" }, // most stale first
      take: limit * 2, // over-fetch to account for filtering
    });

    // Map to detector input shape. Return brief / counsel status requires
    // a join we avoid here for performance — pass defaults and let the
    // detector build conservative actions.
    const detectorInput = rawCases.map((c) => ({
      caseId: c.journeyKey,
      title: c.journeyKey, // journeyKey used as fallback title for admin view
      lastActivityAt: c.updatedAt,
      status: c.status,
      returnBriefTriggered: false,
      counselWarranted: false,
    }));

    const allStale = detectStaleCases(detectorInput, generatedAt);

    // Apply optional band filter
    const filtered = bandFilter
      ? allStale.filter((c) => c.band === bandFilter)
      : allStale;

    // Attach email for admin view (safe — this is an admin-only endpoint)
    const emailByKey = new Map(rawCases.map((c) => [c.journeyKey, c.email]));
    const withEmail = filtered.slice(0, limit).map((c) => ({
      ...c,
      email: emailByKey.get(c.caseId) ?? null,
    }));

    const summary = staleCaseSummary(allStale);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      generatedAt: generatedAt.toISOString(),
      summary,
      cases: withEmail,
    });
  } catch (err) {
    console.error("[governed-cases/stale]", err);
    return res.status(500).json({ error: "Failed to load stale case data" });
  }
}

export const config = {
  api: { bodyParser: false },
};
