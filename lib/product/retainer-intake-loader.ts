import "server-only";

import { prisma } from "@/lib/prisma.server";
import type { RetainerIntakeResponse } from "@/lib/product/retainer-intake-contract";
import {
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
} from "@/lib/product/evidence-capture-contract";

export type RetainerIntakeContext = {
  source: "RETAINER_INTAKE";
  intakeId: string;
  capturedAt: string;
  evidencePosture: "USER_REPORTED";
  mandate?: string;
  oversightScope?: string;
  priorAttempts?: string;
  failureCause?: string;
  costExposure?: string;
  irreversibility?: string;
  authorityOwner?: string;
  stopSignal?: string;
  verificationCriteria?: string;
  failureCriteria?: string;
  refusalBoundary?: string;
  clientSafeSummary: string[];
  suppressionReasons: string[];
};

function safe(value: string | undefined | null, max = 200): string | undefined {
  if (!value?.trim()) return undefined;
  if (isUnsafeAssessmentEvidenceText(value)) return undefined;
  return summarizeAssessmentEvidenceText(value, max) || undefined;
}

function safeForOperator(value: string | undefined | null, max = 500): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().slice(0, max) || undefined;
}

function parseIntakeFromRecord(record: { id: string; responsesJson: string; createdAt: Date }): RetainerIntakeContext | null {
  try {
    const parsed = JSON.parse(record.responsesJson);
    const intake = parsed?.intake as Partial<RetainerIntakeResponse> | undefined;
    if (!intake) return null;

    const suppressionReasons: string[] = [];
    const clientSafeSummary: string[] = [];

    if (intake.oversightNeed) {
      const s = safe(intake.oversightNeed);
      if (s) clientSafeSummary.push(`Mandate: ${s}`);
      else suppressionReasons.push("Oversight mandate contained unsafe text and was suppressed.");
    }
    if (intake.verificationCriteria) {
      const s = safe(intake.verificationCriteria);
      if (s) clientSafeSummary.push(`Success criteria: ${s}`);
    }
    if (intake.failureCriteria) {
      const s = safe(intake.failureCriteria);
      if (s) clientSafeSummary.push(`Failure criteria: ${s}`);
    }
    if (intake.refusalBoundary) {
      if (isUnsafeAssessmentEvidenceText(intake.refusalBoundary)) {
        suppressionReasons.push("Refusal boundary contained unsafe text and was suppressed from client-safe output.");
      }
    }

    return {
      source: "RETAINER_INTAKE",
      intakeId: record.id,
      capturedAt: record.createdAt.toISOString(),
      evidencePosture: "USER_REPORTED",
      mandate: safeForOperator(intake.oversightNeed),
      oversightScope: safeForOperator(intake.oversightNeed),
      priorAttempts: safeForOperator(intake.priorAttempts),
      failureCause: safeForOperator(intake.failureCause),
      costExposure: safeForOperator(intake.costExposure),
      irreversibility: safeForOperator(intake.irreversibilityConcern),
      authorityOwner: safeForOperator(intake.authorityOwner),
      stopSignal: safeForOperator(intake.stopSignal),
      verificationCriteria: safeForOperator(intake.verificationCriteria),
      failureCriteria: safeForOperator(intake.failureCriteria),
      refusalBoundary: safeForOperator(intake.refusalBoundary),
      clientSafeSummary,
      suppressionReasons,
    };
  } catch {
    return null;
  }
}

export async function loadLatestRetainerIntakeForUser(email: string): Promise<RetainerIntakeContext | null> {
  try {
    const record = await prisma.diagnosticRecord.findFirst({
      where: {
        diagnosticType: "retainer_intake",
        userEmail: email.trim().toLowerCase(),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, responsesJson: true, createdAt: true },
    });
    if (!record) return null;
    return parseIntakeFromRecord(record);
  } catch {
    return null;
  }
}

export async function loadLatestRetainerIntakeForAccount(input: {
  email?: string | null;
  userId?: string | null;
}): Promise<RetainerIntakeContext | null> {
  if (input.email) return loadLatestRetainerIntakeForUser(input.email);
  if (input.userId) {
    try {
      const record = await prisma.diagnosticRecord.findFirst({
        where: {
          diagnosticType: "retainer_intake",
          userId: input.userId,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, responsesJson: true, createdAt: true },
      });
      if (!record) return null;
      return parseIntakeFromRecord(record);
    } catch {
      return null;
    }
  }
  return null;
}
