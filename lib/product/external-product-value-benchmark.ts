/**
 * External Product Value Benchmark.
 *
 * The standard is no longer "does the product pass our internal gate" but
 * "would this product survive comparison against real market alternatives,
 * serious customer expectations, and the irrecoverable cost of user time".
 *
 * A product is gold-standard only when the actual output is useful, the
 * customer gets a clear win, the product beats ordinary alternatives, the
 * result is specific, actionable, and reusable, the customer's time is
 * repaid, and a serious reviewer would not call it a toy.
 */

export interface ExternalProductBenchmark {
  productCode: string;
  productFamily: string;

  customerExpectation: {
    expectedUseCase: string;
    expectedCustomerSophistication: "low" | "medium" | "high" | "executive";
    expectedOutcome: string;
    minimumUsefulResult: string;
    seriousBuyerStandard: string;
  };

  marketAlternatives: Array<{
    alternativeType:
      | "generic_ai_prompt"
      | "consultant_mini_audit"
      | "downloadable_template"
      | "diagnostic_tool"
      | "strategy_workshop"
      | "market_report"
      | "internal_team_analysis"
      | "executive_coach"
      | "software_dashboard";
    customerCostEstimate: string;
    expectedStrength: string;
    expectedWeakness: string;
  }>;

  mustOutperform: Array<
    | "generic_ai_prompt"
    | "downloadable_template"
    | "basic_diagnostic_tool"
    | "static_pdf_report"
    | "generic_consulting_intake"
  >;

  proofRequired: Array<
    | "rendered_output_review"
    | "sample_customer_journey"
    | "before_after_clarity_gain"
    | "actionability_test"
    | "reuse_test"
    | "adversarial_review"
    | "market_comparison"
  >;
}

export interface BenchmarkProductDescriptor {
  productCode: string;
  productFamily: string;
  displayName: string;
  isPaid: boolean;
  priceLabel: string;
}

const ALL_PROOFS: ExternalProductBenchmark["proofRequired"] = [
  "rendered_output_review",
  "sample_customer_journey",
  "before_after_clarity_gain",
  "actionability_test",
  "reuse_test",
  "adversarial_review",
  "market_comparison",
];

export function buildExternalProductBenchmark(
  descriptor: BenchmarkProductDescriptor,
): ExternalProductBenchmark {
  return {
    productCode: descriptor.productCode,
    productFamily: descriptor.productFamily,
    customerExpectation: customerExpectationFor(descriptor),
    marketAlternatives: marketAlternativesFor(descriptor),
    mustOutperform: mustOutperformFor(descriptor),
    proofRequired: ALL_PROOFS,
  };
}

