import type { RetainedCadenceState } from "@/lib/product/retained-cadence-contract";

export type RetainedCadenceTimelineStatus =
  | "DUE"
  | "OVERDUE"
  | "UPCOMING"
  | "COMPLETED"
  | "SKIPPED"
  | "ESCALATED"
  | "UNKNOWN";

export type RetainedCadenceTimelineSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RetainedCadenceTimelineItem = {
  id: string;
  accountId?: string | null;
  organisationId?: string | null;
  label: string;
  dueAt?: string | null;
  completedAt?: string | null;
  status: RetainedCadenceTimelineStatus;
  severity: RetainedCadenceTimelineSeverity;
  daysOffset?: number | null;
  cadenceState: string;
  href?: string;
};

export type RetainedCadenceTimelineGroup = {
  band: string;
  description: string;
  items: RetainedCadenceTimelineItem[];
};

type QueueItem = {
  cycleId?: string | null;
  accountId?: string | null;
  organisationId?: string | null;
  organisationLabel: string;
  scheduledFor?: string | null;
  completedAt?: string | null;
  cadenceState: RetainedCadenceState;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function resolveStatus(state: RetainedCadenceState, scheduledFor: string | null | undefined, now: Date): RetainedCadenceTimelineStatus {
  switch (state) {
    case "OVERDUE":
    case "CADENCE_BROKEN":
      return "OVERDUE";
    case "DUE_SOON":
    case "REVIEW_DUE":
    case "REVIEW_IN_PROGRESS":
    case "MANUAL_OPERATOR_REVIEW":
      return "DUE";
    case "SCHEDULED":
    case "CONFIGURED": {
      if (!scheduledFor) return "UPCOMING";
      const due = new Date(scheduledFor);
      return due > now ? "UPCOMING" : "DUE";
    }
    case "COMPLETED":
    case "REVIEW_COMPLETED":
      return "COMPLETED";
    case "SKIPPED_WITH_REASON":
    case "REVIEW_SKIPPED":
      return "SKIPPED";
    case "ESCALATED":
      return "ESCALATED";
    case "NOT_CONFIGURED":
      return "UNKNOWN";
    default:
      return "UNKNOWN";
  }
}

function resolveSeverity(status: RetainedCadenceTimelineStatus, cadenceState: RetainedCadenceState): RetainedCadenceTimelineSeverity {
  switch (status) {
    case "OVERDUE":
      return cadenceState === "CADENCE_BROKEN" ? "CRITICAL" : "CRITICAL";
    case "ESCALATED":
      return "CRITICAL";
    case "DUE":
      return "HIGH";
    case "SKIPPED":
      return "MEDIUM";
    case "UNKNOWN":
      return "MEDIUM";
    case "UPCOMING":
      return "LOW";
    case "COMPLETED":
      return "LOW";
  }
}

function daysOffset(scheduledFor: string | null | undefined, now: Date): number | null {
  if (!scheduledFor) return null;
  const due = new Date(scheduledFor);
  return Math.round((due.getTime() - now.getTime()) / MS_PER_DAY);
}

const SEVERITY_ORDER: Record<RetainedCadenceTimelineSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const STATUS_ORDER: Record<RetainedCadenceTimelineStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  ESCALATED: 2,
  SKIPPED: 3,
  UPCOMING: 4,
  UNKNOWN: 5,
  COMPLETED: 6,
};

export function buildCadenceTimeline(
  items: QueueItem[],
  now?: Date,
): RetainedCadenceTimelineItem[] {
  const reference = now ?? new Date();

  const mapped: RetainedCadenceTimelineItem[] = items.map((item) => {
    const status = resolveStatus(item.cadenceState, item.scheduledFor, reference);
    const severity = resolveSeverity(status, item.cadenceState);
    const offset = daysOffset(item.scheduledFor, reference);
    const id = item.cycleId ?? `no-cycle-${item.accountId ?? item.organisationId ?? Math.random()}`;

    return {
      id,
      accountId: item.accountId,
      organisationId: item.organisationId,
      label: item.organisationLabel,
      dueAt: item.scheduledFor ?? null,
      completedAt: item.completedAt ?? null,
      status,
      severity,
      daysOffset: offset,
      cadenceState: item.cadenceState,
    };
  });

  mapped.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    // Within same band, most overdue first (most negative daysOffset first)
    const aOffset = a.daysOffset ?? 0;
    const bOffset = b.daysOffset ?? 0;
    return aOffset - bOffset;
  });

  return mapped;
}

export function groupCadenceTimeline(items: RetainedCadenceTimelineItem[]): RetainedCadenceTimelineGroup[] {
  const overdue = items.filter((i) => i.status === "OVERDUE");
  const due = items.filter((i) => i.status === "DUE");
  const escalated = items.filter((i) => i.status === "ESCALATED");
  const upcoming = items.filter((i) => i.status === "UPCOMING");
  const completed = items.filter((i) => i.status === "COMPLETED");
  const skipped = items.filter((i) => i.status === "SKIPPED");
  const unknown = items.filter((i) => i.status === "UNKNOWN");

  return [
    {
      band: "Overdue",
      description: "Cycles that have passed their due date without completion.",
      items: overdue,
    },
    {
      band: "Due now",
      description: "Cycles currently due or in progress.",
      items: due,
    },
    {
      band: "Escalated",
      description: "Cycles that have been escalated for operator attention.",
      items: escalated,
    },
    {
      band: "Upcoming",
      description: "Cycles scheduled for a future date.",
      items: upcoming,
    },
    {
      band: "Completed recently",
      description: "Cycles marked complete.",
      items: completed,
    },
    {
      band: "Skipped",
      description: "Cycles skipped with a recorded reason.",
      items: skipped,
    },
    {
      band: "Not configured",
      description: "Retained scopes with no cadence cycle set up.",
      items: unknown,
    },
  ].filter((group) => group.items.length > 0);
}
