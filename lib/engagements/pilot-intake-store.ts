/**
 * lib/engagements/pilot-intake-store.ts
 *
 * Durable persistence for Operator Pilot intakes. The store records the full lifecycle,
 * keeps customer status separate from operator notes, enforces allowed transitions, and
 * deduplicates exact replayed submissions by a non-sensitive fingerprint.
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import crypto from "node:crypto";
import { hashPilotStatusAccessIdentifier, hashPilotStatusSecret, newPilotStatusSecret } from "./pilot-status-security";
import type { PilotIntake, QualificationResult } from "./operator-pilot-qualification";
import { assertSqliteRuntimeAllowed } from "@/lib/runtime/sqlite-runtime-guard";

export type PilotLifecycleState =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "RESUBMITTED"
  | "HUMAN_REVIEW"
  | "POTENTIALLY_SUITABLE"
  | "ACCEPTED"
  | "DECLINED"
  | "SCOPING"
  | "COMMERCIAL_CONTINUATION";

export type ReviewStatus = PilotLifecycleState;

export interface PilotIntakeRecord {
  reference: string;
  createdAt: string;
  updatedAt: string;
  intake: PilotIntake;
  qualification: QualificationResult;
  reviewStatus: PilotLifecycleState;
  owner: string | null;
  operatorNote: string | null;
  requestedInformation: string | null;
  finalDecision: string | null;
  fingerprint: string;
  statusSecretHash: string | null;
  statusSecretExpiresAt: string | null;
  statusSecretRevokedAt: string | null;
  statusSecret?: string;
}

export interface PilotCustomerStatus {
  reference: string;
  currentState: PilotLifecycleState;
  lastUpdate: string;
  requestedInformation: string | null;
  nextExpectedStep: string;
  finalDecision: string | null;
}

export interface PilotQueueItem extends PilotIntakeRecord {
  ageHours: number;
  nextOperation: string;
  evidencePosture: string;
  qualificationStatus: string;
}

const DB_DIR = join(process.cwd(), "data", "engagements");
const DB_PATH = join(DB_DIR, "pilot-intakes.sqlite");
let _db: Database.Database | null = null;

function schema(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS pilot_intakes (
    reference TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    intake_json TEXT NOT NULL,
    qualification_json TEXT NOT NULL,
    qualification_status TEXT NOT NULL,
    review_status TEXT NOT NULL,
    owner TEXT,
    operator_note TEXT,
    requested_information TEXT,
    final_decision TEXT,
    intake_fingerprint TEXT NOT NULL
  )`);
  const cols = new Set((db.prepare(`PRAGMA table_info(pilot_intakes)`).all() as any[]).map((c) => c.name));
  if (!cols.has("requested_information")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN requested_information TEXT`);
  if (!cols.has("final_decision")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN final_decision TEXT`);
  if (!cols.has("intake_fingerprint")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN intake_fingerprint TEXT NOT NULL DEFAULT ''`);
  if (!cols.has("status_secret_hash")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN status_secret_hash TEXT`);
  if (!cols.has("status_secret_expires_at")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN status_secret_expires_at TEXT`);
  if (!cols.has("status_secret_revoked_at")) db.exec(`ALTER TABLE pilot_intakes ADD COLUMN status_secret_revoked_at TEXT`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pilot_review_status ON pilot_intakes(review_status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_pilot_fingerprint ON pilot_intakes(intake_fingerprint)`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_status_secret ON pilot_intakes(status_secret_hash)`);
}

function getDb(): Database.Database {
  if (_db) return _db;
  assertSqliteRuntimeAllowed("pilot-intake-store"); // §2 fail closed in production
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  schema(db);
  _db = db;
  return db;
}

export function _setPilotDbForTest(db: Database.Database): void { _db = db; schema(db); }

function newReference(): string { return `pilot_${crypto.randomBytes(16).toString("hex")}`; }

function canonicalText(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function canonicalDate(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : raw;
}

export function fingerprintPilotIntake(intake: PilotIntake): string {
  return crypto.createHash("sha256").update(JSON.stringify({
    version: "pilot-intake-fingerprint-v2",
    organisation: canonicalText(intake.organisation),
    role: canonicalText(intake.role),
    authorityToEngage: Boolean(intake.authorityToEngage),
    decisionDomain: canonicalText(intake.decisionDomain),
    materiality: intake.materiality,
    decisionStage: intake.decisionStage,
    affectedStakeholders: canonicalText(intake.affectedStakeholders),
    decisionDeadline: canonicalDate(intake.decisionDeadline),
    existingEvidence: canonicalText(intake.existingEvidence),
    knownContradictions: canonicalText(intake.knownContradictions),
    governanceSensitivity: intake.governanceSensitivity,
    confidentialityRequired: Boolean(intake.confidentialityRequired),
    desiredOutcome: canonicalText(intake.desiredOutcome),
    willingToParticipateInCheckpoints: Boolean(intake.willingToParticipateInCheckpoints),
    contactEmail: canonicalText(intake.contactEmail),
  })).digest("hex");
}

export function initialState(qualification: QualificationResult): PilotLifecycleState {
  if (qualification.status === "MORE_INFO_REQUIRED" || qualification.status === "INCOMPLETE") return "MORE_INFORMATION_REQUIRED";
  if (qualification.status === "HUMAN_REVIEW_REQUIRED") return "HUMAN_REVIEW";
  if (qualification.status === "POTENTIALLY_SUITABLE") return "POTENTIALLY_SUITABLE";
  if (qualification.status === "UNSUITABLE") return "DECLINED";
  return "SUBMITTED";
}

function rowToRecord(r: any): PilotIntakeRecord {
  return {
    reference: r.reference,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    intake: JSON.parse(r.intake_json),
    qualification: JSON.parse(r.qualification_json),
    reviewStatus: r.review_status,
    owner: r.owner ?? null,
    operatorNote: r.operator_note ?? null,
    requestedInformation: r.requested_information ?? null,
    finalDecision: r.final_decision ?? null,
    fingerprint: r.intake_fingerprint ?? "",
    statusSecretHash: r.status_secret_hash ?? null,
    statusSecretExpiresAt: r.status_secret_expires_at ?? null,
    statusSecretRevokedAt: r.status_secret_revoked_at ?? null,
  };
}

export function savePilotIntake(intake: PilotIntake, qualification: QualificationResult, now = new Date().toISOString()): PilotIntakeRecord {
  const db = getDb();
  const fp = fingerprintPilotIntake(intake);
  const replay = db.prepare(`SELECT * FROM pilot_intakes WHERE intake_fingerprint = ? ORDER BY created_at DESC LIMIT 1`).get(fp);
  if (replay) return rowToRecord(replay);
  const reference = newReference();
  const state = initialState(qualification);
  const statusSecret = newPilotStatusSecret();
  const statusSecretHash = hashPilotStatusSecret(statusSecret);
  const statusSecretExpiresAt = new Date(Date.parse(now) + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO pilot_intakes (reference, created_at, updated_at, intake_json, qualification_json, qualification_status, review_status, owner, operator_note, requested_information, final_decision, intake_fingerprint, status_secret_hash, status_secret_expires_at, status_secret_revoked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    reference, now, now, JSON.stringify(intake), JSON.stringify(qualification), qualification.status, state, null, null,
    state === "MORE_INFORMATION_REQUIRED" ? qualification.reasons.join(" ") : null,
    state === "DECLINED" ? qualification.reasons.join(" ") : null,
    fp,
    statusSecretHash,
    statusSecretExpiresAt,
    null,
  );
  return { ...getPilotIntakeByRef(reference)!, statusSecret };
}

export function getPilotIntakeByRef(reference: string): PilotIntakeRecord | null {
  if (!/^pilot_[a-f0-9]{32}$/.test(reference)) return null;
  const r = getDb().prepare(`SELECT * FROM pilot_intakes WHERE reference = ?`).get(reference);
  return r ? rowToRecord(r) : null;
}

export function toCustomerStatus(record: PilotIntakeRecord): PilotCustomerStatus {
  const next: Record<PilotLifecycleState, string> = {
    SUBMITTED: "Your intake has been received and is waiting for operator triage.",
    UNDER_REVIEW: "An operator is checking evidence, authority and suitability.",
    MORE_INFORMATION_REQUIRED: "Additional information is required before review can continue.",
    RESUBMITTED: "Your updated information has been received and is queued for review.",
    HUMAN_REVIEW: "A human reviewer is required before any suitability decision.",
    POTENTIALLY_SUITABLE: "The intake may be suitable; a human reviewer must still decide.",
    ACCEPTED: "The pilot has been accepted and will move into scoping.",
    DECLINED: "The pilot is not suitable on the current evidence.",
    SCOPING: "Scope and commercial continuation are being prepared.",
    COMMERCIAL_CONTINUATION: "Commercial continuation is ready through the controlled route.",
  };
  return { reference: record.reference, currentState: record.reviewStatus, lastUpdate: record.updatedAt, requestedInformation: record.requestedInformation, nextExpectedStep: next[record.reviewStatus], finalDecision: record.finalDecision };
}

export function listPilotQueue(opts: { status?: PilotLifecycleState; limit?: number } = {}): PilotQueueItem[] {
  const params: any = { limit: opts.limit ?? 100 };
  const where = opts.status ? "WHERE review_status = @status" : "";
  if (opts.status) params.status = opts.status;
  return getDb().prepare(`SELECT * FROM pilot_intakes ${where} ORDER BY created_at DESC LIMIT @limit`).all(params).map((row: any) => {
    const record = rowToRecord(row);
    const ageHours = Math.max(0, Math.round((Date.now() - Date.parse(record.createdAt)) / 3600000));
    return { ...record, ageHours, nextOperation: nextOperation(record), evidencePosture: record.intake.existingEvidence.length > 60 ? "DETAILED" : "THIN", qualificationStatus: record.qualification.status };
  });
}

export function nextOperation(record: PilotIntakeRecord): string {
  if (record.reviewStatus === "SUBMITTED" || record.reviewStatus === "RESUBMITTED") return "Triage and assign reviewer";
  if (record.reviewStatus === "UNDER_REVIEW") return "Decide whether more information or human review is required";
  if (record.reviewStatus === "MORE_INFORMATION_REQUIRED") return "Wait for applicant resubmission";
  if (record.reviewStatus === "HUMAN_REVIEW" || record.reviewStatus === "POTENTIALLY_SUITABLE") return "Human authority decision required";
  if (record.reviewStatus === "ACCEPTED") return "Move to scope definition";
  if (record.reviewStatus === "SCOPING") return "Prepare commercial continuation";
  return "No operator action";
}

export const ALLOWED: Record<PilotLifecycleState, PilotLifecycleState[]> = {
  SUBMITTED: ["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "HUMAN_REVIEW", "DECLINED"],
  UNDER_REVIEW: ["MORE_INFORMATION_REQUIRED", "HUMAN_REVIEW", "POTENTIALLY_SUITABLE", "DECLINED"],
  MORE_INFORMATION_REQUIRED: ["RESUBMITTED", "DECLINED"],
  RESUBMITTED: ["UNDER_REVIEW", "HUMAN_REVIEW", "DECLINED"],
  HUMAN_REVIEW: ["POTENTIALLY_SUITABLE", "ACCEPTED", "DECLINED"],
  POTENTIALLY_SUITABLE: ["ACCEPTED", "DECLINED", "MORE_INFORMATION_REQUIRED"],
  ACCEPTED: ["SCOPING"],
  DECLINED: [],
  SCOPING: ["COMMERCIAL_CONTINUATION"],
  COMMERCIAL_CONTINUATION: [],
};

export function transitionPilotState(reference: string, nextState: PilotLifecycleState, actor: { email: string | null; humanAuthority: boolean }, details: { requestedInformation?: string | null; finalDecision?: string | null; operatorNote?: string | null } = {}, now = new Date().toISOString()): PilotIntakeRecord | null {
  const existing = getPilotIntakeByRef(reference);
  if (!existing) return null;
  if (!ALLOWED[existing.reviewStatus].includes(nextState)) throw new Error(`Illegal pilot transition: ${existing.reviewStatus} -> ${nextState}`);
  if ((nextState === "ACCEPTED" || nextState === "DECLINED") && !actor.humanAuthority) throw new Error("Human authority required for final pilot decision");
  const finalDecision = nextState === "ACCEPTED" || nextState === "DECLINED" ? (details.finalDecision ?? existing.finalDecision ?? nextState) : existing.finalDecision;
  getDb().prepare(`UPDATE pilot_intakes SET review_status = ?, owner = ?, operator_note = ?, requested_information = ?, final_decision = ?, updated_at = ? WHERE reference = ?`).run(
    nextState,
    actor.email,
    details.operatorNote ?? existing.operatorNote,
    details.requestedInformation ?? existing.requestedInformation,
    finalDecision,
    now,
    reference,
  );
  return getPilotIntakeByRef(reference);
}

export function updateReviewStatus(reference: string, reviewStatus: ReviewStatus, owner: string | null, operatorNote: string | null, now = new Date().toISOString()): PilotIntakeRecord | null {
  return transitionPilotState(reference, reviewStatus, { email: owner, humanAuthority: reviewStatus !== "ACCEPTED" && reviewStatus !== "DECLINED" ? true : Boolean(owner) }, { operatorNote }, now);
}

export function getPilotIntakeByStatusSecret(secret: string, context: { ip?: string | null } = {}, now = new Date()): PilotIntakeRecord | null {
  let attemptedHash = "invalid";
  try { attemptedHash = hashPilotStatusSecret(secret); } catch { return null; }
  const row = getDb().prepare(`SELECT * FROM pilot_intakes WHERE status_secret_hash = ?`).get(attemptedHash) as any;
  const result = !row ? "NOT_FOUND" : row.status_secret_revoked_at ? "REVOKED" : Date.parse(row.status_secret_expires_at || "") <= now.getTime() ? "EXPIRED" : "GRANTED";
  getDb().exec(`CREATE TABLE IF NOT EXISTS pilot_status_access_audits (id TEXT PRIMARY KEY, intake_ref TEXT, attempted_hash TEXT NOT NULL, result TEXT NOT NULL, ip_hash TEXT, created_at TEXT NOT NULL)`);
  getDb().prepare(`INSERT INTO pilot_status_access_audits (id, intake_ref, attempted_hash, result, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    crypto.randomUUID(), row?.reference ?? null, attemptedHash, result, context.ip ? hashPilotStatusAccessIdentifier(context.ip) : null, new Date().toISOString(),
  );
  if (!row || result !== "GRANTED") return null;
  return rowToRecord(row);
}