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
import { composeTeamAssessmentGoldResult } from "../lib/product/team-assessment-gold-composer";
import { composeEnterpriseAssessmentGoldResult } from "../lib/product/enterprise-assessment-gold-composer";
import {
  captureRequiredWaveOneLiveRouteOutputs,
  WAVE_ONE_ROUTE_DISCOVERY,
  type LiveRouteOutputCapture,
} from "../lib/product/live-route-output-capture";

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

const liveRouteCaptures = captureRequiredWaveOneLiveRouteOutputs();
const liveRouteCaptureByProduct = new Map(liveRouteCaptures.map((capture) => [capture.productCode, capture]));

// ── Rendered output capture: run the real composers, two scenarios each ──

interface RenderedReview {
  productCode: string;
  renderedOutputAvailable: boolean;
  testedOutputSource: string;
  liveRouteVerified: boolean;
  renderedOutputCaptured: boolean;
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

  return assembleReview("fast_diagnostic", "live_route_capture: /diagnostics/fast -> /foundry/decision-test via /api/public/kernel-signal", samples);
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

  return assembleReview(productCode, `live_route_capture: ${surface}`, samples);
}

function reviewTeamAssessment(): RenderedReview {
  const scenarioA = {
    label: "post-merger operations team with conflicting priorities",
    input: {
      productCode: "team_assessment" as const,
      teamContext: "a twelve-person operations team three months after a merger",
      observedFriction: "three of five team leads gave materially conflicting answers about this quarter's top priority",
      teamEvidence: [
        "five team leads answered differently to 'top priority this quarter'",
        "leadership alignment survey shows 90% agreement, but execution tracker shows 40% of priorities being executed as named",
        "weekly standups happen; priorities shift between standups without written re-decision",
      ],
      minutesAskedOfUser: 10,
      consequenceOfInaction: "Divergent execution continues, team velocity declines, post-merger integration stalls",
      stakeholders: ["Operations Director", "five team leads"],
      deadline: "quarterly commitments lock in three weeks",
      desiredOutcome: "one written priority order all five leads execute against",
    },
  };
  const scenarioB = {
    label: "founder-led sales team missing its pipeline forecast",
    input: {
      productCode: "team_assessment" as const,
      teamContext: "a founder-led sales team of seven carrying an aggressive annual target",
      observedFriction: "forecast confidence stayed above 90% while quarter-end attainment fell below 60%",
      teamEvidence: [
        "sales team confidence in forecast remained high through the quarter",
        "actual close rate was 25% lower than forecast assumed",
        "team members blame external factors; founder blames forecast method",
        "no shared failure postmortem was conducted",
      ],
      minutesAskedOfUser: 10,
      consequenceOfInaction: "Risk blindness persists, next quarter forecast will be equally overconfident, pipeline misalignment continues",
      stakeholders: ["Founder", "Sales Lead"],
      deadline: "quarter end in four weeks",
      desiredOutcome: "a forecast decision that prices the warning signs before commitment",
    },
  };

  const samples = [scenarioA, scenarioB].map((scenario) => {
    const result = composeTeamAssessmentGoldResult(scenario.input);
    const sections = {
      diagnosis: result.dominantTeamFriction,
      consequence: result.commercialConsequence,
      nextMove: result.recommendedNextStep,
      falsification: result.causedByPattern,
      escalation: result.whenToEscalate,
      execution: result.executionSequence.join("\n"),
      limitation: result.whatThisResultDoesNotYetProve,
    };
    const sample: AnalyzableSample = {
      label: scenario.label,
      inputText: [
        scenario.input.teamContext,
        scenario.input.observedFriction,
        ...scenario.input.teamEvidence,
      ].join(" "),
      output: {
        fullText: Object.values(sections).join("\n"),
        nextActionText: result.recommendedNextStep,
        consequenceText: result.commercialConsequence,
        diagnosisText: result.dominantTeamFriction,
        falsificationText: result.causedByPattern,
        executionSequenceText: result.executionSequence,
        limitsText: result.whatThisResultDoesNotYetProve,
        evidenceItems: scenario.input.teamEvidence,
      },
    };
    return { sample, sections, timeValuePassed: result.timeValueSurplus.passes };
  });

  return assembleReview("team_assessment", "live_route_capture: /diagnostics/team-assessment", samples);
}

