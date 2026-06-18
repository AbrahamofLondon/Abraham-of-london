import fs from "fs";
import path from "path";

import { composeTeamAssessmentGoldResult } from "@/lib/product/team-assessment-gold-composer";
import { TEAM_ASSESSMENT_V2_SCENARIO_SET } from "@/lib/validation/frozen-scenario-sets-v2";

export interface TeamAssessmentTruthAsset {
  relativePath: string;
  title: string;
  description: string;
  body: string;
}

function readTeamAssessmentAsset(relativePath: string): TeamAssessmentTruthAsset {
  const absolutePath = path.join(process.cwd(), relativePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const title = raw.match(/^title:\s*"?(.*?)"?$/m)?.[1]?.trim() ?? path.basename(relativePath);
  const description = raw.match(/^description:\s*(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "") ?? "";

  return {
    relativePath,
    title,
    description,
    body: raw,
  };
}

const canonicalScenario = TEAM_ASSESSMENT_V2_SCENARIO_SET.scenarios.find(
  (scenario) => scenario.scenarioId === "team_assessment_cross_functional_v2",
);
const contradictionScenario = TEAM_ASSESSMENT_V2_SCENARIO_SET.scenarios.find(
  (scenario) => scenario.scenarioId === "team_assessment_conflict_resolution_v2",
);

if (!canonicalScenario || !contradictionScenario) {
  throw new Error("Team Assessment frozen scenarios are incomplete.");
}

export const TEAM_ALIGNMENT_ILLUSION_ASSET = readTeamAssessmentAsset(
  "content/evidence/team-alignment-illusion.mdx",
);

export const HIDDEN_DIVERGENCE_OUTCOME_ASSET = readTeamAssessmentAsset(
  "content/evidence/outcome-verified-hidden-divergence.mdx",
);

export const TEAM_ASSESSMENT_TRUTH_ASSETS = {
  canonicalScenario,
  contradictionScenario,
  teamAlignmentIllusion: TEAM_ALIGNMENT_ILLUSION_ASSET,
  hiddenDivergenceOutcome: HIDDEN_DIVERGENCE_OUTCOME_ASSET,
  canonicalReportAnchor: composeTeamAssessmentGoldResult({
    productCode: "team_assessment",
    teamSize: Number(canonicalScenario.input.teamSize ?? 3),
    teamContext: TEAM_ALIGNMENT_ILLUSION_ASSET.description,
    observedFriction:
      "Leadership reported high alignment, but respondents are carrying conflicting versions of success and incompatible execution priorities.",
    teamEvidence: [
      "Leadership reported high alignment across strategic priorities.",
      "respondent-derived priority ranking",
      "cross-response divergence analysis",
      "Priority conflict dropped from 4 active interpretations to 1.",
    ],
    stakeholders: (canonicalScenario.input.teamComposition as string[] | undefined) ?? [
      "team lead",
      "team members",
    ],
    consequenceOfInaction:
      "fragmentation deepens, coordination cost increases, and misalignment persists undetected",
    desiredOutcome: "one shared success definition with reconciled execution priorities",
    minutesAskedOfUser: 12,
  }),
};
