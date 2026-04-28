type NarrativeVariantInput = {
  route: "PENDING" | "DIAGNOSTIC" | "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "STRATEGY";
  posture: string;
  seed: number;
};

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length]!;
}

export function selectNarrativeVariant(input: NarrativeVariantInput): {
  summaryPrefix: string;
  routeTitle?: string;
  routeDescription?: string;
} {
  const route = input.route;

  const summaryPrefixes = [
    "The system's reading remains structurally consistent:",
    "The current reading resolves as follows:",
    "The decision posture at this stage is:",
    "The present constitutional interpretation is:",
  ] as const;

  const strategyTitles = [
    "Strategy Room — escalation justified",
    "Private strategy escalation is justified",
    "Escalation threshold cleared",
  ] as const;

  const diagnosticTitles = [
    "Executive Reporting — the right next layer",
    "Disciplined interpretation required first",
    "Escalation deferred pending sharper reading",
  ] as const;

  const rejectTitles = [
    "Foundational diagnosis required",
    "Signal not yet fit for escalation",
    "Structural groundwork required first",
  ] as const;

  if (route === "STRATEGY" || route === "STRATEGY_ROOM") {
    return {
      summaryPrefix: pick(summaryPrefixes, input.seed),
      routeTitle: pick(strategyTitles, input.seed),
      routeDescription:
        input.posture === "ORDERED"
          ? "Authority, consequence, and readiness are sufficiently aligned to justify private strategic escalation."
          : "Escalation is justified, but the mandate still requires discipline around structure and consequence containment.",
    };
  }

  if (route === "EXECUTIVE_REPORTING" || route === "DIAGNOSTIC") {
    return {
      summaryPrefix: pick(summaryPrefixes, input.seed),
      routeTitle: pick(diagnosticTitles, input.seed),
      routeDescription:
        "The signal is real, but disciplined interpretation remains the correct next layer before premium intervention.",
    };
  }

  return {
    summaryPrefix: pick(summaryPrefixes, input.seed),
    routeTitle: pick(rejectTitles, input.seed),
    routeDescription:
      "The current signal is not yet strong enough for escalation. Structural diagnosis should come before strategic theatre.",
  };
}
