/**
 * lib/living-intelligence/living-state-memory.ts
 *
 * Memory comparison helpers for the Living State Object layer.
 *
 * The engine is stateless per run; durable continuity comes from a small JSON
 * store (keyed by object id) that records when each object was first/last seen,
 * its previous stage, and how many times it has recurred. From the prior record
 * plus the current object we derive:
 *
 *   - recurrence   (seen before → count increments)
 *   - regression   (stage moved backwards in the lifecycle)
 *   - resolution   (was blocked/failed last run, no longer is)
 *
 * This file does NOT do I/O. The runner reads/writes the JSON; these helpers are
 * pure so they can be unit-tested and reused on both server and script sides.
 */

import type {
  LivingStateMemory,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Lifecycle ordering (for regression detection) ───────────────────────────
//
// Monotonic "progress" ranking. Terminal failure states (blocked/failed) are
// ranked low so that moving INTO them from a higher stage reads as regression.

const STAGE_ORDER: Record<LivingStateStage, number> = {
  failed: 0,
  blocked: 1,
  created: 2,
  started: 3,
  submitted: 4,
  paid: 5,
  intake_started: 6,
  intake_complete: 7,
  processing: 8,
  awaiting_evidence: 9,
  awaiting_consent: 10,
  awaiting_verification: 11,
  draft_generated: 12,
  artifact_incomplete: 13,
  artifact_generated: 14,
  awaiting_review: 15,
  ready_for_review: 16,
  approved: 17,
  published: 18,
  delivered: 19,
  archived: 20,
};

function stageRank(stage: LivingStateStage): number {
  return STAGE_ORDER[stage] ?? 0;
}

// ─── Persisted store shape ───────────────────────────────────────────────────

export type LivingStateMemoryRecord = {
  firstSeen: string;
  lastSeen: string;
  recurrenceCount: number;
  lastStage: LivingStateStage;
  lastWasBlocked: boolean;
};

export type LivingStateMemoryStore = {
  version: number;
  updatedAt: string;
  /** Keyed by LivingStateObject.id */
  objects: Record<string, LivingStateMemoryRecord>;
};

export const LIVING_STATE_MEMORY_VERSION = 1;

export function emptyMemoryStore(): LivingStateMemoryStore {
  return {
    version: LIVING_STATE_MEMORY_VERSION,
    updatedAt: new Date().toISOString(),
    objects: {},
  };
}

/**
 * Coerce an unknown blob (e.g. parsed JSON from disk) into a valid store.
 * Tolerant: anything malformed degrades to an empty store rather than throwing.
 */
export function coerceMemoryStore(raw: unknown): LivingStateMemoryStore {
  if (!raw || typeof raw !== "object") return emptyMemoryStore();
  const candidate = raw as Partial<LivingStateMemoryStore>;
  const objects =
    candidate.objects && typeof candidate.objects === "object"
      ? (candidate.objects as Record<string, LivingStateMemoryRecord>)
      : {};
  return {
    version:
      typeof candidate.version === "number"
        ? candidate.version
        : LIVING_STATE_MEMORY_VERSION,
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt
        : new Date().toISOString(),
    objects,
  };
}

function objectIsBlocked(object: LivingStateObject): boolean {
  if (object.currentStage === "blocked" || object.currentStage === "failed") {
    return true;
  }
  return object.blockers.some((blocker) => blocker.severity === "blocker");
}

/**
 * Derive the LivingStateMemory for a single object given the prior store.
 * Pure: returns the memory view AND the next record to persist. The caller
 * decides when to commit the record back to the store.
 */
export function deriveMemory(
  object: LivingStateObject,
  store: LivingStateMemoryStore,
  now: string = new Date().toISOString(),
): { memory: LivingStateMemory; nextRecord: LivingStateMemoryRecord } {
  const prior = store.objects[object.id];
  const isBlocked = objectIsBlocked(object);

  if (!prior) {
    const memory: LivingStateMemory = {
      firstSeen: now,
      lastSeen: now,
      recurrenceCount: 1,
      currentStage: object.currentStage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    };
    return {
      memory,
      nextRecord: {
        firstSeen: now,
        lastSeen: now,
        recurrenceCount: 1,
        lastStage: object.currentStage,
        lastWasBlocked: isBlocked,
      },
    };
  }

  const regressionDetected =
    stageRank(object.currentStage) < stageRank(prior.lastStage);
  const resolvedSinceLastRun = prior.lastWasBlocked && !isBlocked;

  const memory: LivingStateMemory = {
    firstSeen: prior.firstSeen,
    lastSeen: now,
    recurrenceCount: prior.recurrenceCount + 1,
    previousStage: prior.lastStage,
    currentStage: object.currentStage,
    regressionDetected,
    resolvedSinceLastRun,
  };

  return {
    memory,
    nextRecord: {
      firstSeen: prior.firstSeen,
      lastSeen: now,
      recurrenceCount: prior.recurrenceCount + 1,
      lastStage: object.currentStage,
      lastWasBlocked: isBlocked,
    },
  };
}

/**
 * Apply memory to a batch of objects and return the updated objects plus the
 * next store to persist. Objects not seen this run are retained in the store so
 * that recurrence survives across runs.
 */
export function applyMemoryToBatch(
  objects: LivingStateObject[],
  store: LivingStateMemoryStore,
  now: string = new Date().toISOString(),
): { objects: LivingStateObject[]; store: LivingStateMemoryStore } {
  const nextObjects: Record<string, LivingStateMemoryRecord> = {
    ...store.objects,
  };

  const updated = objects.map((object) => {
    const { memory, nextRecord } = deriveMemory(object, store, now);
    nextObjects[object.id] = nextRecord;
    return { ...object, memory };
  });

  return {
    objects: updated,
    store: {
      version: LIVING_STATE_MEMORY_VERSION,
      updatedAt: now,
      objects: nextObjects,
    },
  };
}

/** Aggregate memory deltas across a batch, for the view model / summary. */
export function summariseMemory(objects: LivingStateObject[]): {
  newIssues: number;
  repeatedIssues: number;
  resolvedIssues: number;
  regressions: number;
  rememberedObjects: number;
} {
  let newIssues = 0;
  let repeatedIssues = 0;
  let resolvedIssues = 0;
  let regressions = 0;

  for (const object of objects) {
    if (object.memory.recurrenceCount <= 1) newIssues += 1;
    else repeatedIssues += 1;
    if (object.memory.resolvedSinceLastRun) resolvedIssues += 1;
    if (object.memory.regressionDetected) regressions += 1;
  }

  return {
    newIssues,
    repeatedIssues,
    resolvedIssues,
    regressions,
    rememberedObjects: objects.length,
  };
}
