/**
 * lib/product/strategic-option-register.ts — Strategic Option Register.
 *
 * Tracks strategic options that are available, closing, or already closed.
 * An option is a course of action that is available now but will not be
 * available forever. Options decay through inaction.
 *
 * Sources: decision objects (constraints, cost-of-delay), execution state,
 * outcome verification, external market signals.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type OptionStatus =
  | "OPEN"
  | "CLOSING"
  | "CLOSED"
  | "EXERCISED"
  | "EXPIRED";

export type StrategicOption = {
  id: string;
  caseId: string;
  label: string;
  description: string;
  status: OptionStatus;
  expiresAt?: string | null;
  estimatedValue?: number | null;
  costIfLost?: number | null;
  dependency?: string | null;
  evidenceBasis: string;
};

export type StrategicOptionRegister = {
  options: StrategicOption[];
  openCount: number;
  closingCount: number;
  closedCount: number;
  exercisedCount: number;
  totalValueAtRisk: number;
  summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

export type StrategicOptionInput = {
  caseId: string;
  label: string;
  description: string;
  status: OptionStatus;
  expiresAt?: string | null;
  estimatedValue?: number | null;
  costIfLost?: number | null;
  dependency?: string | null;
  evidenceBasis: string;
};

/**
 * Assemble a Strategic Option Register from provided option entries.
 * Does not invent options — only assembles from evidence.
 */
export function assembleStrategicOptionRegister(
  inputs: StrategicOptionInput[],
): StrategicOptionRegister {
  const options: StrategicOption[] = inputs.map((o, i) => ({
    id: `opt_${i}_${Date.now().toString(36)}`,
    ...o,
  }));

  const openCount = options.filter((o) => o.status === "OPEN").length;
  const closingCount = options.filter((o) => o.status === "CLOSING").length;
  const closedCount = options.filter((o) => o.status === "CLOSED" || o.status === "EXPIRED").length;
  const exercisedCount = options.filter((o) => o.status === "EXERCISED").length;

  const totalValueAtRisk = options
    .filter((o) => o.status === "OPEN" || o.status === "CLOSING")
    .reduce((sum, o) => sum + (o.estimatedValue ?? 0), 0);

  return {
    options,
    openCount,
    closingCount,
    closedCount,
    exercisedCount,
    totalValueAtRisk,
    summary: options.length === 0
      ? "No strategic options recorded."
      : `${options.length} strategic option${options.length !== 1 ? "s" : ""} tracked. ${openCount} open, ${closingCount} closing, ${closedCount} closed. Value at risk: £${totalValueAtRisk.toLocaleString()}.`,
  };
}