function customerExpectationFor(
  descriptor: BenchmarkProductDescriptor,
): ExternalProductBenchmark["customerExpectation"] {
  switch (descriptor.productFamily) {
    case "free_public_signal":
      return {
        expectedUseCase: "A founder or operator with a live decision spends a few minutes to test whether this platform sees something they have not.",
        expectedCustomerSophistication: "medium",
        expectedOutcome: "A named decision signal with a consequence and one move they can make today.",
        minimumUsefulResult: "One specific, case-anchored observation they did not already have written down.",
        seriousBuyerStandard: "It must beat asking ChatGPT the same question for free — otherwise the product costs trust it never repays.",
      };
    case "decision_instrument":
      return {
        expectedUseCase: `A paying operator runs ${descriptor.displayName} against a live organisational decision expecting structured judgement, not a worksheet.`,
        expectedCustomerSophistication: "high",
        expectedOutcome: "A decision record with contradiction, pressure, cost of delay, and a defensible next move specific to their case.",
        minimumUsefulResult: "The customer understands their decision materially better than before and knows the next move.",
        seriousBuyerStandard: `At ${descriptor.priceLabel}, it must outperform a free template and a generic AI session combined — otherwise it is an expensive form.`,
      };
    case "strategy_room_session_report":
      return {
        expectedUseCase: "An executive pays for a governed working session and expects the record to function as an institutional decision document.",
        expectedCustomerSophistication: "executive",
        expectedOutcome: "A session record that is still operationally useful when reopened a week later, with evidence, tension, and an owned move.",
        minimumUsefulResult: "The record answers what was decided, on what basis, by whom, and what the checkpoint must establish.",
        seriousBuyerStandard: `At ${descriptor.priceLabel}, it competes with a half-day facilitated strategy workshop — the record must justify that comparison.`,
      };
    case "boardroom_premium":
      return {
        expectedUseCase: "A leader preparing a high-consequence decision buys a structured brief to defend it under challenge.",
        expectedCustomerSophistication: "executive",
        expectedOutcome: "A defensible artefact with judgement, falsification challenge, risk map, and execution sequence.",
        minimumUsefulResult: "The brief survives one hostile question the leader could not previously answer.",
        seriousBuyerStandard: "It competes with senior advisory time; generic analysis at this tier is a refund waiting to happen.",
      };
    case "global_market_intelligence":
      return {
        expectedUseCase: "A strategy or finance buyer purchases a dated intelligence edition as strategic context.",
        expectedCustomerSophistication: "executive",
        expectedOutcome: "Traceable, time-bound market calls clearly separated from current intelligence.",
        minimumUsefulResult: "The buyer can cite the edition's thesis with its date and confidence basis.",
        seriousBuyerStandard: "It competes with institutional research notes; untraceable claims end the relationship.",
      };
    case "professional_subscription":
    case "retainer_oversight":
      return {
        expectedUseCase: "An organisation retains ongoing decision oversight expecting compounding memory, not repeated static reports.",
        expectedCustomerSophistication: "executive",
        expectedOutcome: "Cycle-over-cycle movement: what changed, what evidence moved, what now needs escalation.",
        minimumUsefulResult: "Each cycle references the last and changes the next decision.",
        seriousBuyerStandard: "It competes with a fractional chief-of-staff; static output cancels the subscription.",
      };
    case "bundle_product":
      return {
        expectedUseCase: "A buyer purchases a bundle expecting a guided sequence, not a discount wrapper.",
        expectedCustomerSophistication: "medium",
        expectedOutcome: "A clear order of use: what first, why, and what each component changes.",
        minimumUsefulResult: "The buyer knows what to open first and what outcome each part supports.",
        seriousBuyerStandard: "It must beat buying the strongest single component alone.",
      };
    default:
      return {
        expectedUseCase: `A customer uses ${descriptor.displayName} on a live decision problem expecting specific judgement.`,
        expectedCustomerSophistication: descriptor.isPaid ? "high" : "medium",
        expectedOutcome: "A specific diagnosis, consequence view, and practical next move.",
        minimumUsefulResult: "More useful clarity than the time and money spent.",
        seriousBuyerStandard: "It must visibly outperform a generic AI answer and a free template.",
      };
  }
}

function marketAlternativesFor(
  descriptor: BenchmarkProductDescriptor,
): ExternalProductBenchmark["marketAlternatives"] {
  const genericAi = {
    alternativeType: "generic_ai_prompt" as const,
    customerCostEstimate: "Free to ~£20/month, 10 minutes of prompting",
    expectedStrength: "Instant, conversational, infinitely patient; produces structured, plausible analysis on demand.",
    expectedWeakness: "No proprietary evidence base, no governed record, no accountability, judgement quality varies with the user's own prompting skill.",
  };
  const template = {
    alternativeType: "downloadable_template" as const,
    customerCostEstimate: "Free to £50 one-off",
    expectedStrength: "Cheap, immediate, reusable structure the customer fills in themselves.",
    expectedWeakness: "Zero judgement: the customer does all the analytical work; the template cannot push back.",
  };
  const consultant = {
    alternativeType: "consultant_mini_audit" as const,
    customerCostEstimate: "£500–£5,000 and one to two weeks",
    expectedStrength: "Real human judgement, case-specific challenge, accountability, and tailored recommendations.",
    expectedWeakness: "Expensive, slow, quality varies by individual, and rarely leaves a reusable instrument behind.",
  };

  if (descriptor.productFamily === "strategy_room_session_report" || descriptor.productFamily === "boardroom_premium") {
    return [genericAi, consultant, {
      alternativeType: "strategy_workshop" as const,
      customerCostEstimate: "£2,000–£10,000 per facilitated day",
      expectedStrength: "Live facilitation, group alignment, real-time challenge from an experienced operator.",
      expectedWeakness: "Costly, scheduling-bound, and the output often degrades into an unactioned slide deck.",
    }];
  }
  if (descriptor.productFamily === "global_market_intelligence") {
    return [genericAi, {
      alternativeType: "market_report" as const,
      customerCostEstimate: "£300–£5,000 per report",
      expectedStrength: "Institutional research depth, named analysts, methodological track record.",
      expectedWeakness: "Generic to the buyer's situation; rarely connected to the buyer's own decision record.",
    }, consultant];
  }
  if (descriptor.productFamily === "professional_subscription" || descriptor.productFamily === "retainer_oversight") {
    return [genericAi, {
      alternativeType: "internal_team_analysis" as const,
      customerCostEstimate: "Existing headcount; days of opportunity cost per cycle",
      expectedStrength: "Full context, institutional knowledge, always available.",
      expectedWeakness: "No external challenge, political incentives distort judgement, memory lives in people who leave.",
    }, consultant];
  }
  return [genericAi, template, consultant];
}

