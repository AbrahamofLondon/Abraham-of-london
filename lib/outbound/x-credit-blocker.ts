import type { XConnectionStatus } from "./x-types";

export const X_CREDIT_BLOCKED_ERROR_CODE = "X_CREDIT_BLOCKED";
export const X_CREDIT_BLOCKED_READINESS = "CREDIT_BLOCKED";
export const X_CREDIT_BLOCKED_NEXT_ACTION =
  "Add X API credits or verify billing for this developer app.";
export const X_CREDIT_BLOCKER_WINDOW_MS = 24 * 60 * 60 * 1000;

export type XCreditBlockerAttemptInput = {
  errorCode?: string | null;
  status?: string | null;
  dryRun?: boolean | null;
  createdAt?: Date | string | null;
};

function timestamp(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function findLatestLiveXPublishAttempt<T extends XCreditBlockerAttemptInput>(
  attempts: readonly T[],
): T | null {
  return attempts
    .filter((attempt) => !attempt.dryRun && (attempt.status === "failed" || attempt.status === "succeeded" || attempt.status === "blocked"))
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))[0] ?? null;
}

export function isActiveXCreditBlockerAttempt(
  latestAttempt: XCreditBlockerAttemptInput | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!latestAttempt) return false;
  if (latestAttempt.errorCode !== X_CREDIT_BLOCKED_ERROR_CODE) return false;
  if (latestAttempt.dryRun) return false;
  if (latestAttempt.status !== "failed" && latestAttempt.status !== "blocked") return false;
  const createdAt = timestamp(latestAttempt.createdAt);
  if (!createdAt) return true;
  return now.getTime() - createdAt <= X_CREDIT_BLOCKER_WINDOW_MS;
}

export function applyXCreditBlockerReadiness<T extends XConnectionStatus>(
  status: T,
  creditBlocked: boolean,
): T {
  if (!creditBlocked) return status;
  if (!status.connected || !status.scopes.includes("tweet.write")) return status;
  return {
    ...status,
    readiness: X_CREDIT_BLOCKED_READINESS,
  };
}
