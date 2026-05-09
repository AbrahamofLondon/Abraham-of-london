/**
 * lib/product/counsel-case-service.ts
 *
 * Counsel case lifecycle service.
 * Turns counsel requests into governed, trackable cases.
 */

import { prisma } from "@/lib/prisma.server";
import type {
  CounselCase,
  CounselCaseStatus,
  CounselEvidencePackage,
  CounselIntakePayload,
} from "@/lib/product/counsel-room-contract";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createCounselCaseFromIntake(input: {
  userId: string;
  email: string;
  intake: CounselIntakePayload;
  evidencePackage: CounselEvidencePackage;
}): Promise<CounselCase | null> {
  try {
    const record = await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "counsel_case",
        userEmail: input.email.toLowerCase(),
        userId: input.userId,
        status: "draft",
        score: 0,
        severity: (input.intake.urgency === "CRITICAL" ? "critical"
          : input.intake.urgency === "BOARD_OR_LEGAL_EXPOSURE" ? "high"
          : input.intake.urgency === "TIME_SENSITIVE" ? "moderate"
          : "low") as "low" | "moderate" | "high" | "critical",
        verdict: input.intake.userSummary.slice(0, 200),
        responsesJson: JSON.stringify({
          caseId: `csl_${Date.now().toString(36)}`,
          intake: input.intake,
          evidencePackage: input.evidencePackage,
          status: "REQUESTED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return mapRecordToCounselCase(record);
  } catch (error) {
    console.error("[counsel-case-service] create failed:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadCounselCaseForUser(input: {
  email?: string;
  userId?: string;
}): Promise<CounselCase | null> {
  if (!input.email && !input.userId) return null;

  try {
    const record = await prisma.diagnosticRecord.findFirst({
      where: {
        diagnosticType: "counsel_case",
        ...(input.email ? { userEmail: input.email.toLowerCase() } : {}),
        ...(input.userId ? { userId: input.userId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return record ? mapRecordToCounselCase(record) : null;
  } catch {
    return null;
  }
}

export async function loadOpenCounselCasesForOperator(): Promise<CounselCase[]> {
  try {
    const records = await prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "counsel_case",
        status: { not: "completed" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return records.map(mapRecordToCounselCase).filter(Boolean) as CounselCase[];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCounselCaseStatus(input: {
  recordId: string;
  status: CounselCaseStatus;
  operatorNotes?: string;
  counselResponse?: string;
}): Promise<boolean> {
  try {
    const record = await prisma.diagnosticRecord.findUnique({
      where: { id: input.recordId },
    });

    if (!record) return false;

    const existing = JSON.parse(record.responsesJson || "{}");

    await prisma.diagnosticRecord.update({
      where: { id: record.id },
      data: {
        status: input.status === "CLOSED" ? "completed" : "draft",
        responsesJson: JSON.stringify({
          ...existing,
          status: input.status,
          operatorNotes: input.operatorNotes ?? existing.operatorNotes,
          counselResponse: input.counselResponse ?? existing.counselResponse,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function mapRecordToCounselCase(record: any): CounselCase | null {
  try {
    const data = JSON.parse(record.responsesJson || "{}");
    return {
      id: data.caseId ?? record.id,
      userId: record.userId ?? "",
      email: record.userEmail ?? "",
      status: data.status ?? "REQUESTED",
      escalationTrigger: data.intake?.escalationTrigger ?? data.evidencePackage?.triggers ?? [],
      evidencePackage: data.evidencePackage ?? {
        userId: record.userId ?? "",
        completedStages: [],
        activeContradictions: [],
        escalationLevel: 0,
        triggers: [],
        overdueCheckpointCount: 0,
        blockedCheckpointCount: 0,
        evidencePosture: "USER_REPORTED",
        suppressionReasons: [],
      },
      userSummary: data.intake?.userSummary ?? record.verdict ?? "",
      whatChangedSinceSystemAssessment: data.intake?.whatChangedSinceSystemAssessment,
      whatHumanCounselMustConsider: data.intake?.whatHumanCounselMustConsider ?? "",
      urgency: data.intake?.urgency ?? "NORMAL",
      permissionToUseEvidencePackage: data.intake?.permissionToUseEvidencePackage ?? false,
      operatorNotes: data.operatorNotes,
      counselResponse: data.counselResponse,
      createdAt: data.createdAt ?? record.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
