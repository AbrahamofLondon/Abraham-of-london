/**
 * lib/demo/signal-consent-transition-store.ts
 *
 * Consent-gated continuation for anonymous Decision Signal readings.
 * Anonymous Signal may create non-personal corridor context, but it must not become
 * durable customer history until identity and consent are established.
 */

import Database from "better-sqlite3";
import crypto from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type SignalContinuationState =
  | "ANONYMOUS_RUN"
  | "CONTINUE_REQUESTED"
  | "IDENTITY_ESTABLISHED"
  | "CONSENT_CAPTURED"
  | "CASE_BOUND"
  | "INTERACTION_RECORDED"
  | "TWIN_UPDATED"
  | "EXPIRED"
  | "REJECTED";

export interface SignalContinuationRecord {
  token: string;
  recommendationId: string;
  sessionId: string;
  mode: "LIVE" | "EXAMPLE";
  state: SignalContinuationState;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  tenantId: string | null;
  subjectId: string | null;
  consentCapturedAt: string | null;
  caseId: string | null;
  interactionId: string | null;
  twinVersion: number | null;
  stateHash: string;
}

const DB_DIR = join(process.cwd(), "data", "demo");
const DB_PATH = join(DB_DIR, "signal-consent-continuations.sqlite");
let _db: Database.Database | null = null;

