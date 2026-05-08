import {
  detectCollisions,
  type CollisionReport,
} from "@/lib/constitution/multi-user-collision";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type CollisionSummaryType =
  | "AUTHORITY_PERCEPTION_GAP"
  | "BLOCKER_CONTRADICTION"
  | "COST_DIVERGENCE"
  | "CONDITION_CLASS_MISMATCH";

export type CollisionSummary = {
  collisionCount: number;
  primaryCollision?: string;
  collisionTypes: CollisionSummaryType[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sponsorSafeSummary: string;
  operatorNotes?: string;
};

const TYPE_LABELS: Record<CollisionSummaryType, string> = {
  AUTHORITY_PERCEPTION_GAP: "Authority perception gap",
  BLOCKER_CONTRADICTION: "Blocker contradiction",
  COST_DIVERGENCE: "Cost divergence",
  CONDITION_CLASS_MISMATCH: "Condition class mismatch",
};

const TYPE_MAP = {
  authority_perception_gap: "AUTHORITY_PERCEPTION_GAP",
  blocker_contradiction: "BLOCKER_CONTRADICTION",
  cost_estimate_divergence: "COST_DIVERGENCE",
  condition_class_mismatch: "CONDITION_CLASS_MISMATCH",
} as const;

const SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function toSummaryType(value: keyof typeof TYPE_MAP): CollisionSummaryType {
  return TYPE_MAP[value];
}

function toSummarySeverity(value: string): CollisionSummary["severity"] {
  switch (value) {
    case "critical":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

function highestSeverity(values: CollisionSummary["severity"][]): CollisionSummary["severity"] {
  return values.reduce<CollisionSummary["severity"]>(
    (current, candidate) =>
      SEVERITY_ORDER.indexOf(candidate) > SEVERITY_ORDER.indexOf(current)
        ? candidate
        : current,
    "LOW",
  );
}

function buildSponsorSafeSummary(summary: CollisionSummary): string {
  if (summary.collisionCount === 0) {
    return "No material divergence detected across the current organisation evidence set.";
  }

  const collisionLabel = summary.primaryCollision
    ? `${summary.primaryCollision.toLowerCase()}`
    : "cross-respondent divergence";
  return `${summary.collisionCount} divergence signal(s) detected. Primary issue: ${collisionLabel}. Sponsor view remains aggregated until intervention review is commissioned.`;
}

export function summarizeCollisionReport(report: CollisionReport): CollisionSummary {
  const types = [...new Set(report.collisions.map((collision) => toSummaryType(collision.type)))];
  const severity = highestSeverity(
    report.collisions.map((collision) => toSummarySeverity(collision.severity)),
  );
  const primaryCollision = types[0] ? TYPE_LABELS[types[0]] : undefined;

  const summary: CollisionSummary = {
    collisionCount: report.collisions.length,
    primaryCollision,
    collisionTypes: types,
    severity,
    sponsorSafeSummary: "",
    operatorNotes:
      report.collisions.length > 0
        ? `${report.summary} Collision types: ${types.map((type) => TYPE_LABELS[type]).join(", ")}.`
        : report.summary,
  };

  summary.sponsorSafeSummary = buildSponsorSafeSummary(summary);
  return summary;
}

export function buildCollisionSummaryFromSpines(
  spines: IntelligenceSpine[],
  organisationKey: string,
): CollisionSummary {
  return summarizeCollisionReport(detectCollisions(spines, organisationKey));
}
