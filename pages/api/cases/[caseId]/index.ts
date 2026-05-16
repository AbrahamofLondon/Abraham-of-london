/**
 * pages/api/cases/[caseId]/index.ts
 *
 * DELETE /api/cases/:caseId
 *
 * Authenticated. Soft-deletes a governed case owned by the authenticated user.
 *
 * Soft delete model:
 * - Sets status to "deletion_pending" immediately
 * - Records deletionRequestedAt and deleteAfter (+30 days) in routeDecisions
 * - Case remains in storage for 30 days (GDPR right to erasure period)
 * - After 30 days, a scheduled cleanup process performs hard deletion
 * - User can cancel deletion within 30 days via PATCH (not implemented here)
 *
 * What is deleted:
 * - DiagnosticJourney status set to "deletion_pending"
 * - email field nulled immediately (identity separation)
 * - Outcome contribution retracted if present (anonymised pool updated)
 * - AuditEvent created for compliance record
 *
 * What is NOT deleted at this step:
 * - Decision objects, evidence nodes, stages — retained for 30 days
 * - AuditEvents for this case — retained (required for compliance)
 * - Any anonymised benchmark contributions (already stripped of PII)
 *
 * Response: DeletionRequestResponse
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type DeletionRequestResponse = {
  ok: true;
  caseId: string;
  status: "deletion_pending";
  deleteAfter: string;
  message: string;
};

type ErrorResponse = { error: string };

const HARD_DELETE_DAYS = 30;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeletionRequestResponse | ErrorResponse>,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { caseId } = req.query;
  if (typeof caseId !== "string" || !caseId) {
    return res.status(400).json({ error: "caseId path parameter is required" });
  }

  try {
    // Verify ownership
    const journey = await prisma.diagnosticJourney.findFirst({
      where: { journeyKey: caseId, email: identity.email },
      select: {
        id: true,
        journeyKey: true,
        status: true,
        routeDecisions: true,
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    if (journey.status === "deletion_pending" || journey.status === "deleted") {
      return res.status(409).json({ error: "Case is already scheduled for deletion" });
    }

    const now = new Date();
    const deleteAfter = new Date(now.getTime() + HARD_DELETE_DAYS * 24 * 60 * 60 * 1000);
    const deletionRequestedAt = now.toISOString();
    const deleteAfterIso = deleteAfter.toISOString();

    const existing =
      journey.routeDecisions !== null &&
      typeof journey.routeDecisions === "object" &&
      !Array.isArray(journey.routeDecisions)
        ? (journey.routeDecisions as Record<string, unknown>)
        : {};

    // Check if there's an active outcome contribution — retract it
    const hasOutcomeContribution =
      existing.outcomeContributed === true &&
      typeof existing.outcomeContributionId === "string";

    if (hasOutcomeContribution && typeof existing.outcomeContributionId === "string") {
      // Mark the AuditEvent contribution as retracted (privacy: user is deleting their case)
      const existingEvent = await prisma.auditEvent.findFirst({
        where: {
          objectType: "OUTCOME_CONTRIBUTION",
          objectId: existing.outcomeContributionId,
          actionType: "CONTRIBUTED",
        },
        select: { id: true, metadata: true },
      });

      if (existingEvent) {
        const existingMeta =
          existingEvent.metadata !== null &&
          typeof existingEvent.metadata === "object" &&
          !Array.isArray(existingEvent.metadata)
            ? (existingEvent.metadata as Record<string, unknown>)
            : {};

        await prisma.auditEvent.update({
          where: { id: existingEvent.id },
          data: {
            metadata: {
              ...existingMeta,
              retracted: true,
              retractedAt: deletionRequestedAt,
              retractedReason: "case_deletion_request",
            } as Prisma.InputJsonValue,
          },
        });
      }
    }

    // Soft delete: set status, null the email, record deletion metadata
    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: {
        status: "deletion_pending",
        email: null, // Identity separation — immediate
        routeDecisions: {
          ...existing,
          deletionRequestedAt,
          deleteAfter: deleteAfterIso,
          outcomeContributed: false,
          outcomeContributionRetracted: hasOutcomeContribution ? true : existing.outcomeContributionRetracted,
        } as Prisma.InputJsonValue,
      },
    });

    // Audit record for compliance
    await prisma.auditEvent.create({
      data: {
        actorType: "USER",
        actorId: null, // Anonymised — not stored
        objectType: "DIAGNOSTIC_JOURNEY",
        objectId: journey.id,
        actionType: "DELETION_REQUESTED",
        summary: `Case deletion requested. Hard delete scheduled after ${HARD_DELETE_DAYS} days.`,
        metadata: {
          deleteAfter: deleteAfterIso,
          caseId,
        } as Prisma.InputJsonValue,
      },
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      caseId,
      status: "deletion_pending",
      deleteAfter: deleteAfterIso,
      message: `Your case has been scheduled for deletion. All case data will be permanently removed after ${HARD_DELETE_DAYS} days. Your identity has been separated from the case record immediately. If you have made any outcome contributions from this case, they have been retracted from the benchmark pool.`,
    });
  } catch (err) {
    console.error("[cases/[caseId] DELETE]", err);
    return res.status(500).json({ error: "Failed to process deletion request" });
  }
}

export const config = {
  api: { bodyParser: false },
};