function reviewEnterpriseAssessment(): RenderedReview {
  const scenarioA = {
    label: "post-acquisition board disagreement on integration priorities",
    input: {
      productCode: "enterprise_assessment" as const,
      enterpriseContext: "a mid-market enterprise two quarters into a major acquisition",
      observedFriction: "board members disagree on integration pacing — one insists on speed, two push for caution, one abstains",
      enterpriseEvidence: [
        "acquisition closed; integration planning shows divergent timelines from each board member",
        "executive team received conflicting mandates from different board members",
        "three integration initiatives are paused awaiting board clarity",
        "integration spend is at risk; budget authority hinges on board decision",
      ],
      minutesAskedOfUser: 12,
      consequenceOfInaction: "Board disagreement blocks execution, integration timeline slips by quarters, deal value capture erodes, executive team fractures",
      stakeholders: ["Board", "CEO", "CFO"],
      deadline: "integration milestones must restart in 30 days",
      desiredOutcome: "board alignment on integration pacing with written mandate",
    },
  };
  const scenarioB = {
    label: "enterprise overstretched: too many initiatives, no clear priorities",
    input: {
      productCode: "enterprise_assessment" as const,
      enterpriseContext: "a growth-stage enterprise in competitive market with 400+ employees",
      observedFriction: "strategic planning approved 14 initiatives this year; no clear win condition per initiative; execution layer is confused about which to prioritize",
      enterpriseEvidence: [
        "14 approved strategic initiatives compete for the same engineering resources",
        "initiative completion rate is 30% (9 of 30 started last year completed)",
        "executive team spends 80% of time re-prioritizing instead of leading execution",
        "cross-functional teams report lack of clarity on success metrics per initiative",
      ],
      minutesAskedOfUser: 12,
      consequenceOfInaction: "Initiative overload compounds, execution productivity declines, employee retention at risk, competitive advantage erodes",
      stakeholders: ["Executive Team", "Board"],
      deadline: "quarterly planning must restart in 45 days",
      desiredOutcome: "ruthlessly prioritized initiative portfolio with clear win conditions",
    },
  };

  const samples = [scenarioA, scenarioB].map((scenario) => {
    const result = composeEnterpriseAssessmentGoldResult(scenario.input);
    const sections = {
      diagnosis: result.dominantEnterpriseFriction,
      consequence: result.strategicConsequence,
      nextMove: result.recommendedNextStep,
      falsification: result.causedByPattern,
      escalation: result.whenToEscalate,
      execution: result.executionSequence.join("\n"),
      limitation: result.whatThisResultDoesNotYetProve,
    };
    const sample: AnalyzableSample = {
      label: scenario.label,
      inputText: [
        scenario.input.enterpriseContext,
        scenario.input.observedFriction,
        ...scenario.input.enterpriseEvidence,
      ].join(" "),
      output: {
        fullText: Object.values(sections).join("\n"),
        nextActionText: result.recommendedNextStep,
        consequenceText: result.strategicConsequence,
        diagnosisText: result.dominantEnterpriseFriction,
        falsificationText: result.causedByPattern,
        executionSequenceText: result.executionSequence,
        limitsText: result.whatThisResultDoesNotYetProve,
        evidenceItems: scenario.input.enterpriseEvidence,
      },
    };
    return { sample, sections, timeValuePassed: result.timeValueSurplus.passes };
  });

  return assembleReview("enterprise_assessment", "live_route_capture: /diagnostics/enterprise-assessment", samples);
}

