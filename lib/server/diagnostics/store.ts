/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/server/diagnostics/store.ts
 *
 * Pages-router safe diagnostic store.
 * No `server-only` import.
 *
 * Goals:
 * - Backward compatible exports for legacy API routes/pages
 * - Tolerant input/output shapes
 * - File-backed persistence so diagnostics still work even when Prisma shape drifts
 * - Optional Prisma mirror when a compatible model exists
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type StoredDiagnosticSectionScore = {
  sectionId: string;
  title: string;
  score: number;
  maxScore: number;
  pct: number;
};

export type StoredDiagnosticReportVersion = {
  reportId: string;
  version: string;
  generatedAt: string;
  htmlPath?: string | null;
  pdfPath?: string | null;
  archivedArtifactId?: string | null;
  archivedAt?: string | null;
};

export type StoredDiagnosticRecord = {
  id: string;
  diagnosticRef: string;
  kind: string;
  diagnosticType: string;
  title: string;
  score: number;
  severity: string;
  verdict: string;
  notes: string | null;
  status: string;
  reportStatus: string;
  reportTier: string | null;
  createdAt: string;
  updatedAt: string;
  actor: {
    userId: string | null;
    email: string | null;
    name?: string | null;
  };
  respondent: {
    name: string | null;
    email: string | null;
    organisation: string | null;
  };
  responses: Record<string, any>;
  summary: {
    totalScore: number;
    maxScore: number;
    pct: number;
    band: string;
    severity: string;
    weakestDomains: string[];
    strongestDomains: string[];
    sectionScores: StoredDiagnosticSectionScore[];
  };
  metadata?: Record<string, any> | null;
  report: StoredDiagnosticReportVersion | null;
  reportHistory: StoredDiagnosticReportVersion[];
};

type DiagnosticStoreFileShape = {
  version: 1;
  updatedAt: string;
  items: StoredDiagnosticRecord[];
};

const STORE_DIR = path.join(process.cwd(), "var", "diagnostics");
const STORE_FILE = path.join(STORE_DIR, "records.json");

