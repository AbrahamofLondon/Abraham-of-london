/**
 * lib/product/case-status.ts
 *
 * Canonical governed-case lifecycle contract used by commercial limits
 * and post-trial downgrade handling.
 */

export type GovernedCaseStatus =
  | "ACTIVE"
  | "WATCHING"
  | "RESOLVED"
  | "ARCHIVED"
  | "READ_ONLY"
  | "INSTITUTIONAL_MEMORY";

export const FREE_TIER_COUNTED_CASE_STATUSES: GovernedCaseStatus[] = [
  "ACTIVE",
  "WATCHING",
];

const LEGACY_TO_CANONICAL_STATUS: Record<string, GovernedCaseStatus> = {
  active: "ACTIVE",
  open: "ACTIVE",
  under_intervention: "ACTIVE",
  monitoring: "WATCHING",
  watching: "WATCHING",
  resolved: "RESOLVED",
  archived: "ARCHIVED",
  read_only: "READ_ONLY",
  readonly: "READ_ONLY",
  institutional_intelligence: "INSTITUTIONAL_MEMORY",
  institutional_memory: "INSTITUTIONAL_MEMORY",
};

export function normaliseGovernedCaseStatus(status: string | null | undefined): GovernedCaseStatus {
  if (!status) return "ACTIVE";
  return LEGACY_TO_CANONICAL_STATUS[status.toLowerCase()] ?? "ACTIVE";
}

export function isCountedActiveCaseStatus(status: GovernedCaseStatus): boolean {
  return FREE_TIER_COUNTED_CASE_STATUSES.includes(status);
}

export function isSelectableAfterTrialExpiry(status: GovernedCaseStatus): boolean {
  return status !== "RESOLVED" && status !== "INSTITUTIONAL_MEMORY";
}

export function toPersistedJourneyStatus(status: GovernedCaseStatus): string {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "WATCHING":
      return "watching";
    case "RESOLVED":
      return "resolved";
    case "ARCHIVED":
      return "archived";
    case "READ_ONLY":
      return "read_only";
    case "INSTITUTIONAL_MEMORY":
      return "institutional_memory";
  }
}
