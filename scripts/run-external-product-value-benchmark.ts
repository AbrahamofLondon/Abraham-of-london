/**
 * External Product Value Benchmark — evidence runner.
 *
 * Executes the actual composers with two materially different sample
 * inputs per testable gold-claim product, captures the rendered output a
 * customer would receive, and runs the anti-toy test, red-team reviewer
 * panel, and customer usefulness proof against that actual output.
 *
 * Emits reports/external-product-value-evidence.json for consumption by
 * scripts/check-external-product-value-benchmark.mjs. Run via:
 *   pnpm exec tsx scripts/run-external-product-value-benchmark.ts
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { getAllProducts } from "../lib/commercial/catalog";
import { productFamilyFor } from "../lib/product/product-gold-upgrade-roadmap";
import {
  buildExternalProductBenchmark,
  buildMarketComparisonRows,
  type BenchmarkProductDescriptor,
} from "../lib/product/external-product-value-benchmark";
import {
  runAntiToyTest,
  type AnalyzableSample,
} from "../lib/product/anti-toy-product-test";
import { runRedTeamPanel } from "../lib/product/product-red-team-reviewers";
import { assessCustomerUsefulness } from "../lib/product/customer-usefulness-proof";
import { composeFastDiagnosticGoldResult } from "../lib/product/fast-diagnostic-gold-composer";
import { composeFreeSignalGoldResult } from "../lib/product/free-signal-gold-composer";

const ROOT = join(__dirname, "..");
const EVIDENCE_PATH = join(ROOT, "reports", "external-product-value-evidence.json");
const WAVE_ONE_REPORT = join(ROOT, "reports", "wave-one-gold-standard.json");

// ── Gold claims under re-test (internal certifications from Wave 1) ──
const waveOne = existsSync(WAVE_ONE_REPORT)
  ? JSON.parse(readFileSync(WAVE_ONE_REPORT, "utf-8"))
  : null;
const goldClaims: string[] = (waveOne?.results ?? [])
  .filter((result: { releaseStatus: string }) =>
    result.releaseStatus === "gold_standard" || result.releaseStatus === "internally_certified")
  .map((result: { productCode: string }) => result.productCode);

// ── Rendered output capture: run the real composers, two scenarios each ──

interface RenderedReview {
  productCode: string;
  renderedOutputAvailable: boolean;
  testedOutputSource: string;
  liveRouteVerified: boolean;
  unavailableReason?: string;
  samples?: Array<{ label: string; inputSummary: string; outputText: string; sectionsPresent: string[] }>;
  antiToy?: ReturnType<typeof runAntiToyTest>;
  redTeam?: ReturnType<typeof runRedTeamPanel>;
  usefulnessProof?: ReturnType<typeof assessCustomerUsefulness>;
  timeValueSurplusPassed?: boolean;
  judgementIsCaseDerived: boolean | null;
}

function reviewFastDiagnostic(): RenderedReview {
  const scenarioA = {
    label: "pricing decision under ownership ambiguity",
    input: {
      productCode: "fast_diagnostic" as const,
      answers: [
        { question: "Who owns this decision?", answer: "Unclear — pricing sits between sales and finance" },
        { question: "What evidence do you have?", answer: "Churn analysis from March and two enterprise renewal objections" },
        { question: "What happens if you wait?", answer: "Competitor undercut continues through Q3" },
      ],
      dominantFrictionSignal: "ownership ambiguity between sales and finance",
      decisionContext: "the enterprise pricing change",
      statedStake: "Q3 enterprise renewal revenue",
      minutesSpentByUser: 6,
      stakeholders: ["Commercial Director", "VP Sales", "Finance Director"],
      deadline: "Q3 renewal cycle opens in five weeks",
      desiredOutcome: "one accountable owner for a defended enterprise price floor",
      priorAttempts: ["three pricing committee meetings ended without an accountable name"],
      optionsUnderConsideration: ["hold price", "match competitor", "segment-based price floor"],
    },
  };
  const scenarioB = {
    label: "hiring freeze prioritisation",
    input: {
      productCode: "fast_diagnostic" as const,
      answers: [
        { question: "What is the constraint?", answer: "Hiring freeze: headcount and capacity cannot grow" },
        { question: "What evidence do you have?", answer: "Capacity model shows 140% allocation across five committed workstreams" },
        { question: "What happens if you wait?", answer: "The platform launch slips while every workstream degrades together" },
      ],
      dominantFrictionSignal: "hiring freeze capacity constraint with no de-scoped workstream",
      decisionContext: "engineering delivery plan under the hiring freeze",
      statedStake: "platform launch delivery capacity and customer commitments",
      minutesSpentByUser: 6,
      stakeholders: ["COO", "VP Engineering"],
      deadline: "platform launch window in nine weeks",
      desiredOutcome: "a delivery plan the remaining team can actually execute",
      priorAttempts: ["asked every team to find 10% efficiency but nothing was stopped"],
      optionsUnderConsideration: ["cut two workstreams", "slip the launch", "contract out platform work"],
    },
  };

  const samples = [scenarioA, scenarioB].map((scenario) => {
    const result = composeFastDiagnosticGoldResult(scenario.input);
    const sections = {
      dominantDecisionFriction: result.dominantDecisionFriction,
      whatYourAnswersSuggest: result.whatYourAnswersSuggest,
      likelyCostOfIgnoringThis: result.likelyCostOfIgnoringThis,
      minimumViableCorrection: result.minimumViableCorrection,
      whatThisResultDoesNotYetProve: result.whatThisResultDoesNotYetProve,
      whenToEscalate: result.whenToEscalate,
      recommendedNextStep: result.recommendedNextStep,
    };
    const sample: AnalyzableSample = {
      label: scenario.label,
      inputText: [
        scenario.input.dominantFrictionSignal,
        scenario.input.decisionContext,
        scenario.input.statedStake,
        ...scenario.input.answers.map((entry) => `${entry.question} ${entry.answer}`),
      ].join(" "),
      output: {
        fullText: Object.values(sections).join("\n"),
        nextActionText: result.recommendedNextStep,
        consequenceText: result.likelyCostOfIgnoringThis,
        diagnosisText: result.dominantDecisionFriction,
        falsificationText: result.falsificationChallenge,
        executionSequenceText: result.executionSequence,
        limitsText: result.whatThisResultDoesNotYetProve,
        evidenceItems: scenario.input.answers.map((entry) => entry.answer),
      },
    };
    return { sample, sections, timeValuePassed: result.timeValueSurplus.passes };
  });

  return assembleReview("fast_diagnostic", "composer_execution: lib/product/fast-diagnostic-gold-composer.ts (not yet wired to live route /diagnostics/fast)", samples);
}

function reviewFreeSignal(productCode: string, surface: string): RenderedReview {
  const scenarioA = {
    label: "post-merger operations team with conflicting priorities",
    input: {
      productCode,
      observedSignal: "three of five team leads gave materially conflicting answers about this quarter's top priority",
      signalSource: "the team assessment responses",
      customerSituation: "a twelve-person operations team three months after a merger",
      whatItPointsAt: "an alignment illusion — agreement in meetings, divergence in execution",
      minutesAskedOfUser: 8,
      stakeholders: ["Operations Director", "five team leads"],
      deadline: "quarterly commitments lock in three weeks",
      desiredOutcome: "one written priority order all five leads execute against",
    },
  };
  const scenarioB = {
    label: "founder-led sales team missing its pipeline forecast",
    input: {
      productCode,
      observedSignal: "forecast confidence stayed above ninety percent while quarter-end attainment fell below sixty",
      signalSource: "the assessment's forecast-versus-attainment readings",
      customerSituation: "a founder-led sales team of seven carrying an aggressive annual target",
      whatItPointsAt: "risk blindness — warning signs are ignored and confidence stayed high while failure signals worsened",
      minutesAskedOfUser: 8,
      stakeholders: ["Founder", "Sales Lead"],
      deadline: "quarter end in four weeks",
      desiredOutcome: "a forecast decision that prices the warning signs before commitment",
    },
  };

  const samples = [scenarioA, scenarioB].map((scenario) => {
    const result = composeFreeSignalGoldResult(scenario.input);
    const sections = {
      oneClearSignal: result.oneClearSignal,
      oneUsefulInterpretation: result.oneUsefulInterpretation,
      onePracticalNextAction: result.onePracticalNextAction,
      oneHonestLimitation: result.oneHonestLimitation,
      oneEscalationCondition: result.oneEscalationCondition,
    };
    const sample: AnalyzableSample = {
      label: scenario.label,
      inputText: [
        scenario.input.observedSignal,
        scenario.input.signalSource,
        scenario.input.customerSituation,
        scenario.input.whatItPointsAt,
      ].join(" "),
      output: {
        fullText: Object.values(sections).join("\n"),
        nextActionText: result.onePracticalNextAction,
        consequenceText: result.caseDerivedConsequence,
        diagnosisText: result.oneUsefulInterpretation,
        falsificationText: result.falsificationChallenge,
        executionSequenceText: result.executionSequence,
        limitsText: result.oneHonestLimitation,
        evidenceItems: [scenario.input.observedSignal, scenario.input.signalSource],
      },
    };
    return { sample, sections, timeValuePassed: result.timeValueSurplus.passes };
  });

  return assembleReview(productCode, `composer_execution: lib/product/free-signal-gold-composer.ts (not yet wired to live surface ${surface})`, samples);
}

function assembleReview(
  productCode: string,
  testedOutputSource: string,
  samples: Array<{ sample: AnalyzableSample; sections: Record<string, string>; timeValuePassed: boolean }>,
): RenderedReview {
  const [primary, variant] = samples;
  const antiToy = runAntiToyTest({
    productCode,
    testedOutputSource,
    primary: primary.sample,
    variant: variant.sample,
  });
  const redTeam = runRedTeamPanel(productCode, testedOutputSource, primary.sample, variant.sample);
  const usefulnessProof = assessCustomerUsefulness(productCode, testedOutputSource, primary.sample, variant.sample);

  return {
    productCode,
    renderedOutputAvailable: true,
    testedOutputSource,
    liveRouteVerified: false,
    samples: samples.map((entry) => ({
      label: entry.sample.label,
      inputSummary: entry.sample.inputText,
      outputText: entry.sample.output.fullText,
      sectionsPresent: Object.keys(entry.sections),
    })),
    antiToy,
    redTeam,
    usefulnessProof,
    timeValueSurplusPassed: samples.every((entry) => entry.timeValuePassed),
    judgementIsCaseDerived: !antiToy.reasons.some((reason) => reason.includes("template")) && antiToy.toyRiskScore <= 5,
  };
}

function unavailableReview(productCode: string, reason: string): RenderedReview {
  return {
    productCode,
    renderedOutputAvailable: false,
    testedOutputSource: "none",
    liveRouteVerified: false,
    unavailableReason: reason,
    judgementIsCaseDerived: null,
  };
}

// ── Build evidence across the estate ──

const products = getAllProducts();
const descriptors: BenchmarkProductDescriptor[] = products.map((product) => ({
  productCode: product.code,
  productFamily: productFamilyFor(product),
  displayName: product.displayName,
  isPaid: product.amount > 0,
  priceLabel: product.displayPrice || (product.amount ? `GBP ${(product.amount / 100).toFixed(0)}` : "free"),
}));

const renderedReviews: RenderedReview[] = goldClaims.map((productCode) => {
  if (productCode === "fast_diagnostic") return reviewFastDiagnostic();
  if (productCode === "team_assessment") return reviewFreeSignal(productCode, "/diagnostics (team corridor stage)");
  if (productCode === "enterprise_assessment") return reviewFreeSignal(productCode, "/diagnostics (enterprise corridor stage)");
  return unavailableReview(
    productCode,
    "Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.",
  );
});

const judgementByCode = new Map(renderedReviews.map((review) => [review.productCode, review.judgementIsCaseDerived]));

const evidence = {
  generatedAt: new Date().toISOString(),
  goldClaimsSource: "reports/wave-one-gold-standard.json (Wave 1 internal certification)",
  goldClaims,
  productsReviewed: descriptors.length,
  benchmarks: descriptors.map((descriptor) => buildExternalProductBenchmark(descriptor)),
  renderedOutputReviews: renderedReviews,
  marketComparison: descriptors.flatMap((descriptor) =>
    buildMarketComparisonRows(descriptor, judgementByCode.get(descriptor.productCode) ?? null),
  ),
  descriptors,
};

mkdirSync(join(ROOT, "reports"), { recursive: true });
writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`);

console.log("EXTERNAL PRODUCT VALUE EVIDENCE RUNNER");
console.log(`Products reviewed: ${descriptors.length}`);
console.log(`Gold claims under re-test: ${goldClaims.length}`);
console.log(`Rendered-output reviews executed: ${renderedReviews.filter((review) => review.renderedOutputAvailable).length}`);
console.log(`Rendered-output unavailable: ${renderedReviews.filter((review) => !review.renderedOutputAvailable).length}`);
for (const review of renderedReviews.filter((entry) => entry.antiToy)) {
  console.log(`- ${review.productCode}: toyRisk=${review.antiToy?.toyRiskScore} redTeamSurvives=${review.redTeam?.survives} caseDerived=${review.judgementIsCaseDerived}`);
}
console.log(`Evidence written: ${EVIDENCE_PATH}`);