function ensureStoreDir(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNullableString(value: unknown): string | null {
  const s = safeString(value);
  return s || null;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function safeObject<T extends Record<string, any> = Record<string, any>>(
  value: unknown,
  fallback: T = {} as T,
): T {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : fallback;
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeBand(pct: number): string {
  if (pct >= 80) return "ALIGNED";
  if (pct >= 60) return "DRIFTING";
  if (pct >= 40) return "MISALIGNED";
  return "DISORDERED";
}

function computeSeverity(pct: number): string {
  if (pct >= 80) return "low";
  if (pct >= 60) return "moderate";
  if (pct >= 40) return "high";
  return "critical";
}

function makeDiagnosticRef(type: string): string {
  const prefix =
    safeString(type, "diag")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16) || "DIAG";

  const stamp = new Date()
  .toISOString()
  .replace(/[-:.]/g, "")
  .replace(/T/g, "")
  .replace(/Z/g, "")
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function emptyStore(): DiagnosticStoreFileShape {
  return {
    version: 1,
    updatedAt: nowIso(),
    items: [],
  };
}

function readStore(): DiagnosticStoreFileShape {
  ensureStoreDir();

  if (!fs.existsSync(STORE_FILE)) {
    const seed = emptyStore();
    fs.writeFileSync(STORE_FILE, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as DiagnosticStoreFileShape;
    return {
      version: 1,
      updatedAt: safeString(parsed?.updatedAt, nowIso()),
      items: safeArray<StoredDiagnosticRecord>(parsed?.items),
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: DiagnosticStoreFileShape): void {
  ensureStoreDir();
  fs.writeFileSync(
    STORE_FILE,
    JSON.stringify(
      {
        version: 1,
        updatedAt: nowIso(),
        items: safeArray(store.items),
      },
      null,
      2,
    ),
    "utf8",
  );
}

function normalizeSectionScores(input: unknown): StoredDiagnosticSectionScore[] {
  const arr = safeArray<any>(input);

  if (!arr.length) return [];

  return arr.map((item, index) => {
    const score = safeNumber(item?.score, 0);
    const maxScore = Math.max(1, safeNumber(item?.maxScore, 100));
    const pct = clampPct(
      item?.pct != null ? safeNumber(item?.pct, 0) : (score / maxScore) * 100,
    );

    return {
      sectionId: safeString(item?.sectionId, `section-${index + 1}`),
      title: safeString(item?.title, `Section ${index + 1}`),
      score,
      maxScore,
      pct,
    };
  });
}

function normalizeReportVersion(input: any): StoredDiagnosticReportVersion | null {
  if (!input || typeof input !== "object") return null;

  const reportId = safeString(input.reportId);
  const version = safeString(input.version);
  const generatedAt = safeString(input.generatedAt, nowIso());

  if (!reportId || !version) return null;

  return {
    reportId,
    version,
    generatedAt,
    htmlPath: safeNullableString(input.htmlPath),
    pdfPath: safeNullableString(input.pdfPath),
    archivedArtifactId: safeNullableString(input.archivedArtifactId),
    archivedAt: safeNullableString(input.archivedAt),
  };
}

function normalizeReportHistory(input: unknown): StoredDiagnosticReportVersion[] {
  const history = safeArray<any>(input)
    .map(normalizeReportVersion)
    .filter(Boolean) as StoredDiagnosticReportVersion[];

  return history.sort((a, b) =>
    String(b.generatedAt || "").localeCompare(String(a.generatedAt || "")),
  );
}

function normalizeStoredRecord(input: any): StoredDiagnosticRecord {
  const responses = safeObject<Record<string, any>>(input?.responses || input?.responsesJson || input?.payload || {});
  const summaryInput = safeObject<any>(input?.summary);
  const sectionScores = normalizeSectionScores(summaryInput.sectionScores || input?.sectionScores);

  const totalScore =
    summaryInput.totalScore != null
      ? safeNumber(summaryInput.totalScore, 0)
      : safeNumber(input?.score, 0);

  const maxScore =
    summaryInput.maxScore != null
      ? Math.max(1, safeNumber(summaryInput.maxScore, 100))
      : 100;

  const pct =
    summaryInput.pct != null
      ? clampPct(safeNumber(summaryInput.pct, 0))
      : clampPct((totalScore / Math.max(1, maxScore)) * 100);

  const kind = safeString(input?.kind || input?.diagnosticType, "diagnostic");
  const diagnosticType = safeString(input?.diagnosticType || input?.kind, kind);
  const severity = safeString(
    input?.severity || summaryInput.severity,
    computeSeverity(pct),
  );

  const currentReport = normalizeReportVersion(input?.report);
  const reportHistory = normalizeReportHistory(input?.reportHistory);

  const mergedHistory = [
    ...(currentReport ? [currentReport] : []),
    ...reportHistory,
  ].filter(
    (item, idx, arr) =>
      idx ===
      arr.findIndex(
        (x) => x.reportId === item.reportId && x.version === item.version,
      ),
  );

  return {
    id: safeString(input?.id, crypto.randomUUID()),
    diagnosticRef: safeString(
      input?.diagnosticRef || input?.reference || input?.ref,
      makeDiagnosticRef(diagnosticType),
    ),
    kind,
    diagnosticType,
    title: safeString(input?.title, diagnosticType || "Diagnostic"),
    score: safeNumber(input?.score, totalScore),
    severity,
    verdict: safeString(input?.verdict, "Assessment completed"),
    notes: safeNullableString(input?.notes),
    status: safeString(input?.status, "completed"),
    reportStatus: safeString(input?.reportStatus, "none"),
    reportTier: safeNullableString(input?.reportTier),
    createdAt: safeString(input?.createdAt, nowIso()),
    updatedAt: safeString(input?.updatedAt, nowIso()),
    actor: {
      userId: safeNullableString(input?.actor?.userId || input?.userId),
      email: safeNullableString(input?.actor?.email || input?.userEmail || input?.email),
      name: safeNullableString(input?.actor?.name || input?.userName),
    },
    respondent: {
      name: safeNullableString(input?.respondent?.name || input?.name),
      email: safeNullableString(input?.respondent?.email || input?.userEmail || input?.email),
      organisation: safeNullableString(
        input?.respondent?.organisation || input?.organisation || input?.company,
      ),
    },
    responses,
    summary: {
      totalScore,
      maxScore,
      pct,
      band: safeString(summaryInput.band, computeBand(pct)),
      severity,
      weakestDomains: safeArray<string>(summaryInput.weakestDomains).map(String),
      strongestDomains: safeArray<string>(summaryInput.strongestDomains).map(String),
      sectionScores,
    },
    metadata: safeObject(input?.metadata, null as any),
    report: currentReport,
    reportHistory: mergedHistory,
  };
}

async function maybeMirrorToPrisma(record: StoredDiagnosticRecord): Promise<void> {
  try {
    const p = prisma as any;

    if (p?.diagnosticRecord?.upsert) {
      await p.diagnosticRecord.upsert({
        where: { id: record.id },
        update: {
          diagnosticType: record.diagnosticType,
          title: record.title,
          score: record.score,
          severity: record.severity,
          verdict: record.verdict,
          notes: record.notes,
          userId: record.actor.userId,
          userEmail: record.actor.email,
          status: record.status,
          reportStatus: record.reportStatus,
          reportTier: record.reportTier,
          responsesJson: record.responses,
          updatedAt: new Date(record.updatedAt),
        },
        create: {
          id: record.id,
          diagnosticType: record.diagnosticType,
          title: record.title,
          score: record.score,
          severity: record.severity,
          verdict: record.verdict,
          notes: record.notes,
          userId: record.actor.userId,
          userEmail: record.actor.email,
          status: record.status,
          reportStatus: record.reportStatus,
          reportTier: record.reportTier,
          responsesJson: record.responses,
          createdAt: new Date(record.createdAt),
          updatedAt: new Date(record.updatedAt),
        },
      });
    }
  } catch (error) {
    console.warn("[diagnostics.store] Prisma mirror skipped:", error);
  }
}

export async function saveDiagnosticRecord(input: any): Promise<StoredDiagnosticRecord> {
  const store = readStore();
  const normalized = normalizeStoredRecord({
    ...input,
    id: safeString(input?.id, crypto.randomUUID()),
    diagnosticRef: safeString(
      input?.diagnosticRef || input?.reference || input?.ref,
      makeDiagnosticRef(safeString(input?.diagnosticType || input?.kind, "diag")),
    ),
    createdAt: safeString(input?.createdAt, nowIso()),
    updatedAt: nowIso(),
  });

  store.items = [
    ...store.items.filter(
      (item) =>
        item.id !== normalized.id &&
        item.diagnosticRef !== normalized.diagnosticRef,
    ),
    normalized,
  ];

  writeStore(store);
  await maybeMirrorToPrisma(normalized);

  return normalized;
}

export async function appendDiagnosticReportVersion(args: {
  diagnosticRef: string;
  report: StoredDiagnosticReportVersion;
  reportStatus?: string;
  reportTier?: string | null;
}): Promise<StoredDiagnosticRecord | null> {
  const store = readStore();
  const ref = safeString(args.diagnosticRef);
  const next = normalizeReportVersion(args.report);

  if (!ref || !next) return null;

  const idx = store.items.findIndex((item) => item.diagnosticRef === ref);
  if (idx < 0) return null;

  const current = normalizeStoredRecord(store.items[idx]);
  const merged = [next, ...current.reportHistory]
    .filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (x) => x.reportId === item.reportId && x.version === item.version,
        ),
    )
    .sort((a, b) => String(b.generatedAt).localeCompare(String(a.generatedAt)));

  const updated: StoredDiagnosticRecord = {
    ...current,
    report: next,
    reportHistory: merged,
    reportStatus: safeString(args.reportStatus, "generated"),
    reportTier:
      args.reportTier !== undefined
        ? safeNullableString(args.reportTier)
        : current.reportTier,
    updatedAt: nowIso(),
  };

  store.items[idx] = updated;
  writeStore(store);
  await maybeMirrorToPrisma(updated);

  return updated;
}

export async function getDiagnosticRecordByRef(
  diagnosticRef: string,
): Promise<StoredDiagnosticRecord | null> {
  const ref = safeString(diagnosticRef);
  if (!ref) return null;

  const store = readStore();
  const found = store.items.find((item) => item.diagnosticRef === ref);

  return found ? normalizeStoredRecord(found) : null;
}

export async function getDiagnosticRecordById(
  id: string,
): Promise<StoredDiagnosticRecord | null> {
  const needle = safeString(id);
  if (!needle) return null;

  const store = readStore();
  const found = store.items.find((item) => item.id === needle);

  return found ? normalizeStoredRecord(found) : null;
}

export async function listDiagnosticRecords(args?: {
  limit?: number;
  userId?: string | null;
  userEmail?: string | null;
}): Promise<StoredDiagnosticRecord[]> {
  const limit = Math.max(1, Math.min(200, safeNumber(args?.limit, 50)));
  const userId = safeNullableString(args?.userId);
  const userEmail = safeNullableString(args?.userEmail)?.toLowerCase() ?? null;

  let items = readStore().items.map(normalizeStoredRecord);

  if (userId || userEmail) {
    items = items.filter((item) => {
      const actorEmail = item.actor.email?.toLowerCase() ?? null;
      const respondentEmail = item.respondent.email?.toLowerCase() ?? null;

      return (
        (userId && item.actor.userId === userId) ||
        (userEmail &&
          (actorEmail === userEmail || respondentEmail === userEmail))
      );
    });
  }

  return items
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

export async function markDiagnosticReportPending(args: {
  diagnosticId?: string | null;
  diagnosticRef?: string | null;
  reportTier?: string | null;
}): Promise<StoredDiagnosticRecord | null> {
  const store = readStore();
  const targetId = safeNullableString(args.diagnosticId);
  const targetRef = safeNullableString(args.diagnosticRef);

  const idx = store.items.findIndex(
    (item) =>
      (targetId && item.id === targetId) ||
      (targetRef && item.diagnosticRef === targetRef),
  );

  if (idx < 0) return null;

  const updated: StoredDiagnosticRecord = {
    ...normalizeStoredRecord(store.items[idx]),
    reportStatus: "pending",
    reportTier:
      args.reportTier !== undefined
        ? safeNullableString(args.reportTier)
        : store.items[idx].reportTier,
    updatedAt: nowIso(),
  };

  store.items[idx] = updated;
  writeStore(store);
  await maybeMirrorToPrisma(updated);

  return updated;
}

export async function markDiagnosticReportPaid(args: {
  diagnosticId?: string | null;
  diagnosticRef?: string | null;
  reportTier?: string | null;
}): Promise<StoredDiagnosticRecord | null> {
  const store = readStore();
  const targetId = safeNullableString(args.diagnosticId);
  const targetRef = safeNullableString(args.diagnosticRef);

  const idx = store.items.findIndex(
    (item) =>
      (targetId && item.id === targetId) ||
      (targetRef && item.diagnosticRef === targetRef),
  );

  if (idx < 0) return null;

  const updated: StoredDiagnosticRecord = {
    ...normalizeStoredRecord(store.items[idx]),
    reportStatus: "paid",
    reportTier:
      args.reportTier !== undefined
        ? safeNullableString(args.reportTier)
        : store.items[idx].reportTier,
    updatedAt: nowIso(),
  };

  store.items[idx] = updated;
  writeStore(store);
  await maybeMirrorToPrisma(updated);

  return updated;
}

export async function getDiagnosticSummary(): Promise<{
  total: number;
  completed: number;
  pendingReports: number;
  paidReports: number;
  generatedReports: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}> {
  const items = readStore().items.map(normalizeStoredRecord);

  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "completed") acc.completed += 1;
      if (item.reportStatus === "pending") acc.pendingReports += 1;
      if (item.reportStatus === "paid") acc.paidReports += 1;
      if (item.reportStatus === "generated") acc.generatedReports += 1;

      const sev = safeString(item.severity).toLowerCase();
      if (sev === "critical") acc.critical += 1;
      else if (sev === "high") acc.high += 1;
      else if (sev === "moderate") acc.moderate += 1;
      else acc.low += 1;

      return acc;
    },
    {
      total: 0,
      completed: 0,
      pendingReports: 0,
      paidReports: 0,
      generatedReports: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    },
  );
}