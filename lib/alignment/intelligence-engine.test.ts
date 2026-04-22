import { describe, expect, it } from "vitest";

import { PURPOSE_ALIGNMENT_QUESTIONS } from "./checklist";
import { scorePurposeProfile } from "./scoring";
import type { AlignmentDomain, DualAxisAnswer, PurposePatternId } from "./types";

function idsFor(domain: AlignmentDomain): string[] {
  return PURPOSE_ALIGNMENT_QUESTIONS
    .filter((question) => question.domain === domain)
    .map((question) => question.id);
}

function overridesFor(
  domains: AlignmentDomain[],
  resonance: number,
  certainty: number,
): Record<string, [number, number]> {
  return Object.fromEntries(
    domains.flatMap((domain) =>
      idsFor(domain).map((id) => [id, [resonance, certainty] as [number, number]]),
    ),
  );
}

function profile(
  resonance: number,
  certainty: number,
  overrides: Record<string, [number, number]> = {},
) {
  const answers = Object.fromEntries(
    PURPOSE_ALIGNMENT_QUESTIONS.map((question) => {
      const answer = overrides[question.id] ?? [resonance, certainty];
      return [
        question.id,
        { resonance: answer[0], certainty: answer[1] } satisfies DualAxisAnswer,
      ];
    }),
  );

  return scorePurposeProfile({ answers });
}

const cases: Array<{
  name: string;
  result: ReturnType<typeof profile>;
  expectedPrimary: PurposePatternId;
}> = [
  {
    name: "sovereign balanced high",
    result: profile(9, 9),
    expectedPrimary: "latent_coherence_under_pressure",
  },
  {
    name: "mandate fracture",
    result: profile(7, 7, overridesFor(["identity"], 2, 9)),
    expectedPrimary: "mandate_fracture",
  },
  {
    name: "pressure override",
    result: profile(7, 7, {
      ...overridesFor(["identity"], 9, 8),
      ...overridesFor(["decision"], 2, 8),
    }),
    expectedPrimary: "pressure_override",
  },
  {
    name: "environmental drag",
    result: profile(7, 7, {
      ...overridesFor(["environment"], 2, 8),
      ...overridesFor(["behaviour"], 3, 8),
    }),
    expectedPrimary: "environmental_drag",
  },
  {
    name: "operational inconsistency",
    result: profile(7, 7, {
      ...overridesFor(["decision"], 9, 8),
      ...overridesFor(["behaviour"], 2, 8),
    }),
    expectedPrimary: "operational_inconsistency",
  },
  {
    name: "false alignment",
    result: profile(8, 2),
    expectedPrimary: "false_alignment",
  },
  {
    name: "acknowledged failure",
    result: profile(2, 9),
    expectedPrimary: "acknowledged_failure",
  },
  {
    name: "high-variance split",
    result: profile(5, 6, {
      ...overridesFor(["identity"], 9, 9),
      ...overridesFor(["legacy"], 1, 9),
    }),
    expectedPrimary: "high_variance_split",
  },
  {
    name: "distributed low alignment",
    result: profile(4, 5),
    expectedPrimary: "distributed_drift",
  },
  {
    name: "compensatory discipline",
    result: profile(7, 7, {
      ...overridesFor(["identity"], 3, 8),
      ...overridesFor(["behaviour"], 9, 9),
    }),
    expectedPrimary: "compensatory_discipline",
  },
  {
    name: "legacy deferral",
    result: profile(7, 7, {
      ...overridesFor(["behaviour"], 8, 8),
      ...overridesFor(["legacy"], 2, 8),
    }),
    expectedPrimary: "legacy_deferral",
  },
  {
    name: "emotionally stable but directionally confused",
    result: profile(6, 8, {
      ...overridesFor(["identity"], 2, 8),
      ...overridesFor(["decision"], 3, 8),
      ...overridesFor(["emotional_order"], 9, 9),
    }),
    expectedPrimary: "mandate_fracture",
  },
];

