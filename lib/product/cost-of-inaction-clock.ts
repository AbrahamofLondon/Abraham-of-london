export type CostOfInactionClockInput = {
  monthlyCostEstimate?: number;
  dailyCostEstimate?: number;
  startedAt: Date | string;
  now?: Date | string;
};

export type CostOfInactionClockResult = {
  accumulatedCost: number;
  daysElapsed: number;
  basis: "MONTHLY" | "DAILY" | "UNAVAILABLE";
  explanation: string;
};

function toDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function roundMoney(value: number): number {
  return Math.max(0, Math.round(value));
}

export function calculateCostOfInactionClock(
  input: CostOfInactionClockInput,
): CostOfInactionClockResult {
  const startedAt = toDate(input.startedAt);
  const now = toDate(input.now ?? new Date());

  if (!startedAt || !now) {
    return {
      accumulatedCost: 0,
      daysElapsed: 0,
      basis: "UNAVAILABLE",
      explanation: "Cost clock unavailable because the decision timing record is incomplete.",
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
  const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  if (typeof input.dailyCostEstimate === "number" && Number.isFinite(input.dailyCostEstimate) && input.dailyCostEstimate > 0) {
    const accumulatedCost = roundMoney(input.dailyCostEstimate * daysElapsed);
    return {
      accumulatedCost,
      daysElapsed,
      basis: "DAILY",
      explanation: `Estimated using a daily cost basis of ${roundMoney(input.dailyCostEstimate)} over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"}.`,
    };
  }

  if (typeof input.monthlyCostEstimate === "number" && Number.isFinite(input.monthlyCostEstimate) && input.monthlyCostEstimate > 0) {
    const dailyEquivalent = input.monthlyCostEstimate / 30;
    const accumulatedCost = roundMoney(dailyEquivalent * daysElapsed);
    return {
      accumulatedCost,
      daysElapsed,
      basis: "MONTHLY",
      explanation: `Estimated from a monthly cost basis of ${roundMoney(input.monthlyCostEstimate)} using a conservative 30-day month over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"}.`,
    };
  }

  return {
    accumulatedCost: 0,
    daysElapsed,
    basis: "UNAVAILABLE",
    explanation: "Cost clock unavailable because no verified cost basis is present for this case.",
  };
}
