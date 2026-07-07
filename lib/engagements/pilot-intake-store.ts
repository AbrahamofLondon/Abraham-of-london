/**
 * lib/engagements/pilot-intake-store.ts
 *
 * §7 — durable persistence for Operator Pilot intakes. No submission disappears into an
 * inbox: every intake is persisted with its qualification status, a review status the
 * operator can advance, and a customer-facing reference the applicant uses to check
 * status. Real better-sqlite3 (same pattern as the other durable stores). Server-only —
 * imported by the API route, never by a page bundle.
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import crypto from "node:crypto";
import type { PilotIntake, QualificationResult, QualificationStatus } from "./operator-pilot-qualification";

export type ReviewStatus = "NEW" | "IN_REVIEW" | "ACCEPTED" | "MORE_INFO_REQUESTED" | "DECLINED";

export interface PilotIntakeRecord {
  reference: string;
  createdAt: string;
  updatedAt: string;
  intake: PilotIntake;
  qualification: QualificationResult;
  reviewStatus: ReviewStatus;
  owner: string | null;
  operatorNote: string | null;
}

const DB_DIR = join(process.cwd(), "data", "engagements");
const DB_PATH = join(DB_DIR, "pilot-intakes.sqlite");
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`CREATE TABLE IF NOT EXISTS pilot_intakes (
    reference TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    intake_json TEXT NOT NULL,
    qualification_json TEXT NOT NULL,
    qualification_status TEXT NOT NULL,
    review_status TEXT NOT NULL,
    owner TEXT,
    operator_note TEXT
  )`);
  _db = db;
  return db;
}

/** Test/util: allow pointing at an isolated DB path. */
export function _setPilotDbForTest(db: Database.Database): void { _db = db; ensureSchema(db); }
function ensureSchema(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS pilot_intakes (reference TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, intake_json TEXT NOT NULL, qualification_json TEXT NOT NULL, qualification_status TEXT NOT NULL, review_status TEXT NOT NULL, owner TEXT, operator_note TEXT)`);
}

function newReference(): string {
  return `pilot_${crypto.randomBytes(6).toString("hex")}`;
}

export function savePilotIntake(intake: PilotIntake, qualification: QualificationResult, now = new Date().toISOString()): PilotIntakeRecord {
  const db = getDb();
  const reference = newReference();
  const record: PilotIntakeRecord = {
    reference, createdAt: now, updatedAt: now, intake, qualification,
    // an INCOMPLETE intake is not queued for review — it was not a real submission.
    reviewStatus: qualification.status === "INCOMPLETE" ? "MORE_INFO_REQUESTED" : "NEW",
    owner: null, operatorNote: null,
  };
  db.prepare(`INSERT INTO pilot_intakes (reference, created_at, updated_at, intake_json, qualification_json, qualification_status, review_status, owner, operator_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    reference, now, now, JSON.stringify(intake), JSON.stringify(qualification), qualification.status, record.reviewStatus, null, null,
  );
  return record;
}

function rowToRecord(r: any): PilotIntakeRecord {
  return {
    reference: r.reference, createdAt: r.created_at, updatedAt: r.updated_at,
    intake: JSON.parse(r.intake_json), qualification: JSON.parse(r.qualification_json),
    reviewStatus: r.review_status, owner: r.owner ?? null, operatorNote: r.operator_note ?? null,
  };
}

/** Customer status lookup — requires the exact reference (no enumeration of others'). */
export function getPilotIntakeByRef(reference: string): PilotIntakeRecord | null {
  const r = getDb().prepare(`SELECT * FROM pilot_intakes WHERE reference = ?`).get(reference);
  return r ? rowToRecord(r) : null;
}

/** Operator review queue (most recent first). */
export function listPilotQueue(limit = 100): PilotIntakeRecord[] {
  return getDb().prepare(`SELECT * FROM pilot_intakes ORDER BY created_at DESC LIMIT ?`).all(limit).map(rowToRecord);
}

export function updateReviewStatus(reference: string, reviewStatus: ReviewStatus, owner: string | null, operatorNote: string | null, now = new Date().toISOString()): PilotIntakeRecord | null {
  const db = getDb();
  const existing = getPilotIntakeByRef(reference);
  if (!existing) return null;
  db.prepare(`UPDATE pilot_intakes SET review_status = ?, owner = ?, operator_note = ?, updated_at = ? WHERE reference = ?`)
    .run(reviewStatus, owner, operatorNote, now, reference);
  return getPilotIntakeByRef(reference);
}