function mustOutperformFor(
  descriptor: BenchmarkProductDescriptor,
): ExternalProductBenchmark["mustOutperform"] {
  const base: ExternalProductBenchmark["mustOutperform"] = ["generic_ai_prompt", "downloadable_template"];
  if (descriptor.productFamily === "decision_instrument") base.push("basic_diagnostic_tool", "generic_consulting_intake");
  if (descriptor.productFamily === "free_public_signal" || descriptor.productFamily === "fast_diagnostic_result") base.push("basic_diagnostic_tool");
  if (descriptor.productFamily === "global_market_intelligence" || descriptor.productFamily === "executive_reporting" || descriptor.productFamily === "diagnostic") base.push("static_pdf_report");
  if (descriptor.productFamily === "boardroom_premium" || descriptor.productFamily === "strategy_room_session_report") base.push("generic_consulting_intake");
  return [...new Set(base)];
}

export interface MarketComparisonRow {
  productCode: string;
  alternative: string;
  whatWeDoBetter: string;
  whatTheAlternativeDoesBetter: string;
  whereWeAreWeaker: string;
  whatWouldMakeUsClearlySuperior: string;
  wouldCustomerReturnAfterOneUse: "yes" | "uncertain" | "no";
}

/**
 * Honest market comparison for a product given its measured output quality.
 * `judgementIsCaseDerived` comes from the anti-toy cross-input test; without
 * case-derived judgement the platform does not currently beat a generic AI
 * prompt, and the row must say so.
 */
export function buildMarketComparisonRows(
  descriptor: BenchmarkProductDescriptor,
  judgementIsCaseDerived: boolean | null,
): MarketComparisonRow[] {
  const benchmark = buildExternalProductBenchmark(descriptor);
  return benchmark.marketAlternatives.map((alternative) => ({
    productCode: descriptor.productCode,
    alternative: alternative.alternativeType,
    whatWeDoBetter: judgementIsCaseDerived === true
      ? "Governed structure plus case-derived judgement, honest limits, escalation triggers, and a reusable decision record."
      : "Governed structure: named sections, honest limits, escalation triggers, and a record format the alternative does not enforce.",
    whatTheAlternativeDoesBetter: alternative.expectedStrength,
    whereWeAreWeaker: judgementIsCaseDerived === false
      ? "Measured output shows template-dominant judgement: for materially different inputs the analysis barely changes, which a generic AI prompt matches at zero cost."
      : judgementIsCaseDerived === null
        ? "No rendered output has been captured from the actual customer surface, so superiority over this alternative is unproven."
        : alternative.alternativeType === "consultant_mini_audit"
          ? "A strong human consultant still out-judges the instrument on novel, ambiguous cases."
          : "Breadth of conversational follow-up.",
    whatWouldMakeUsClearlySuperior: judgementIsCaseDerived === true
      ? "Compounding case memory and cross-case pattern intelligence the alternative cannot accumulate."
      : "Case-derived judgement branches (classification, calibrated severity, pattern comparison across cases) wired into the live customer surface.",
    wouldCustomerReturnAfterOneUse: judgementIsCaseDerived === true ? "yes" : judgementIsCaseDerived === false ? "uncertain" : "no",
  }));
}
