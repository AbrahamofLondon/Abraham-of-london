import { stableInputHash } from "@/lib/diagnostics/runtime-validation";

type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

const submissionCache = new Map<string, CacheRecord<unknown>>();
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function createSubmissionKey(input: {
  scope: string;
  journeyId?: string | null;
  stage: string;
  payload: unknown;
}): string {
  const scopedJourney = input.journeyId?.trim() || "ad_hoc";
  return [
    input.scope.trim().toLowerCase() || "anonymous",
    scopedJourney,
    input.stage.trim().toLowerCase(),
    stableInputHash(input.payload),
  ].join(":");
}

export function getCachedSubmissionResult<T>(key: string): T | null {
  const cached = submissionCache.get(key);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    submissionCache.delete(key);
    return null;
  }
  return cached.value as T;
}

export function setCachedSubmissionResult<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): T {
  submissionCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
