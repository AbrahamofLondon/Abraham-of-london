/**
 * lib/living-intelligence/living-action-feedback-store.ts
 *
 * JSON report-backed store for living action feedback records.
 *
 * For MVP, this uses a local JSON file at reports/living-action-feedback.json.
 * It is NOT a production DB — it stores only action metadata, status,
 * timestamps, object/action IDs, and safe notes.
 *
 * Rules:
 *   - Do not store sensitive raw user answers.
 *   - If file is missing, start empty.
 *   - If file is corrupt, back it up with .corrupt.<timestamp>.json and start fresh.
 *   - Do not let corrupt feedback crash the runner.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type {
  LivingActionFeedback,
  LivingActionFeedbackActor,
  LivingActionFeedbackSource,
  LivingActionFeedbackStatus,
  LivingActionFeedbackStore,
} from "@/lib/living-intelligence/living-action-feedback-contract";
import {
  LIVING_ACTION_FEEDBACK_REPORT_PATH,
  LIVING_ACTION_FEEDBACK_STORE_VERSION,
} from "@/lib/living-intelligence/living-action-feedback-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

function readJson<T>(relPath: string): T | null {
  try {
    const abs = path.join(ROOT, relPath);
    if (!fs.existsSync(abs)) return null;
    return JSON.parse(fs.readFileSync(abs, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(relPath: string, data: unknown): void {
  const abs = path.join(ROOT, relPath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
}

function backupCorrupt(relPath: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = relPath.replace(/\.json$/, `.corrupt.${timestamp}.json`);
  try {
    const abs = path.join(ROOT, relPath);
    if (fs.existsSync(abs)) {
      fs.renameSync(abs, path.join(ROOT, backupPath));
      console.error(`[living-action-feedback] Corrupt store backed up to ${backupPath}`);
    }
  } catch {
    // Best-effort backup.
  }
}

// ─── Store operations ────────────────────────────────────────────────────────

/**
 * Load the feedback store from disk. Returns an empty store if missing or corrupt.
 */
export function loadFeedbackStore(): LivingActionFeedbackStore {
  const raw = readJson<LivingActionFeedbackStore>(LIVING_ACTION_FEEDBACK_REPORT_PATH);

  if (!raw || typeof raw !== "object" || !Array.isArray(raw.feedback)) {
    return {
      version: LIVING_ACTION_FEEDBACK_STORE_VERSION,
      lastRunAt: new Date().toISOString(),
      feedback: [],
    };
  }

  return {
    version: raw.version ?? LIVING_ACTION_FEEDBACK_STORE_VERSION,
    lastRunAt: raw.lastRunAt ?? new Date().toISOString(),
    feedback: raw.feedback.filter(
      (f): f is LivingActionFeedback =>
        typeof f === "object" &&
        typeof f.id === "string" &&
        typeof f.objectId === "string",
    ),
  };
}

/**
 * Save the feedback store to disk.
 */
export function saveFeedbackStore(store: LivingActionFeedbackStore): void {
  store.lastRunAt = new Date().toISOString();
  writeJson(LIVING_ACTION_FEEDBACK_REPORT_PATH, store);
}

/**
 * Create a new feedback record.
 */
export function createFeedback(params: {
  objectId: string;
  actionId: string;
  domain: string;
  subjectType: string;
  actor: LivingActionFeedbackActor;
  label: string;
  expectedOutcome: string;
  evidenceRequired?: boolean;
  source?: LivingActionFeedbackSource;
}): LivingActionFeedback {
  const now = new Date().toISOString();
  return {
    id: `fb-${crypto.createHash("sha256").update(`${params.objectId}:${params.actionId}:${now}`).digest("hex").slice(0, 12)}`,
    objectId: params.objectId,
    actionId: params.actionId,
    domain: params.domain,
    subjectType: params.subjectType,
    recommendedAt: now,
    lastUpdatedAt: now,
    status: "recommended",
    actor: params.actor,
    label: params.label,
    expectedOutcome: params.expectedOutcome,
    evidenceRequired: params.evidenceRequired ?? false,
    evidenceSubmitted: false,
    evidenceVerified: false,
    resolutionClaimed: false,
    resolutionVerified: false,
    source: params.source ?? "living_runner",
  };
}

/**
 * Upsert a feedback record: update existing by (objectId, actionId) or insert new.
 */
export function upsertFeedback(
  store: LivingActionFeedbackStore,
  params: {
    objectId: string;
    actionId: string;
    domain: string;
    subjectType: string;
    actor: LivingActionFeedbackActor;
    label: string;
    expectedOutcome: string;
    evidenceRequired?: boolean;
    source?: LivingActionFeedbackSource;
    status?: LivingActionFeedbackStatus;
  },
): LivingActionFeedback {
  const now = new Date().toISOString();
  const existing = store.feedback.find(
    (f) => f.objectId === params.objectId && f.actionId === params.actionId,
  );

  if (existing) {
    existing.lastUpdatedAt = now;
    if (params.status) existing.status = params.status;
    if (params.actor) existing.actor = params.actor;
    return existing;
  }

  const record = createFeedback(params);
  if (params.status) record.status = params.status;
  store.feedback.push(record);
  return record;
}

/**
 * Update the status of a feedback record.
 */
export function updateFeedbackStatus(
  store: LivingActionFeedbackStore,
  feedbackId: string,
  status: LivingActionFeedbackStatus,
  notes?: string,
): LivingActionFeedback | null {
  const record = store.feedback.find((f) => f.id === feedbackId);
  if (!record) return null;

  record.lastUpdatedAt = new Date().toISOString();
  record.status = status;
  if (notes !== undefined) record.notes = notes;
  return record;
}

/**
 * Get feedback records for a specific object.
 */
export function getFeedbackForObject(
  store: LivingActionFeedbackStore,
  objectId: string,
): LivingActionFeedback[] {
  return store.feedback.filter((f) => f.objectId === objectId);
}

/**
 * Get feedback records with a specific status.
 */
export function getFeedbackByStatus(
  store: LivingActionFeedbackStore,
  status: LivingActionFeedbackStatus,
): LivingActionFeedback[] {
  return store.feedback.filter((f) => f.status === status);
}

/**
 * Ensure the store file is valid. If corrupt, back it up and start fresh.
 */
export function ensureValidStore(): LivingActionFeedbackStore {
  try {
    const abs = path.join(ROOT, LIVING_ACTION_FEEDBACK_REPORT_PATH);
    if (!fs.existsSync(abs)) {
      return {
        version: LIVING_ACTION_FEEDBACK_STORE_VERSION,
        lastRunAt: new Date().toISOString(),
        feedback: [],
      };
    }
    const content = fs.readFileSync(abs, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.feedback)) {
      backupCorrupt(LIVING_ACTION_FEEDBACK_REPORT_PATH);
      return {
        version: LIVING_ACTION_FEEDBACK_STORE_VERSION,
        lastRunAt: new Date().toISOString(),
        feedback: [],
      };
    }
    return parsed as LivingActionFeedbackStore;
  } catch {
    backupCorrupt(LIVING_ACTION_FEEDBACK_REPORT_PATH);
    return {
      version: LIVING_ACTION_FEEDBACK_STORE_VERSION,
      lastRunAt: new Date().toISOString(),
      feedback: [],
    };
  }
}
