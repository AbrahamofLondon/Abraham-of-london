/* lib/diagnostics/store.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";

export type DiagnosticSeverity = "low" | "moderate" | "high" | "critical";

export type DiagnosticRecord = {
  id: string;
  reference: string;
  diagnosticType: string;
  score: number | null;
  severity: DiagnosticSeverity | null;
  verdict: string | null;
  status: string;
  reportStatus: string;
  reportTier: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  userEmail: string | null;
  payload: Record<string, any> | null;
};

export type DiagnosticSummary = {
  total: number;
  completed: number;
  pendingReports: number;
  paidReports: number;
  generatedReports: number;
  byType: Array<{ diagnosticType: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
};

const MODEL_CANDIDATES = [
  "diagnosticRecord",
  "diagnosticSubmission",
  "diagnosticResult",
] as const;

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function safeNumber(value: unknown, fallback: number | null = null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toIso(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const raw = safeString(value);
  const t = Date.parse(raw || Date.now().toString());
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

function makeDiagnosticReference(type: string): string {
  const prefix =
    String(type || "diag")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16) || "DIAG";

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

async function resolveModel(): Promise<any> {
  const p = prisma as any;

  for (const name of MODEL_CANDIDATES) {
    if (p?.[name]) return p[name];
  }

  throw new Error("No supported diagnostic model found in Prisma.");
}

function mapRow(row: any): DiagnosticRecord {
  return {
    id: safeString(row?.id),
    reference: safeString(row?.reference || row?.diagnosticRef || row?.id),
    diagnosticType: safeString(row?.diagnosticType || row?.type),
    score: safeNumber(row?.score),
    severity: (safeString(row?.severity) || null) as DiagnosticSeverity | null,
    verdict: safeString(row?.verdict) || null,
    status: safeString(row?.status || "completed"),
    reportStatus: safeString(row?.reportStatus || "none"),
    reportTier: safeString(row?.reportTier) || null,
    createdAt: toIso(row?.createdAt),
    updatedAt: toIso(row?.updatedAt || row?.createdAt),
    userId: safeString(row?.userId) || null,
    userEmail: safeString(row?.userEmail || row?.email) || null,
    payload:
      row?.payload && typeof row.payload === "object"
        ? row.payload
        : row?.metadata && typeof row.metadata === "object"
          ? row.metadata
          : row?.responsesJson && typeof row.responsesJson === "object"
            ? row.responsesJson
            : null,
  };
}

export async function createDiagnosticRecord(input: {
  diagnosticType: string;
  score: number | null;
  severity: DiagnosticSeverity | null;
  verdict: string | null;
  status?: string;
  userId?: string | null;
  userEmail?: string | null;
  payload?: Record<string, any> | null;
}) {
  const model = await resolveModel();
  const reference = makeDiagnosticReference(input.diagnosticType);

  const data: Record<string, unknown> = {
    reference,
    diagnosticRef: reference,
    diagnosticType: input.diagnosticType,
    type: input.diagnosticType,
    score: input.score,
    severity: input.severity,
    verdict: input.verdict,
    status: input.status || "completed",
    reportStatus: "none",
    reportTier: null,
    userId: input.userId || null,
    userEmail: input.userEmail || null,
    email: input.userEmail || null,
    payload: input.payload || null,
    metadata: input.payload || null,
    responsesJson: input.payload || null,
  };

  const row = await model.create({ data });
  return mapRow(row);
}

export async function getDiagnosticRecordById(id: string): Promise<DiagnosticRecord | null> {
  const model = await resolveModel();
  const key = safeString(id).trim();
  if (!key) return null;

  const row = await model.findFirst({
    where: { id: key },
  });

  return row ? mapRow(row) : null;
}

export async function getDiagnosticRecordsForUser(input: {
  userId?: string | null;
  userEmail?: string | null;
  limit?: number;
}): Promise<DiagnosticRecord[]> {
  const model = await resolveModel();
  const or: any[] = [];

  if (input.userId) or.push({ userId: input.userId });
  if (input.userEmail) {
    or.push({ userEmail: input.userEmail });
    or.push({ email: input.userEmail });
  }

  if (!or.length) return [];

  const rows = await model.findMany({
    where: { OR: or },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(100, input.limit ?? 20)),
  });

  return (rows || []).map(mapRow);
}

export async function getRecentDiagnosticRecords(limit = 50): Promise<DiagnosticRecord[]> {
  const model = await resolveModel();
  const rows = await model.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(200, limit)),
  });

  return (rows || []).map(mapRow);
}

export async function markDiagnosticReportPending(input: {
  diagnosticId: string;
  reportTier?: string | null;
}): Promise<boolean> {
  const model = await resolveModel();
  const diagnosticId = safeString(input.diagnosticId).trim();
  if (!diagnosticId) return false;

  await model.update({
    where: { id: diagnosticId },
    data: {
      reportStatus: "pending",
      reportTier: safeString(input.reportTier) || null,
      updatedAt: new Date(),
    },
  });

  return true;
}

export async function markDiagnosticReportPaid(input: {
  diagnosticId: string;
  reportTier?: string | null;
}): Promise<boolean> {
  const model = await resolveModel();
  const diagnosticId = safeString(input.diagnosticId).trim();
  if (!diagnosticId) return false;

  await model.update({
    where: { id: diagnosticId },
    data: {
      reportStatus: "paid",
      reportTier: safeString(input.reportTier) || undefined,
      updatedAt: new Date(),
    },
  });

  return true;
}

export async function markDiagnosticReportGenerated(diagnosticId: string): Promise<boolean> {
  const model = await resolveModel();
  const id = safeString(diagnosticId).trim();
  if (!id) return false;

  await model.update({
    where: { id },
    data: {
      reportStatus: "generated",
      updatedAt: new Date(),
    },
  });

  return true;
}

export async function getDiagnosticSummary(): Promise<DiagnosticSummary> {
  const rows = await getRecentDiagnosticRecords(500);

  const summary: DiagnosticSummary = {
    total: rows.length,
    completed: 0,
    pendingReports: 0,
    paidReports: 0,
    generatedReports: 0,
    byType: [],
    bySeverity: [],
  };

  const typeMap = new Map<string, number>();
  const severityMap = new Map<string, number>();

  for (const row of rows) {
    if (row.status === "completed") summary.completed += 1;
    if (row.reportStatus === "pending") summary.pendingReports += 1;
    if (row.reportStatus === "paid") summary.paidReports += 1;
    if (row.reportStatus === "generated") summary.generatedReports += 1;

    const type = row.diagnosticType || "unknown";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);

    const severity = row.severity || "unknown";
    severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
  }

  summary.byType = Array.from(typeMap.entries())
    .map(([diagnosticType, count]) => ({ diagnosticType, count }))
    .sort((a, b) => b.count - a.count);

  summary.bySeverity = Array.from(severityMap.entries())
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => b.count - a.count);

  return summary;
}