function schema(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS signal_continuations (
    token TEXT PRIMARY KEY,
    recommendation_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    tenant_id TEXT,
    subject_id TEXT,
    consent_captured_at TEXT,
    case_id TEXT,
    interaction_id TEXT,
    twin_version INTEGER,
    state_hash TEXT NOT NULL
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_signal_continuation_recommendation ON signal_continuations(recommendation_id)`);
}

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  schema(db);
  _db = db;
  return db;
}

export function _setSignalContinuationDbForTest(db: Database.Database): void { _db = db; schema(db); }

function hash(parts: unknown): string { return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex"); }
function token(): string { return `sigc_${crypto.randomBytes(24).toString("hex")}`; }
function expired(record: SignalContinuationRecord, now: string): boolean { return Date.parse(record.expiresAt) <= Date.parse(now); }

function rowToRecord(r: any): SignalContinuationRecord {
  return {
    token: r.token,
    recommendationId: r.recommendation_id,
    sessionId: r.session_id,
    mode: r.mode,
    state: r.state,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    expiresAt: r.expires_at,
    tenantId: r.tenant_id ?? null,
    subjectId: r.subject_id ?? null,
    consentCapturedAt: r.consent_captured_at ?? null,
    caseId: r.case_id ?? null,
    interactionId: r.interaction_id ?? null,
    twinVersion: r.twin_version ?? null,
    stateHash: r.state_hash,
  };
}

export function requestSignalContinuation(input: { recommendationId: string; sessionId: string; mode: "LIVE" | "EXAMPLE"; ttlMinutes?: number }, now = new Date().toISOString()): SignalContinuationRecord {
  if (input.mode !== "LIVE") throw new Error("Example readings cannot become customer history");
  if (!/^rec_[A-Za-z0-9_-]{6,}$/.test(input.recommendationId)) throw new Error("Invalid recommendation id");
  const expiresAt = new Date(Date.parse(now) + (input.ttlMinutes ?? 30) * 60000).toISOString();
  const record = {
    token: token(),
    recommendationId: input.recommendationId,
    sessionId: input.sessionId,
    mode: input.mode,
    state: "CONTINUE_REQUESTED" as const,
    createdAt: now,
    updatedAt: now,
    expiresAt,
    tenantId: null,
    subjectId: null,
    consentCapturedAt: null,
    caseId: null,
    interactionId: null,
    twinVersion: null,
    stateHash: hash({ recommendationId: input.recommendationId, sessionId: input.sessionId, expiresAt }),
  };
  getDb().prepare(`INSERT INTO signal_continuations (token, recommendation_id, session_id, mode, state, created_at, updated_at, expires_at, tenant_id, subject_id, consent_captured_at, case_id, interaction_id, twin_version, state_hash)
    VALUES (@token, @recommendationId, @sessionId, @mode, @state, @createdAt, @updatedAt, @expiresAt, @tenantId, @subjectId, @consentCapturedAt, @caseId, @interactionId, @twinVersion, @stateHash)`).run(record);
  return getSignalContinuation(record.token)!;
}

export function getSignalContinuation(t: string): SignalContinuationRecord | null {
  if (!/^sigc_[a-f0-9]{48}$/.test(t)) return null;
  const row = getDb().prepare(`SELECT * FROM signal_continuations WHERE token = ?`).get(t);
  return row ? rowToRecord(row) : null;
}

function update(record: SignalContinuationRecord, patch: Partial<SignalContinuationRecord>, now: string): SignalContinuationRecord {
  const next = { ...record, ...patch, updatedAt: now };
  getDb().prepare(`UPDATE signal_continuations SET state = @state, updated_at = @updatedAt, tenant_id = @tenantId, subject_id = @subjectId, consent_captured_at = @consentCapturedAt, case_id = @caseId, interaction_id = @interactionId, twin_version = @twinVersion, state_hash = @stateHash WHERE token = @token`).run(next);
  return getSignalContinuation(record.token)!;
}

export function establishSignalIdentity(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): SignalContinuationRecord {
  const record = getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (expired(record, now)) return update(record, { state: "EXPIRED" }, now);
  if (record.subjectId && record.subjectId !== params.subjectId) throw new Error("Wrong identity for continuation token");
  if (record.tenantId && record.tenantId !== params.tenantId) throw new Error("Wrong tenant for continuation token");
  if (record.state !== "CONTINUE_REQUESTED") throw new Error("Continuation token already advanced");
  return update(record, { state: "IDENTITY_ESTABLISHED", tenantId: params.tenantId, subjectId: params.subjectId, stateHash: hash({ ...record, tenantId: params.tenantId, subjectId: params.subjectId }) }, now);
}

export function captureSignalConsent(params: { token: string; tenantId: string; subjectId: string; consent: boolean }, now = new Date().toISOString()): SignalContinuationRecord {
  const record = getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (expired(record, now)) return update(record, { state: "EXPIRED" }, now);
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for consent");
  if (record.state !== "IDENTITY_ESTABLISHED") throw new Error("Identity must be established before consent");
  if (!params.consent) throw new Error("Consent required before durable history");
  return update(record, { state: "CONSENT_CAPTURED", consentCapturedAt: now, stateHash: hash({ ...record, consentCapturedAt: now }) }, now);
}

export function bindSignalCase(params: { token: string; tenantId: string; subjectId: string; caseId: string }, now = new Date().toISOString()): SignalContinuationRecord {
  const record = getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for case binding");
  if (record.state !== "CONSENT_CAPTURED") throw new Error("Consent must be captured before case binding");
  return update(record, { state: "CASE_BOUND", caseId: params.caseId, stateHash: hash({ ...record, caseId: params.caseId }) }, now);
}

export function recordSignalInteraction(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): SignalContinuationRecord {
  const record = getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for interaction");
  if (record.state !== "CASE_BOUND") throw new Error("Case must be bound before recording interaction");
  return update(record, { state: "INTERACTION_RECORDED", interactionId: `int_${crypto.randomBytes(10).toString("hex")}`, stateHash: hash({ ...record, interaction: now }) }, now);
}

export function updateSignalTwin(params: { token: string; tenantId: string; subjectId: string }, now = new Date().toISOString()): SignalContinuationRecord {
  const record = getSignalContinuation(params.token);
  if (!record) throw new Error("Continuation token not found");
  if (record.tenantId !== params.tenantId || record.subjectId !== params.subjectId) throw new Error("Wrong identity or tenant for twin update");
  if (record.state !== "INTERACTION_RECORDED") throw new Error("Interaction must be recorded before twin update");
  return update(record, { state: "TWIN_UPDATED", twinVersion: (record.twinVersion ?? 0) + 1, stateHash: hash({ ...record, twin: now }) }, now);
}

export function hasDurableSignalHistory(tokenValue: string): boolean {
  const record = getSignalContinuation(tokenValue);
  return Boolean(record && ["CASE_BOUND", "INTERACTION_RECORDED", "TWIN_UPDATED"].includes(record.state));
}
