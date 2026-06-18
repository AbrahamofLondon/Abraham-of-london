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
  it("passes canonical, contradiction, and weak-evidence cases against the live orchestrator", async () => {
    const run = await runTeamAssessmentTruthHarness();

    expect(run.surface).toBe("team_assessment");
    expect(run.passed).toBe(true);
    expect(run.effectiveCeiling).toBe(6);
    expect(run.sourceRefs).toContain("content/evidence/team-alignment-illusion.mdx");
    expect(run.sourceRefs).toContain(
      "content/evidence/outcome-verified-hidden-divergence.mdx",
    );

    const canonical = run.cases.find((truthCase) => truthCase.kind === "canonical");
    const contradiction = run.cases.find(
      (truthCase) => truthCase.kind === "contradiction",
    );
    const weak = run.cases.find((truthCase) => truthCase.kind === "weak_evidence");

    expect(canonical?.passed).toBe(true);
    expect(contradiction?.passed).toBe(true);
    expect(weak?.passed).toBe(true);
    expect(weak?.allowedReleaseScore).toBeLessThanOrEqual(4);
    expect(weak?.rawResult.confidence).not.toBe("HIGH");
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
});
