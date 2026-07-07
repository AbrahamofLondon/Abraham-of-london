/**
 * lib/demo/funnel-event-store.ts
 *
 * §12 — the canonical, durable funnel event store for the flagship journey. Telemetry
 * that only fires client-side is not measurable; this persists the journey to a real
 * database (better-sqlite3, same pattern as the other durable stores) so the conversion
 * dashboard (§13) can answer "where is the corridor losing serious buyers?".
 *
 * PRIVACY: the event shape carries only structured funnel fields — there is NO free-text
 * field for decision content or intake answers. recordFunnelEvent accepts a typed input
 * and writes only the allow-listed columns, so sensitive decision text cannot leak into
 * analytics even if a caller tries to attach it. Server-only (API route + dashboard).
 */

import Database from "better-sqlite3";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import crypto from "node:crypto";

export const FUNNEL_EVENTS = [
  "SIGNAL_LANDING_VIEWED", "SIGNAL_STARTED", "SIGNAL_COMPLETED", "SIGNAL_RESULT_VIEWED",
  "EXAMPLE_VIEWED", "NEXT_MOVE_VIEWED", "NEXT_MOVE_ACCEPTED", "CORRIDOR_VIEWED",
  "PILOT_VIEWED", "PILOT_STARTED", "PILOT_SUBMITTED", "PILOT_MORE_INFO_REQUIRED",
  "PILOT_RESUBMITTED", "PILOT_ACCEPTED", "PILOT_DECLINED",
  "COMMERCIAL_CONTINUATION_STARTED", "COMMERCIAL_CONTINUATION_COMPLETED",
] as const;
export type FunnelEventType = (typeof FUNNEL_EVENTS)[number];

export const JOURNEY_VERSION = "flagship-1";

export interface FunnelEventInput {
  eventType: FunnelEventType;
  sessionId: string;
  sourceRoute: string;
  journeyVersion?: string;
  tenantId?: string | null;   // only when lawfully known
  caseId?: string | null;
  productCode?: string | null;
  recommendationId?: string | null;
}

export interface FunnelEventRecord extends Required<Omit<FunnelEventInput, "tenantId" | "caseId" | "productCode" | "recommendationId">> {
  eventId: string;
  occurredAt: string;
  tenantId: string | null;
  caseId: string | null;
  productCode: string | null;
  recommendationId: string | null;
}

const DB_DIR = join(process.cwd(), "data", "funnel");
const DB_PATH = join(DB_DIR, "funnel-events.sqlite");
let _db: Database.Database | null = null;

function schema(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS funnel_events (
    event_id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, event_type TEXT NOT NULL,
    journey_version TEXT NOT NULL, session_id TEXT NOT NULL, source_route TEXT NOT NULL,
    tenant_id TEXT, case_id TEXT, product_code TEXT, recommendation_id TEXT
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_funnel_type ON funnel_events(event_type)`);
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
export function _setFunnelDbForTest(db: Database.Database) { _db = db; schema(db); }

export function isFunnelEvent(x: unknown): x is FunnelEventType {
  return typeof x === "string" && (FUNNEL_EVENTS as readonly string[]).includes(x);
}

/** Record a funnel event. Only allow-listed structured fields are persisted. */
export function recordFunnelEvent(input: FunnelEventInput, now = new Date().toISOString()): FunnelEventRecord {
  if (!isFunnelEvent(input.eventType)) throw new Error(`[FUNNEL] unknown event type: ${input.eventType}`);
  const record: FunnelEventRecord = {
    eventId: `fev_${crypto.randomBytes(8).toString("hex")}`,
    occurredAt: now,
    eventType: input.eventType,
    journeyVersion: input.journeyVersion ?? JOURNEY_VERSION,
    sessionId: input.sessionId,
    sourceRoute: input.sourceRoute,
    tenantId: input.tenantId ?? null,
    caseId: input.caseId ?? null,
    productCode: input.productCode ?? null,
    recommendationId: input.recommendationId ?? null,
  };
  getDb().prepare(`INSERT INTO funnel_events (event_id, occurred_at, event_type, journey_version, session_id, source_route, tenant_id, case_id, product_code, recommendation_id)
    VALUES (@eventId, @occurredAt, @eventType, @journeyVersion, @sessionId, @sourceRoute, @tenantId, @caseId, @productCode, @recommendationId)`).run(record);
  return record;
}

export interface FunnelSummary {
  counts: Record<FunnelEventType, number>;
  signal: { views: number; starts: number; completions: number; completionRate: number };
  pilot: { views: number; starts: number; submissions: number; moreInfo: number; accepted: number; declined: number };
  commercial: { continuationStarted: number; continuationCompleted: number };
  biggestDropOff: { from: FunnelEventType; to: FunnelEventType; lost: number } | null;
  totalEvents: number;
}

function rate(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }

/** Aggregate the funnel. Optional ISO date range + journeyVersion filter. */
export function summarizeFunnel(opts: { from?: string; to?: string; journeyVersion?: string } = {}): FunnelSummary {
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (opts.from) { clauses.push("occurred_at >= @from"); params.from = opts.from; }
  if (opts.to) { clauses.push("occurred_at <= @to"); params.to = opts.to; }
  if (opts.journeyVersion) { clauses.push("journey_version = @jv"); params.jv = opts.journeyVersion; }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb().prepare(`SELECT event_type, COUNT(*) as n FROM funnel_events ${where} GROUP BY event_type`).all(params) as { event_type: FunnelEventType; n: number }[];
  const counts = Object.fromEntries(FUNNEL_EVENTS.map((e) => [e, 0])) as Record<FunnelEventType, number>;
  let total = 0;
  for (const r of rows) { counts[r.event_type] = r.n; total += r.n; }

  const ordered: FunnelEventType[] = ["SIGNAL_LANDING_VIEWED", "SIGNAL_STARTED", "SIGNAL_COMPLETED", "NEXT_MOVE_ACCEPTED", "PILOT_VIEWED", "PILOT_SUBMITTED", "PILOT_ACCEPTED"];
  let biggest: FunnelSummary["biggestDropOff"] = null;
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i]!, to = ordered[i + 1]!;
    const lost = Math.max(0, counts[from] - counts[to]);
    if (!biggest || lost > biggest.lost) biggest = { from, to, lost };
  }

  return {
    counts,
    signal: { views: counts.SIGNAL_LANDING_VIEWED, starts: counts.SIGNAL_STARTED, completions: counts.SIGNAL_COMPLETED, completionRate: rate(counts.SIGNAL_COMPLETED, counts.SIGNAL_STARTED) },
    pilot: { views: counts.PILOT_VIEWED, starts: counts.PILOT_STARTED, submissions: counts.PILOT_SUBMITTED, moreInfo: counts.PILOT_MORE_INFO_REQUIRED, accepted: counts.PILOT_ACCEPTED, declined: counts.PILOT_DECLINED },
    commercial: { continuationStarted: counts.COMMERCIAL_CONTINUATION_STARTED, continuationCompleted: counts.COMMERCIAL_CONTINUATION_COMPLETED },
    biggestDropOff: biggest,
    totalEvents: total,
  };
}
