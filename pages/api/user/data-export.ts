/**
 * pages/api/user/data-export.ts
 *
 * GET /api/user/data-export
 *
 * Authenticated. GDPR/CCPA data export (right of access / portability).
 *
 * Returns a structured JSON export of all client-safe data held for the
 * authenticated user. The export is scoped to data the user themselves
 * submitted — no internal system data, no other users' data, no entitlement
 * history or financial records (those require a separate request).
 *
 * What is included:
 * - Governed cases (journeys) owned by this email — title, type, status,
 *   decision objects, timestamps
 * - Evidence nodes submitted by this user
 * - Outcome contributions (anonymised pool entries attributable to user)
 * - Stage count per case
 *
 * What is NOT included:
 * - Other users' data
 * - Internal entitlement or billing records (contact us for those)
 * - AuditEvent logs (system records, not user data)
 * - AI model internals
 *
 * Response: DataExportResponse (JSON, attachment header)
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportedDecisionObject = {
  decisionText: string;
  constraintText: string | null;
  costOfDelayText: string | null;
  stakeholderText: string | null;
  affectedDomain: string | null;
  confidence: number;
  recordedAt: string;
};

type ExportedEvidenceNode = {
  kind: string;
  label: string;
  summary: string;
  confidence: number;
  severity: string;
  recordedAt: string;
};

type ExportedCase = {
  caseId: string;
  diagnosticType: string;
  status: string;
  organisation: string | null;
  stageCount: number;
  decisionObjects: ExportedDecisionObject[];
  evidenceNodes: ExportedEvidenceNode[];
  hasOutcomeContribution: boolean;
  createdAt: string;
  updatedAt: string;
};

type DataExportResponse = {
  exportedAt: string;
  exportVersion: "1.0";
  subject: { emailHash: string };
  cases: ExportedCase[];
  totalCases: number;
  boundaryNote: string;
  rightsNote: string;
};

type ErrorResponse = { error: string };

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DataExportResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Fetch all non-deleted journeys for this email
    const journeys = await prisma.diagnosticJourney.findMany({
      where: {
        email: identity.email,
        status: { notIn: ["deleted"] },
      },
      select: {
        journeyKey: true,
        diagnosticType: true,
        status: true,
        organisation: true,
        routeDecisions: true,
        createdAt: true,
        updatedAt: true,
        stages: {
          select: { id: true },
        },
        decisionObjects: {
          select: {
            decisionText: true,
            constraintText: true,
            costOfDelayText: true,
            stakeholderText: true,
            affectedDomain: true,
            confidence: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        evidenceNodes: {
          select: {
            kind: true,
            label: true,
            summary: true,
            confidence: true,
            severity: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build email hash for subject reference (no raw email in export)
    const crypto = await import("crypto");
    const emailHash = crypto.createHash("sha256").update(identity.email.toLowerCase().trim()).digest("hex");

    const cases: ExportedCase[] = journeys.map((j) => {
      const rd =
        j.routeDecisions !== null &&
        typeof j.routeDecisions === "object" &&
        !Array.isArray(j.routeDecisions)
          ? (j.routeDecisions as Record<string, unknown>)
          : {};

      return {
        caseId: j.journeyKey,
        diagnosticType: j.diagnosticType,
        status: j.status,
        organisation: j.organisation,
        stageCount: j.stages.length,
        decisionObjects: j.decisionObjects.map((d) => ({
          decisionText: d.decisionText,
          constraintText: d.constraintText,
          costOfDelayText: d.costOfDelayText,
          stakeholderText: d.stakeholderText,
          affectedDomain: d.affectedDomain,
          confidence: d.confidence,
          recordedAt: d.createdAt.toISOString(),
        })),
        evidenceNodes: j.evidenceNodes.map((e) => ({
          kind: e.kind,
          label: e.label,
          summary: e.summary,
          confidence: e.confidence,
          severity: e.severity,
          recordedAt: e.createdAt.toISOString(),
        })),
        hasOutcomeContribution: rd.outcomeContributed === true,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      };
    });

    const exportPayload: DataExportResponse = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      subject: { emailHash },
      cases,
      totalCases: cases.length,
      boundaryNote:
        "This export contains structured data submitted by you to the governed case registry. " +
        "It does not include entitlement records, billing history, internal audit logs, " +
        "or data held by third-party processors. To request a complete data disclosure " +
        "including entitlement and billing records, contact privacy@abrahamoflondon.com.",
      rightsNote:
        "Under UK GDPR and CCPA, you have the right to access, correct, and erase personal data held about you. " +
        "To request erasure of all records (beyond case-by-case deletion), " +
        "contact privacy@abrahamoflondon.com. Requests are processed within 30 days.",
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="aol-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(exportPayload);
  } catch (err) {
    console.error("[user/data-export GET]", err);
    return res.status(500).json({ error: "Failed to generate data export" });
  }
}

export const config = {
  api: { bodyParser: false },
};
