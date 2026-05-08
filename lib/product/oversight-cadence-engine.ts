import type {
  OversightCadenceFrequency,
  OversightCadenceInput,
  OversightCadenceState,
} from "@/lib/product/oversight-cadence-contract";

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function defaultFrequency(tier: OversightCadenceInput["tier"]): OversightCadenceFrequency {
  switch (tier) {
    case "INSTITUTIONAL_COMMAND":
      return "WEEKLY";
    case "EXECUTIVE_OVERSIGHT":
      return "BIWEEKLY";
    default:
      return "MONTHLY";
  }
}

function cadenceDays(frequency: OversightCadenceFrequency): number {
  switch (frequency) {
    case "WEEKLY":
      return 7;
    case "BIWEEKLY":
      return 14;
    default:
      return 30;
  }
}

export function deriveOversightCadenceState(input: OversightCadenceInput): OversightCadenceState {
  const now = toDate(input.now) ?? new Date();
  const frequency = input.frequency ?? defaultFrequency(input.tier);
  const cycle = input.latestArchivedCycle;
  const basis: string[] = [];

  if (!cycle) {
    return {
      status: "FIRST_CYCLE_PENDING",
      health: "WATCH",
      frequency,
      reviewOverdue: false,
      deliveryOverdue: false,
      missedCycleRisk: false,
      basis: ["No archived oversight cycle exists yet."],
      explanation: "The retained relationship has no archived cycle yet. First-cycle generation and review remain due.",
    };
  }

  const periodEnd = toDate(cycle.periodEnd) ?? now;
  const createdAt = toDate(cycle.createdAt) ?? periodEnd;
  const approvedAt = toDate(cycle.approvedAt);
  const deliveredAt = toDate(cycle.deliveredAt)
    ?? toDate(input.latestDeliveryEvent?.timestamp);
  const reviewDecisionAt = toDate(input.reviewDecision?.createdAt) ?? approvedAt;

  const currentCycleDueDate = addDays(periodEnd, cadenceDays(frequency));
  const reviewDueDate = addDays(createdAt, 3);
  const deliveryDueDate = reviewDecisionAt ? addDays(reviewDecisionAt, 2) : addDays(createdAt, 5);
  const daysUntilDue = daysBetween(currentCycleDueDate, now);
  const reviewOverdue = !reviewDecisionAt && now > reviewDueDate;
  const deliveryOverdue = Boolean(reviewDecisionAt && !deliveredAt && now > deliveryDueDate);
  const missedCycleRisk = now > addDays(currentCycleDueDate, 3);

  basis.push(`Frequency ${frequency.toLowerCase()} derived from retainer tier ${input.tier}.`);
  basis.push(`Current cycle due date anchored to prior period end ${periodEnd.toISOString().slice(0, 10)}.`);
  if (reviewDecisionAt) {
    basis.push(`Latest operator decision recorded at ${reviewDecisionAt.toISOString()}.`);
  }
  if (deliveredAt) {
    basis.push(`Latest delivery event recorded at ${deliveredAt.toISOString()}.`);
  }

  if (!reviewDecisionAt) {
    return {
      status: reviewOverdue ? "REVIEW_OVERDUE" : "REVIEW_DUE",
      health: reviewOverdue ? "AT_RISK" : "WATCH",
      frequency,
      currentCycleDueDate: currentCycleDueDate.toISOString(),
      nextCycleDueDate: currentCycleDueDate.toISOString(),
      reviewOverdue,
      deliveryOverdue: false,
      missedCycleRisk,
      daysUntilDue,
      basis,
      explanation: reviewOverdue
        ? "A cycle exists but no review decision has been recorded within the review window."
        : "A cycle exists and still requires operator review before delivery can proceed.",
    };
  }

  if (!deliveredAt) {
    return {
      status: deliveryOverdue ? "DELIVERY_OVERDUE" : "DELIVERY_DUE",
      health: deliveryOverdue ? "AT_RISK" : "WATCH",
      frequency,
      currentCycleDueDate: currentCycleDueDate.toISOString(),
      nextCycleDueDate: currentCycleDueDate.toISOString(),
      reviewOverdue: false,
      deliveryOverdue,
      missedCycleRisk,
      daysUntilDue,
      basis,
      explanation: deliveryOverdue
        ? "The brief has been reviewed but no delivery event has been recorded within the expected delivery window."
        : "The brief has been reviewed and is awaiting controlled client delivery.",
    };
  }

  if (missedCycleRisk) {
    return {
      status: daysUntilDue <= -10 ? "CADENCE_BROKEN" : "CYCLE_MISSED",
      health: daysUntilDue <= -10 ? "BROKEN" : "AT_RISK",
      frequency,
      currentCycleDueDate: currentCycleDueDate.toISOString(),
      nextCycleDueDate: currentCycleDueDate.toISOString(),
      reviewOverdue: false,
      deliveryOverdue: false,
      missedCycleRisk: true,
      daysUntilDue,
      basis,
      explanation: daysUntilDue <= -10
        ? "The expected next oversight cycle is materially overdue. Cadence is broken."
        : "The expected next oversight cycle has slipped beyond the normal cadence window.",
    };
  }

  return {
    status: "ON_TRACK",
    health: "HEALTHY",
    frequency,
    currentCycleDueDate: currentCycleDueDate.toISOString(),
    nextCycleDueDate: currentCycleDueDate.toISOString(),
    reviewOverdue: false,
    deliveryOverdue: false,
    missedCycleRisk: false,
    daysUntilDue,
    basis,
    explanation: "The latest oversight cycle was reviewed and delivered within the expected cadence window.",
  };
}
