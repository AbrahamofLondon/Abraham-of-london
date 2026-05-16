/**
 * pages/api/report/[reportId].ts
 *
 * GET /api/report/[reportId]
 *
 * Authenticated. Fetches a live executive report view for the given
 * report ID (= journeyKey of a diagnostic-type journey).
 *
 * Returns a client-safe report summary. No raw evidence text, no
 * respondent identifiers, no operator notes, no suppression details.
 *
 * The report is "live" in the sense that it reflects the current state
 * of the governed case record at time of fetch, not a frozen snapshot.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";

// ─── Response types ───────────────────────────────────────────────────────────

export type LiveReportStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "INSUFFICIENT_EVIDENCE"
  | "UNKNOWN";

export type LiveReportEvidence = {
  kind: "DECISION" | "CONDITION" | "COMMITMENT";
  label: string;
  confidence: number;
};

export type LiveReportResult = {
  reportId: string;
  diagnosticType: string;
  status: LiveReportStatus;
  generatedAt: string;
  /** Number of days since case was created */
  daysOpen: number;
  /** Organisation or subject context, if available */
  organisation: string | null;
  /** Primary decision under governance */
  primaryDecision: string | null;
  /** Constraint on the decision */
  primaryConstraint: string | null;
  /** Cost-of-delay framing */
  costOfDelay: string | null;
  /** Key evidence items (decision objects) */
  evidence: LiveReportEvidence[];
  /** Current case status */
  caseStatus: string;
  /** Recommended next action */
  nextAction: string;
  /** Decision Centre case URL */
  decisionCentreHref: string;
  /** Boundary note — always included */
  boundaryNote: string;
};

export type LiveReportApiResponse = {
  ok: true;
  report: LiveReportResult;
};

type ErrorResponse = { error: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const BOUNDARY_NOTE =
  "This is a client-safe view of the governed case record. It does not expose respondent text, operator notes, raw evidence, suppression details, or internal system mechanics. The full governed record remains in the Decision Centre.";

const NEXT_ACTION_BY_STATUS: Record<LiveReportStatus, string> = {
  ACTIVE: "The case is active. The next required move is to run the next assessment or open the case in Decision Centre.",
  COMPLETED: "The governed record is marked complete. A Return Brief is available if the condition has not been fully resolved.",
  INSUFFICIENT_EVIDENCE: "The record does not yet contain enough evidence to produce a full report. Run the Fast Diagnostic to begin building the governed record.",
  UNKNOWN: "The case status is unclear. Open the case in Decision Centre to review.",
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveReportApiResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { reportId } = req.query;
  if (typeof reportId !== "string" || !reportId) {
    return res.status(400).json({ error: "reportId is required" });
  }

  try {
    // Verify ownership and fetch case data
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        journeyKey: reportId,
        email: identity.email,
      },
      select: {
        journeyKey: true,
        diagnosticType: true,
        organisation: true,
        status: true,
        createdAt: true,
        completedAt: true,
        decisionObjects: {
          select: {
            decisionText: true,
            constraintText: true,
            costOfDelayText: true,
            confidence: true,
          },
          orderBy: { confidence: "desc" },
          take: 5,
        },
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Report not found or access denied" });
    }

    const generatedAt = new Date();
    const daysOpen = Math.floor(
      (generatedAt.getTime() - journey.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const primaryDecision = journey.decisionObjects[0] ?? null;
    const hasEvidence = journey.decisionObjects.length > 0;

    const caseStatus = journey.completedAt ? "completed" : (journey.status ?? "active");
    const reportStatus: LiveReportStatus = journey.completedAt
      ? "COMPLETED"
      : hasEvidence
        ? "ACTIVE"
        : "INSUFFICIENT_EVIDENCE";

    const evidence: LiveReportEvidence[] = journey.decisionObjects.map((obj) => ({
      kind: "DECISION",
      label: obj.decisionText,
      confidence: obj.confidence,
    }));

    const report: LiveReportResult = {
      reportId: journey.journeyKey,
      diagnosticType: journey.diagnosticType,
      status: reportStatus,
      generatedAt: generatedAt.toISOString(),
      daysOpen,
      organisation: journey.organisation ?? null,
      primaryDecision: primaryDecision?.decisionText ?? null,
      primaryConstraint: primaryDecision?.constraintText ?? null,
      costOfDelay: primaryDecision?.costOfDelayText ?? null,
      evidence,
      caseStatus,
      nextAction: NEXT_ACTION_BY_STATUS[reportStatus],
      decisionCentreHref: `/decision-centre/case/${journey.journeyKey}`,
      boundaryNote: BOUNDARY_NOTE,
    };

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, report });
  } catch (err) {
    console.error("[api/report/[reportId]]", err);
    return res.status(500).json({ error: "Failed to load report" });
  }
}

export const config = {
  api: { bodyParser: false },
};
