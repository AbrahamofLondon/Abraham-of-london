import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — public-safe only. No formulas, multipliers, or thresholds exposed.
// ─────────────────────────────────────────────────────────────────────────────

export type CostOfInactionInput = {
  state: "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  estimatedExposureGBP?: number | null;
  decisionWindow?: string | null;
  headcountAffected?: number | null;
  marketExposure?: string | null;
};

export type CostOfInactionPublic = {
  exposureBand: "low" | "moderate" | "high" | "critical" | "undisclosed";
  horizon30: string;
  horizon60: string;
  horizon90: string;
  executiveWarning: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE — produces language, not numbers
// ─────────────────────────────────────────────────────────────────────────────

export function computeCostOfInaction(input: CostOfInactionInput): CostOfInactionPublic {
  const { state, estimatedExposureGBP, headcountAffected, marketExposure } = input;

  // Exposure band — derived from state + financial anchor when available
  let exposureBand: CostOfInactionPublic["exposureBand"] = "undisclosed";
  if (estimatedExposureGBP != null && estimatedExposureGBP > 0) {
    if (estimatedExposureGBP >= 500_000 || state === "DISORDERED") exposureBand = "critical";
    else if (estimatedExposureGBP >= 100_000 || state === "MISALIGNED") exposureBand = "high";
    else if (estimatedExposureGBP >= 25_000 || state === "DRIFTING") exposureBand = "moderate";
    else exposureBand = "low";
  } else if (state === "DISORDERED") {
    exposureBand = "critical";
  } else if (state === "MISALIGNED") {
    exposureBand = "high";
  } else if (state === "DRIFTING") {
    exposureBand = "moderate";
  }

  // Horizon projections — language varies by state, not by formula
  const horizons = HORIZON_MAP[state] ?? HORIZON_MAP.DRIFTING!;

  // Executive warning — combines state, headcount, and market exposure
  const warningParts: string[] = [];

  if (state === "DISORDERED") {
    warningParts.push("The structural condition has crossed into disorder. Recovery cost increases with each decision cycle.");
  } else if (state === "MISALIGNED") {
    warningParts.push("Structural misalignment is active. Operational decisions are producing contradictory outcomes.");
  } else if (state === "DRIFTING") {
    warningParts.push("The organisation is drifting from its stated decision posture. Correction is still possible but the window is narrowing.");
  } else {
    warningParts.push("Current posture is ordered. Monitor for early drift signals.");
  }

  if (headcountAffected != null && headcountAffected > 20) {
    warningParts.push(`Condition affects an estimated ${headcountAffected}+ roles. Organisational inertia will compound delay.`);
  }

  if (marketExposure) {
    warningParts.push(`Market context: ${marketExposure}.`);
  }

  return {
    exposureBand,
    horizon30: horizons.h30,
    horizon60: horizons.h60,
    horizon90: horizons.h90,
    executiveWarning: warningParts.join(" "),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZON NARRATIVES — no formulas, qualitative only
// ─────────────────────────────────────────────────────────────────────────────

const HORIZON_MAP: Record<string, { h30: string; h60: string; h90: string }> = {
  ORDERED: {
    h30: "Stable. No material deterioration expected within 30 days if current governance rhythm holds.",
    h60: "Monitor for early drift signals. Ordered conditions can erode gradually without visible failure.",
    h90: "Quarterly governance review recommended. Even ordered systems require active maintenance.",
  },
  DRIFTING: {
    h30: "The drift has set precedent. Informal decision patterns are beginning to replace formal authority.",
    h60: "Correction cost has increased. Stakeholder positions have hardened around the drifted operating state.",
    h90: "What was drift is now structural. The organisation has adapted to the misalignment as normal.",
  },
  MISALIGNED: {
    h30: "Contradictory execution is compounding. Different parts of the organisation are solving different problems.",
    h60: "Recovery now requires structural intervention, not incremental correction. The cost of realignment has multiplied.",
    h90: "The misalignment has embedded. Reversal requires reconstitution of decision authority, not a conversation.",
  },
  DISORDERED: {
    h30: "Control is actively shifting away from formal governance. Informal authority is making consequential decisions.",
    h60: "The disorder is institutional. External intervention is now more effective than internal correction.",
    h90: "The condition is self-reinforcing. Without forced structural intervention, the cost becomes permanent.",
  },
};
