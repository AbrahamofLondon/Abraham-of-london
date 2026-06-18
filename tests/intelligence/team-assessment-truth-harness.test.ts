import { describe, expect, it } from "vitest";

import {
  evaluateTeamAssessmentTruthCase,
  runTeamAssessmentTruthCase,
  runTeamAssessmentTruthHarness,
} from "@/lib/intelligence/product-truth-harness/team-assessment";
import { TEAM_ASSESSMENT_TRUTH_CASES } from "@/lib/intelligence/product-truth-harness/team-assessment/cases";

function requireCase(id: string) {
  const match = TEAM_ASSESSMENT_TRUTH_CASES.find((truthCase) => truthCase.id === id);
  if (!match) {
    throw new Error(`Missing Team Assessment truth case "${id}".`);
  }
  return match;
}

describe("team assessment truth harness", () => {
  it("defines all five required scenario types", () => {
    const kinds = new Set(TEAM_ASSESSMENT_TRUTH_CASES.map((tc) => tc.kind));
    expect(kinds.has("canonical")).toBe(true);
    expect(kinds.has("adversarial")).toBe(true);
    expect(kinds.has("weak_evidence")).toBe(true);
    expect(kinds.has("contradiction")).toBe(true);
    expect(kinds.has("stale_evidence")).toBe(true);
    expect(kinds.size).toBe(5);
  });

  it("passes canonical, adversarial, weak-evidence, contradiction, and stale-evidence cases against the live orchestrator", async () => {
    const run = await runTeamAssessmentTruthHarness();

    expect(run.surface).toBe("team_assessment");
    expect(run.effectiveCeiling).toBe(6);

    const canonical = run.cases.find((truthCase) => truthCase.kind === "canonical");
    const adversarial = run.cases.find((truthCase) => truthCase.kind === "adversarial");
    const weak = run.cases.find((truthCase) => truthCase.kind === "weak_evidence");
    const contradiction = run.cases.find(
      (truthCase) => truthCase.kind === "contradiction",
    );
    const stale = run.cases.find((truthCase) => truthCase.kind === "stale_evidence");

    expect(canonical).toBeDefined();
    expect(adversarial).toBeDefined();
    expect(weak).toBeDefined();
    expect(contradiction).toBeDefined();
    expect(stale).toBeDefined();
  });

  it("fails planted contradiction misses", async () => {
    const contradictionCase = requireCase("contradiction-resource-allocation");
    const liveRun = await runTeamAssessmentTruthCase(contradictionCase);
    const plantedMiss = {
      ...liveRun.rawResult,
      evidenceBasis: liveRun.rawResult.evidenceBasis.filter(
        (entry) => !/team divergence detected/i.test(entry),
      ),
      unresolvedItems: liveRun.rawResult.unresolvedItems.filter(
        (entry) => !/divergence|gap/i.test(entry),
      ),
      engineTrace: (liveRun.rawResult.engineTrace ?? []).map((entry) =>
        entry.engineId === "cross-respondent-analysis"
          ? { ...entry, status: "SKIPPED_GATED" as const, reason: "planted contradiction miss" }
          : entry,
      ),
    };

    const evaluated = evaluateTeamAssessmentTruthCase(
      contradictionCase,
      plantedMiss,
    );

    expect(evaluated.passed).toBe(false);
    expect(evaluated.violationReasons.join(" ")).toMatch(/cross-respondent-analysis/i);
    expect(evaluated.violationReasons.join(" ")).toMatch(/planted respondent contradiction/i);
  });

  it("blocks confident weak-evidence outputs", async () => {
    const weakCase = requireCase("weak-evidence-single-respondent");
    const liveRun = await runTeamAssessmentTruthCase(weakCase);
    const overclaim = {
      ...liveRun.rawResult,
      confidence: "HIGH" as const,
      evidenceBasis: [
        ...liveRun.rawResult.evidenceBasis,
        "Team divergence detected: 2 area(s) of disagreement identified.",
      ],
    };

    const evaluated = evaluateTeamAssessmentTruthCase(weakCase, overclaim);

    expect(evaluated.passed).toBe(false);
    expect(evaluated.violationReasons.join(" ")).toMatch(/HIGH confidence/i);
    expect(evaluated.violationReasons.join(" ")).toMatch(/cross-respondent divergence/i);
  });

  it("blocks adversarial overconfidence bait from producing HIGH confidence", async () => {
    const adversarialCase = requireCase("adversarial-overconfidence-bait");
    const liveRun = await runTeamAssessmentTruthCase(adversarialCase);
    const overclaim = {
      ...liveRun.rawResult,
      confidence: "HIGH" as const,
    };

    const evaluated = evaluateTeamAssessmentTruthCase(adversarialCase, overclaim);

    expect(evaluated.passed).toBe(false);
    expect(evaluated.violationReasons.join(" ")).toMatch(/HIGH confidence/i);
  });

  it("flags stale evidence and blocks HIGH confidence on stale-evidence cases", async () => {
    const staleCase = requireCase("stale-evidence-multi-respondent");
    const liveRun = await runTeamAssessmentTruthCase(staleCase);
    const overclaim = {
      ...liveRun.rawResult,
      confidence: "HIGH" as const,
    };

    const evaluated = evaluateTeamAssessmentTruthCase(staleCase, overclaim);

    expect(evaluated.passed).toBe(false);
    expect(evaluated.violationReasons.join(" ")).toMatch(/HIGH confidence/i);
  });

  it("detects stale evidence in stale-evidence case results", async () => {
    const staleCase = requireCase("stale-evidence-multi-respondent");
    const liveRun = await runTeamAssessmentTruthCase(staleCase);

    const evaluated = evaluateTeamAssessmentTruthCase(staleCase, {
      ...liveRun.rawResult,
      evidenceBasis: [...liveRun.rawResult.evidenceBasis, "Evidence is stale: captured 180 days ago."],
    });

    expect(evaluated.passed).toBe(true);
  });
});
