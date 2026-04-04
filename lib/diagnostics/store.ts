/* lib/diagnostics/store.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma.server";

export type DiagnosticSeverity = "low" | "moderate" | "high" | "critical";

export type DiagnosticRecord = {
  id: string;
  reference: string;
  diagnosticType: string;
  score: number | null;
  severity: DiagnosticSeverity | null;
  verdict: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  userEmail: string | null;
  payload: Record<string, any> | null;
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
  const raw = safeString(value);
  const t = new Date(raw || Date.now()).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

function makeDiagnosticReference(type: string) {
  const prefix = String(type || "diag")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 16) || "DIAG";

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

async function resolveModel() {
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
    createdAt: toIso(row?.createdAt),
    updatedAt: toIso(row?.updatedAt || row?.createdAt),
    userId: safeString(row?.userId) || null,
    userEmail: safeString(row?.userEmail || row?.email) || null,
    payload:
      row?.payload && typeof row.payload === "object"
        ? row.payload
        : row?.metadata && typeof row.metadata === "object"
        ? row.metadata
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

  const row = await model.create({
    data: {
      reference,
      diagnosticType: input.diagnosticType,
      score: input.score,
      severity: input.severity,
      verdict: input.verdict,
      status: input.status || "completed",
      userId: input.userId || null,
      userEmail: input.userEmail || null,
      payload: input.payload || null,
    },
  });

  return mapRow(row);
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