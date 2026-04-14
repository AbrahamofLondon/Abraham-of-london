import { AlignmentBand as PrismaAlignmentBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PURPOSE_ALIGNMENT_INSTRUMENT_ID,
  PURPOSE_ALIGNMENT_REPORT_VERSION,
} from "./checklist";
import type {
  AlignmentAssessmentInput,
  AlignmentAssessmentResult,
  StoredPurposeAlignmentAssessment,
} from "./types";

function toPrismaBand(
  band: AlignmentAssessmentResult["band"]
): PrismaAlignmentBand {
  switch (band) {
    case "aligned":
      return "ALIGNED";
    case "drifting":
      return "DRIFTING";
    case "misaligned":
      return "MISALIGNED";
    default:
      return "DISORDERED";
  }
}

function fromPrismaBand(
  band: PrismaAlignmentBand
): StoredPurposeAlignmentAssessment["band"] {
  switch (band) {
    case "ALIGNED":
      return "aligned";
    case "DRIFTING":
      return "drifting";
    case "MISALIGNED":
      return "misaligned";
    default:
      return "disordered";
  }
}

function mapAssessment(row: {
  id: string;
  userId: string | null;
  sessionKey: string | null;
  title: string;
  notes: string | null;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: PrismaAlignmentBand;
  weakestDomains: unknown;
  strengths: unknown;
  corrections: unknown;
  answers: unknown;
  domainScores: unknown;
  reportVersion: string;
  sourceInstrumentId: string;
  createdAt: Date;
  updatedAt: Date;
}): StoredPurposeAlignmentAssessment {
  return {
    id: row.id,
    userId: row.userId,
    sessionKey: row.sessionKey,
    title: row.title,
    notes: row.notes,
    totalScore: row.totalScore,
    possibleScore: row.possibleScore,
    percentScore: row.percentScore,
    band: fromPrismaBand(row.band),
    weakestDomains: row.weakestDomains as StoredPurposeAlignmentAssessment["weakestDomains"],
    strengths: row.strengths as string[],
    corrections: row.corrections as string[],
    answers: row.answers as Record<string, boolean>,
    domainScores: row.domainScores as StoredPurposeAlignmentAssessment["domainScores"],
    reportVersion: row.reportVersion,
    sourceInstrumentId: row.sourceInstrumentId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createPurposeAlignmentAssessment(params: {
  userId?: string | null;
  sessionKey?: string | null;
  input: AlignmentAssessmentInput;
  result: AlignmentAssessmentResult;
}): Promise<string> {
  const created = await prisma.purposeAlignmentAssessment.create({
    data: {
      userId: params.userId ?? null,
      sessionKey: params.sessionKey ?? null,
      notes: params.input.notes || null,
      totalScore: params.result.totalScore,
      possibleScore: params.result.possibleScore,
      percentScore: params.result.percent,
      band: toPrismaBand(params.result.band),
      weakestDomains: JSON.stringify(params.result.weakestDomains),
      strengths: JSON.stringify(params.result.strengths),
      corrections: JSON.stringify(params.result.corrections),
      answers: JSON.stringify(params.input.answers),
      domainScores: JSON.stringify(params.result.domainScores),
      reportVersion: PURPOSE_ALIGNMENT_REPORT_VERSION,
      sourceInstrumentId: PURPOSE_ALIGNMENT_INSTRUMENT_ID,
    },
  });

  return created.id;
}

export async function getPurposeAlignmentAssessmentById(
  id: string
): Promise<StoredPurposeAlignmentAssessment | null> {
  const row = await prisma.purposeAlignmentAssessment.findUnique({
    where: { id },
  });

  return row ? mapAssessment(row) : null;
}

export async function getLatestPurposeAlignmentAssessment(params: {
  userId?: string | null;
  sessionKey?: string | null;
}): Promise<StoredPurposeAlignmentAssessment | null> {
  const where = params.userId
    ? { userId: params.userId }
    : params.sessionKey
      ? { sessionKey: params.sessionKey }
      : null;

  if (!where) return null;

  const row = await prisma.purposeAlignmentAssessment.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });

  return row ? mapAssessment(row) : null;
}

export async function listPurposeAlignmentAssessments(params: {
  userId?: string | null;
  sessionKey?: string | null;
  limit?: number;
}): Promise<StoredPurposeAlignmentAssessment[]> {
  const where = params.userId
    ? { userId: params.userId }
    : params.sessionKey
      ? { sessionKey: params.sessionKey }
      : null;

  if (!where) return [];

  const rows = await prisma.purposeAlignmentAssessment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 12,
  });

  return rows.map(mapAssessment);
}

export async function createPurposeAlignmentReportRecord(params: {
  assessmentId: string;
  filename: string;
  storagePath?: string | null;
}): Promise<void> {
  await prisma.purposeAlignmentReport.create({
    data: {
      assessmentId: params.assessmentId,
      filename: params.filename,
      storagePath: params.storagePath ?? null,
      reportVersion: PURPOSE_ALIGNMENT_REPORT_VERSION,
    },
  });
}