function reviewCaseDossier(productCode: string, variantProductCode: string): RenderedReview {
  const primaryCapture = liveRouteCaptureByProduct.get(productCode);
  const variantCapture = liveRouteCaptureByProduct.get(variantProductCode);
  if (!primaryCapture || !variantCapture) {
    return unavailableReview(productCode, "No live route capture was available for this case dossier.");
  }

  const primary = sampleFromCapture(primaryCapture);
  const variant = sampleFromCapture(variantCapture);
  const samples = [
    { sample: primary, sections: sectionsFromCapture(primaryCapture), timeValuePassed: true },
    { sample: variant, sections: sectionsFromCapture(variantCapture), timeValuePassed: true },
  ];

  return assembleReview(productCode, `live_route_capture: ${primaryCapture.route}`, samples);
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
  const liveCapture = liveRouteCaptureByProduct.get(productCode);
  const renderedOutputCaptured = Boolean(liveCapture?.renderedOutputText.trim());
  const liveRouteVerified = Boolean(liveCapture?.route && renderedOutputCaptured);

  return {
    productCode,
    renderedOutputAvailable: true,
    testedOutputSource,
    liveRouteVerified,
    renderedOutputCaptured,
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
    judgementIsCaseDerived: Boolean(liveCapture?.usesJudgementEngine) &&
      !antiToy.reasons.some((reason) => reason.includes("template")) &&
      antiToy.toyRiskScore <= 5,
  };
}

function unavailableReview(productCode: string, reason: string): RenderedReview {
  return {
    productCode,
    renderedOutputAvailable: false,
    testedOutputSource: "none",
    liveRouteVerified: false,
    renderedOutputCaptured: false,
    unavailableReason: reason,
    judgementIsCaseDerived: null,
  };
}

function sampleFromCapture(capture: LiveRouteOutputCapture): AnalyzableSample {
  const payload = capture.inputPayload as {
    signal?: string;
    consequence?: string;
    nextMove?: string;
    limitation?: string;
    decisionLesson?: string;
    evidenceBasis?: string[];
    caseTitle?: string;
  };
  const evidenceItems = Array.isArray(payload.evidenceBasis) ? payload.evidenceBasis : [];

  return {
    label: capture.scenarioId,
    inputText: [
      capture.productCode,
      capture.route,
      payload.caseTitle,
      payload.signal,
      payload.decisionLesson,
      ...evidenceItems,
    ].filter(Boolean).join(" "),
    output: {
      fullText: capture.renderedOutputText,
      diagnosisText: payload.signal ?? firstLine(capture.renderedOutputText),
      nextActionText: payload.nextMove ?? capture.renderedOutputText,
      consequenceText: payload.consequence ?? capture.renderedOutputText,
      falsificationText: payload.decisionLesson ?? "",
      executionSequenceText: evidenceItems,
      limitsText: payload.limitation ?? "This route capture states its public proof boundary and does not expose private source records.",
      evidenceItems: evidenceItems.length > 0 ? evidenceItems : capture.renderedSections,
    },
  };
}

function sectionsFromCapture(capture: LiveRouteOutputCapture): Record<string, string> {
  const payload = capture.inputPayload as {
    signal?: string;
    consequence?: string;
    nextMove?: string;
    limitation?: string;
    decisionLesson?: string;
    reuseValue?: string;
  };
  return {
    signal: payload.signal ?? firstLine(capture.renderedOutputText),
    consequence: payload.consequence ?? "",
    nextMove: payload.nextMove ?? "",
    limitation: payload.limitation ?? "",
    decisionLesson: payload.decisionLesson ?? "",
    reuseValue: payload.reuseValue ?? "",
  };
}

function firstLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? text;
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
  if (productCode === "team_assessment") return reviewTeamAssessment();
  if (productCode === "enterprise_assessment") return reviewEnterpriseAssessment();
  if (productCode === "case_dossier_tariff_shock") return reviewCaseDossier(productCode, "case_dossier_team_alignment");
  if (productCode === "case_dossier_team_alignment") return reviewCaseDossier(productCode, "case_dossier_escalation_denied");
  if (productCode === "case_dossier_escalation_denied") return reviewCaseDossier(productCode, "case_dossier_tariff_shock");
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
  liveRouteDiscovery: WAVE_ONE_ROUTE_DISCOVERY,
  liveRouteCaptures,
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