describe("Purpose Alignment intelligence engine", () => {
  it.each(cases)("$name produces the expected primary pattern", ({ result, expectedPrimary }) => {
    expect(result.primaryPattern?.id).toBe(expectedPrimary);
    expect(result.domainStates).toHaveLength(6);
    expect(result.patternScores?.[0]?.score).toBeGreaterThan(0);
    expect(result.firstAction).toBeTruthy();
    expect(result.reportNarrative?.conditionStatement).toContain(result.primaryPattern!.label);
  });

  it("preserves materially different narrative and action blocks across archetypes", () => {
    const actions = new Set(cases.map((item) => item.result.firstAction));
    const narratives = new Set(
      cases.map((item) => item.result.reportNarrative?.conditionStatement),
    );

    expect(actions.size).toBeGreaterThanOrEqual(10);
    expect(narratives.size).toBeGreaterThanOrEqual(10);
  });

  it("does not collapse high resonance low certainty into low resonance high certainty", () => {
    const falseAlignment = profile(8, 2);
    const acknowledgedFailure = profile(2, 9);

    expect(falseAlignment.primaryPattern?.id).toBe("false_alignment");
    expect(acknowledgedFailure.primaryPattern?.id).toBe("acknowledged_failure");
    expect(falseAlignment.percent).not.toBe(acknowledgedFailure.percent);
    expect(falseAlignment.firstAction).not.toBe(acknowledgedFailure.firstAction);
  });

  it("does not collapse one catastrophic fracture into a globally mediocre profile", () => {
    const catastrophic = profile(7, 7, overridesFor(["legacy"], 1, 9));
    const mediocre = profile(4, 5);

    expect(catastrophic.primaryPattern?.id).toBe("legacy_deferral");
    expect(mediocre.primaryPattern?.id).toBe("distributed_drift");
    expect(catastrophic.contradictions?.map((item) => item.type)).toContain("high_variance_split");
    expect(mediocre.contradictions?.map((item) => item.type)).toContain("globally_low_consistent");
  });

  it("does not collapse high behaviour low identity into low behaviour high identity", () => {
    const disciplinedButUnclear = profile(7, 7, {
      ...overridesFor(["identity"], 3, 8),
      ...overridesFor(["behaviour"], 9, 9),
    });
    const clearButNotOperating = profile(7, 7, {
      ...overridesFor(["identity"], 9, 8),
      ...overridesFor(["behaviour"], 3, 8),
    });

    expect(disciplinedButUnclear.primaryPattern?.id).toBe("compensatory_discipline");
    expect(clearButNotOperating.primaryPattern?.id).toBe("operational_inconsistency");
    expect(disciplinedButUnclear.firstAction).not.toBe(clearButNotOperating.firstAction);
  });

  it("treats balanced high as latent coherence, not tie-default identity weakness", () => {
    const balanced = profile(9, 9);

    expect(balanced.primaryPattern?.id).toBe("latent_coherence_under_pressure");
    expect(balanced.coherenceBand).toBe("SOVEREIGN");
    expect(balanced.reportNarrative?.conditionStatement).toContain("Latent coherence");
  });

  it("uses reflection evidence in the canonical result instead of treating it as display-only metadata", () => {
    const answers = Object.fromEntries(
      PURPOSE_ALIGNMENT_QUESTIONS.map((question) => [
        question.id,
        { resonance: 7, certainty: 7 } satisfies DualAxisAnswer,
      ]),
    );

    const baseline = scorePurposeProfile({ answers });
    const contextual = scorePurposeProfile({
      answers,
      context: {
        reflections: {
          avoidedDecision: "Whether to remove the senior operator who keeps blocking execution.",
          lastSevenDays: "Two escalation meetings were postponed and the team kept operating around the issue.",
          dissenter: "The strongest counterargument is that removing them could expose a succession gap.",
        },
      },
    });

    expect(contextual.firstAction).toContain("senior operator");
    expect(contextual.reportNarrative?.classificationExplanation).toContain("qualitative evidence");
    expect(contextual.reportNarrative?.consequenceBlock).toContain("Two escalation meetings");
    expect(contextual.reportNarrative?.conditionStatement).not.toBe(baseline.reportNarrative?.conditionStatement);
  });
});
