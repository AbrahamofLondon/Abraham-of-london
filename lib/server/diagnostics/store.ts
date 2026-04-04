/* lib/server/diagnostics/store.ts */

import "server-only";

import fs from "fs";
import path from "path";

import type {
  DiagnosticSubmissionPayload,
  DiagnosticSectionScore,
} from "@/lib/diagnostics/types";

export type StoredDiagnosticReportVersion = {
  reportId: string;
  version: string;
  generatedAt: string;
  headline: string;
  executiveSummary: string;
  narrativeSummary: string;
  keyFindings: string[];
  recommendations: Array<{
    id?: string;
    title: string;
    detail: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
  htmlPath?: string | null;
  pdfPath?: string | null;
  archivedArtifactId?: string | null;
  archivedAt?: string | null;
};

export type StoredDiagnosticRecord = {
  diagnosticRef: string;
  submittedAt: string;
  updatedAt: string;
  kind: string;
  title: string;
  source: string;
  entry: string;
  intent: string;
  status: "submitted" | "queued" | "report-ready" | "archived";
  reportStatus: "none" | "queued" | "ready" | "failed";
  crmForwarded: boolean;
  actor: {
    userId: string | null;
    tier: string;
    authenticated: boolean;
    name?: string | null;
    email?: string | null;
  };
  respondent: {
    name?: string | null;
    email?: string | null;
    organisation?: string | null;
    role?: string | null;
  };
  summary: {
    totalScore: number;
    maxScore: number;
    pct: number;
    severity: string;
    band: string;
    sectionScores: DiagnosticSectionScore[];
  };
  notes?: string | null;
  answers: DiagnosticSubmissionPayload["answers"];
  metadata?: Record<string, unknown>;
  report?: StoredDiagnosticReportVersion | null;
  reportHistory?: StoredDiagnosticReportVersion[] | null;
};

const DATA_DIR = path.join(process.cwd(), ".data", "diagnostics");
const DATA_FILE = path.join(DATA_DIR, "records.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2), "utf8");
  }
}

function readDb(): { records: StoredDiagnosticRecord[] } {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.records)) return { records: [] };
    return { records: parsed.records };
  } catch {
    return { records: [] };
  }
}

function writeDb(db: { records: StoredDiagnosticRecord[] }) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function saveDiagnosticRecord(
  record: StoredDiagnosticRecord,
): Promise<StoredDiagnosticRecord> {
  const db = readDb();
  const idx = db.records.findIndex((r) => r.diagnosticRef === record.diagnosticRef);

  if (idx >= 0) db.records[idx] = record;
  else db.records.unshift(record);

  writeDb(db);
  return record;
}

export async function getDiagnosticRecordByRef(
  diagnosticRef: string,
): Promise<StoredDiagnosticRecord | null> {
  const db = readDb();
  return db.records.find((r) => r.diagnosticRef === diagnosticRef) || null;
}

export async function listDiagnosticRecords(args?: {
  limit?: number;
  actorUserId?: string | null;
  authenticatedOnly?: boolean;
  kind?: string | null;
}): Promise<StoredDiagnosticRecord[]> {
  const db = readDb();
  let list = [...db.records];

  if (args?.actorUserId) list = list.filter((r) => r.actor.userId === args.actorUserId);
  if (args?.authenticatedOnly) list = list.filter((r) => r.actor.authenticated === true);
  if (args?.kind) list = list.filter((r) => r.kind === args.kind);

  list.sort((a, b) => (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0));

  return typeof args?.limit === "number" ? list.slice(0, args.limit) : list;
}

export async function appendDiagnosticReportVersion(
  diagnosticRef: string,
  report: StoredDiagnosticReportVersion,
): Promise<StoredDiagnosticRecord | null> {
  const db = readDb();
  const idx = db.records.findIndex((r) => r.diagnosticRef === diagnosticRef);
  if (idx < 0) return null;

  const current = db.records[idx];
  const versions = Array.isArray(current.reportHistory) ? [...current.reportHistory] : [];
  versions.unshift(report);

  const updated: StoredDiagnosticRecord = {
    ...current,
    updatedAt: new Date().toISOString(),
    reportStatus: "ready",
    status: "report-ready",
    report,
    reportHistory: versions,
  };

  db.records[idx] = updated;
  writeDb(db);
  return updated;
}