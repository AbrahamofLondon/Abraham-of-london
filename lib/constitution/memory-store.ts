import type {
  InstitutionalMemoryRecord,
  RecommendationMemoryRecord,
} from "./memory-types";

const caseStore = new Map<string, InstitutionalMemoryRecord>();
const recommendationStore = new Map<string, RecommendationMemoryRecord[]>();

function sortByUpdatedAtDesc<T extends { updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = typeof a.updatedAt === "string" ? a.updatedAt : "";
    const bTime = typeof b.updatedAt === "string" ? b.updatedAt : "";
    return bTime.localeCompare(aTime);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

function findCaseMemoryByCaseKey(caseKey: string): InstitutionalMemoryRecord | null {
  const normalized = String(caseKey || "").trim();
  if (!normalized) return null;

  for (const record of caseStore.values()) {
    if (record.caseKey === normalized) return record;
  }

  return null;
}

/**
 * Read by caseKey — this is the business key used by the rest of the system.
 */
export function getCaseMemory(caseKey: string): InstitutionalMemoryRecord | null {
  return findCaseMemoryByCaseKey(caseKey);
}

/**
 * Read by internal record id — useful for admin / tooling.
 */
export function getCaseMemoryById(id: string): InstitutionalMemoryRecord | null {
  const normalized = String(id || "").trim();
  if (!normalized) return null;
  return caseStore.get(normalized) ?? null;
}

/**
 * Save a fully-formed memory record.
 * Stored by record.id, but logically retrieved by caseKey.
 */
export function saveCaseMemory(
  record: InstitutionalMemoryRecord,
): InstitutionalMemoryRecord {
  caseStore.set(record.id, record);
  return record;
}

/**
 * Upsert by caseKey — this should be the main write path used by the system.
 */
export function upsertCaseMemory(
  caseKey: string,
  updater: (
    existing: InstitutionalMemoryRecord | null,
  ) => InstitutionalMemoryRecord,
): InstitutionalMemoryRecord {
  const existing = findCaseMemoryByCaseKey(caseKey);
  const next = updater(existing);

  if (!next.id || !next.caseKey) {
    throw new Error(
      "[MEMORY_STORE] upsertCaseMemory requires updater to return a record with id and caseKey",
    );
  }

  caseStore.set(next.id, {
    ...next,
    updatedAt: next.updatedAt || nowIso(),
  });

  return caseStore.get(next.id)!;
}

/**
 * Patch-style update by caseKey.
 * This is the safest place to write execution outcomes, monetisation flags, mandate ids, etc.
 */
export function patchCaseMemory(
  caseKey: string,
  patch: Partial<InstitutionalMemoryRecord>,
): InstitutionalMemoryRecord | null {
  const existing = findCaseMemoryByCaseKey(caseKey);
  if (!existing) return null;

  const next: InstitutionalMemoryRecord = {
    ...existing,
    ...patch,
    id: patch.id || existing.id,
    caseKey: patch.caseKey || existing.caseKey,
    updatedAt: nowIso(),
  };

  caseStore.set(next.id, next);
  return next;
}

/**
 * Delete by caseKey.
 */
export function deleteCaseMemory(caseKey: string): boolean {
  const existing = findCaseMemoryByCaseKey(caseKey);
  if (!existing) return false;
  return caseStore.delete(existing.id);
}

export function listCaseMemories(): InstitutionalMemoryRecord[] {
  return sortByUpdatedAtDesc(Array.from(caseStore.values()));
}

export function saveRecommendationMemory(
  record: RecommendationMemoryRecord,
): RecommendationMemoryRecord {
  const existing = recommendationStore.get(record.caseKey) ?? [];
  const filtered = existing.filter((x) => x.id !== record.id);

  filtered.push(record);
  recommendationStore.set(record.caseKey, filtered);

  return record;
}

export function saveRecommendationMemories(
  caseKey: string,
  records: RecommendationMemoryRecord[],
): RecommendationMemoryRecord[] {
  const existing = recommendationStore.get(caseKey) ?? [];
  const merged = new Map<string, RecommendationMemoryRecord>();

  for (const item of existing) {
    merged.set(item.id, item);
  }

  for (const item of records) {
    merged.set(item.id, item);
  }

  const next = Array.from(merged.values());
  recommendationStore.set(caseKey, next);

  return next;
}

export function listRecommendationMemory(
  caseKey: string,
): RecommendationMemoryRecord[] {
  return recommendationStore.get(caseKey) ?? [];
}

export function clearRecommendationMemory(caseKey: string): void {
  recommendationStore.delete(caseKey);
}

/**
 * Purpose-built helper for execution / monetisation / mandate state.
 * Use this instead of scattering custom writes everywhere.
 */
export function updateExecutionMemory(
  caseKey: string,
  input: {
    lastMandateId?: string | null;
    executionStatus?: string | null;
    monetised?: boolean;
    lastTribunalOutcome?: string | null;
    lastOperatorScore?: number | null;
    lastRoute?: string | null;
    metadata?: Record<string, unknown>;
  },
): InstitutionalMemoryRecord | null {
  const existing = findCaseMemoryByCaseKey(caseKey);
  if (!existing) return null;

  const existingMetadata =
    existing.metadata && typeof existing.metadata === "object"
      ? existing.metadata
      : {};

  return patchCaseMemory(caseKey, {
    metadata: {
      ...existingMetadata,
      ...(input.lastMandateId !== undefined
        ? { lastMandateId: input.lastMandateId }
        : {}),
      ...(input.executionStatus !== undefined
        ? { executionStatus: input.executionStatus }
        : {}),
      ...(input.monetised !== undefined ? { monetised: input.monetised } : {}),
      ...(input.lastTribunalOutcome !== undefined
        ? { lastTribunalOutcome: input.lastTribunalOutcome }
        : {}),
      ...(input.lastOperatorScore !== undefined
        ? { lastOperatorScore: input.lastOperatorScore }
        : {}),
      ...(input.lastRoute !== undefined ? { lastRoute: input.lastRoute } : {}),
      ...(input.metadata || {}),
    },
  });
}