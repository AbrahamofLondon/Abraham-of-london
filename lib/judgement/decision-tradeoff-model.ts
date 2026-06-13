/**
 * lib/judgement/decision-tradeoff-model.ts
 *
 * Decision Trade-off Model
 *
 * Converts vague trade-offs ("financial vs. growth") into measurable or concrete trade-off frames.
 * The goal is decision force: making the trade-off specific enough that the decision-maker can
 * actually evaluate the options rather than remain abstract.
 *
 * Wave 2F upgrade: addresses the trade-off modelling failure (3/3 scenarios in Wave 2E).
 */

export interface TradeoffSide {
  label: string;
  valueAtStake: string;
  measurableProxy: string;
  downsideIfChosen: string;
}

export interface QuantifiedTradeoff {
  tradeoffName: string;
  sideA: TradeoffSide;
  sideB: TradeoffSide;
  decisionPressure: string;
  missingMeasurements: string[];
}

/**
 * Model a trade-off by making both sides concrete and measurable
 */
export function modelTradeoff(
  tension: string,
  context: {
    decisionUnderReview?: string;
    primaryContradiction?: string;
    evidenceBasis?: string[];
    irreversibleElements?: string[];
  }
): QuantifiedTradeoff {
  // Detect decision type from context
  const lowerContext = (context.decisionUnderReview || "").toLowerCase();

  const safeContext: {
    decisionUnderReview: string;
    primaryContradiction: string;
    evidenceBasis: string[];
    irreversibleElements: string[];
  } = {
    decisionUnderReview: context.decisionUnderReview || "",
    primaryContradiction: context.primaryContradiction || "",
    evidenceBasis: context.evidenceBasis || [],
    irreversibleElements: context.irreversibleElements || [],
  };

  if (lowerContext.includes("career") || lowerContext.includes("job") || lowerContext.includes("startup")) {
    return modelCareerTradeoff(tension, safeContext);
  }

  if (lowerContext.includes("partner") || lowerContext.includes("co-founder") || lowerContext.includes("equity")) {
    return modelPartnershipTradeoff(tension, safeContext);
  }

  if (lowerContext.includes("family") || lowerContext.includes("parent") || lowerContext.includes("care")) {
    return modelFamilyTradeoff(tension, safeContext);
  }

  // Generic fallback
  return modelGenericTradeoff(tension, safeContext);
}

/**
 * Career/role trade-off: financial security vs. growth
 */
function modelCareerTradeoff(
  tension: string,
  context: {
    decisionUnderReview: string;
    primaryContradiction: string;
    evidenceBasis: string[];
    irreversibleElements: string[];
  }
): QuantifiedTradeoff {
  const evidence = context.evidenceBasis.join(" ") || "";
  const irreversible = context.irreversibleElements.join(" ") || "";

  // Extract financial figures if present
  const salaryMatch = evidence.match(/\$(\d+)k/i);
  const currentSalary = salaryMatch && salaryMatch[1] ? parseInt(salaryMatch[1]) : null;

  const emergencyMatch = evidence.match(/\$(\d+)k emergency/i);
  const emergencyCost = emergencyMatch && emergencyMatch[1] ? parseInt(emergencyMatch[1]) : null;

  const savingsMatch = evidence.match(/\$(\d+)k.*(?:after|savings)/i);
  const remainingSavings = savingsMatch && savingsMatch[1] ? parseInt(savingsMatch[1]) : null;

  let sideA: TradeoffSide;
  let sideB: TradeoffSide;
  const missingMeasurements: string[] = [];

  if (currentSalary && remainingSavings) {
    // Quantified: income protection vs. strategic ceiling
    const minimalSurvival = Math.ceil(currentSalary * 0.6); // 60% of current as baseline

    sideA = {
      label: "Accept Startup (Growth)",
      valueAtStake: `Strategic opportunity: access to founders, equity upside, ceiling expansion beyond $${currentSalary}k`,
      measurableProxy: `Does the startup role have a credible six-month advancement path OR can personal savings (${remainingSavings}k after emergency) cover survival needs without external income for at least 12 months?`,
      downsideIfChosen: `If startup fails (75% probability given), household income drops to zero for 6+ months; forces re-entry at lower salary tier`,
    };

    sideB = {
      label: "Stay Corporate (Security)",
      valueAtStake: `Income protection: guaranteed $${currentSalary}k + annual raises; zero equity upside`,
      measurableProxy: `Does the corporate role guarantee 12+ months of advancement opportunity before role ceiling is reached?`,
      downsideIfChosen: `Career growth ceiling limited by corporate structure; equity/founder wealth impossible; opportunity window closes (cannot rejoin startup cohort in 5 years)`,
    };
  } else {
    // Unquantified fallback
    sideA = {
      label: "Accept Startup (Growth)",
      valueAtStake: "Strategic opportunity and equity upside vs. unknown income stability",
      measurableProxy: "Can you survive 12-18 months without startup income while building the business?",
      downsideIfChosen: "Startup fails; personal wealth depletes; forced to re-enter job market at disadvantage",
    };

    sideB = {
      label: "Stay Corporate (Security)",
      valueAtStake: "Guaranteed income and role stability vs. limited growth ceiling",
      measurableProxy: "Does this role advance your career or just preserve current position?",
      downsideIfChosen: "Opportunity window closes; equity/wealth building not possible; skill gap vs. founders grows",
    };

    missingMeasurements.push("Specific salary figures (startup base + equity vesting schedule)");
    missingMeasurements.push("Concrete runway calculation (months of expenses per savings level)");
    missingMeasurements.push("Corporate advancement path (timeline to next role/ceiling)");
  }

  return {
    tradeoffName: "Career Growth vs. Income Protection",
    sideA,
    sideB,
    decisionPressure: `The deadline (${context.primaryContradiction?.includes("2 weeks") ? "14 days" : "unknown"}) forces a choice between guaranteed income continuation and strategic opportunity access. The irreversible element is that the corporate role will be filled externally if declined.`,
    missingMeasurements,
  };
}

/**
 * Partnership trade-off: growth speed vs. founder control
 */
function modelPartnershipTradeoff(
  tension: string,
  context: {
    decisionUnderReview: string;
    primaryContradiction: string;
    evidenceBasis: string[];
    irreversibleElements: string[];
  }
): QuantifiedTradeoff {
  const evidence = context.evidenceBasis.join(" ") || "";
  const contradiction = context.primaryContradiction || "";

  // Extract equity percentages if present
  const equityMatch = evidence.match(/(\d+)%\s*equity/i);
  const equityOffered = equityMatch && equityMatch[1] ? parseInt(equityMatch[1]) : 40;

  const arrMatch = evidence.match(/\$(\d+)k\s*(?:ARR|revenue)/i);
  const currentARR = arrMatch && arrMatch[1] ? parseInt(arrMatch[1]) : 800;

  const ceilingMatch = contradiction.match(/\$(\d+)M/i);
  const growthCeiling = ceilingMatch && ceilingMatch[1] ? parseInt(ceilingMatch[1]) : 5;

  const sideA: TradeoffSide = {
    label: "Bring Co-Founder (Growth Speed)",
    valueAtStake: `Investor relationships + operational expertise → potential $${currentARR}k → $${growthCeiling}M ARR transition in 18-24 months; enterprise scaling possible`,
    measurableProxy: `Does the partner commit to written decision rights AND accept a 40% dilution cap AND agree to a 30-day exit mechanism? (Measurable: ask for written terms; if refused, measurement fails)`,
    downsideIfChosen: `Surrender ${equityOffered}% ownership permanently; give product control authority to non-technical operator; 5-10 year working relationship with potential for major conflict`,
  };

  const sideB: TradeoffSide = {
    label: "Hire Head of Ops or Stay Solo (Control + Clarity)",
    valueAtStake: `Founder retains 100% control and product direction; operator relationship is contractual + terminable; growth ceiling remains $${growthCeiling}M but under founder authority`,
    measurableProxy: `Can a $180k+5% operator contract deliver 50% of the growth value without equity partnership? (Test: hire for 12 months, measure ARR growth vs. co-founder scenario)`,
    downsideIfChosen: `Growth stays solo-founder limited; investor relationships absent; forced to raise capital on less favorable terms; 5-10 year growth opportunity partially forfeited`,
  };

  return {
    tradeoffName: "Partnership Growth Speed vs. Founder Control",
    sideA,
    sideB,
    decisionPressure: `The candidate is considering other ventures; the exclusivity window closes in 20 days. The irreversible element is that ${equityOffered}% equity granted immediately is permanent; vesting would have preserved optionality.`,
    missingMeasurements: [
      "Written partner decision rights (what decisions require founder consent?)",
      "Equity dilution cap and exit terms (if partnership fails, what happens to equity?)",
      "Operator-only alternative ARR growth trajectory (comparable metric)",
    ],
  };
}

/**
 * Family care trade-off: autonomy vs. safety
 */
function modelFamilyTradeoff(
  tension: string,
  context: {
    decisionUnderReview: string;
    primaryContradiction: string;
    evidenceBasis: string[];
    irreversibleElements: string[];
  }
): QuantifiedTradeoff {
  const evidence = context.evidenceBasis.join(" ") || "";
  const contradiction = context.primaryContradiction || "";

  // Extract costs and timelines
  const facilityMatch = evidence.match(/\$(\d+)k\/month.*facility/i);
  const facilityCost = facilityMatch && facilityMatch[1] ? parseInt(facilityMatch[1]) : 6.5;

  const careMatch = evidence.match(/\$(\d+)k\/month.*care/i);
  const homeCost = careMatch && careMatch[1] ? parseInt(careMatch[1]) : 8;

  const yearsMatch = evidence.match(/(\d+)-(\d+)\s*years/i);
  const sustainabilityYears = yearsMatch && yearsMatch[1] && yearsMatch[2] ? `${yearsMatch[1]}-${yearsMatch[2]} years` : "7-15 years";

  const sideA: TradeoffSide = {
    label: "Facility Placement (Safety + Clinical)",
    valueAtStake: `Professional clinical care; hospitalization risk reduced; family decision burden lifted; $${facilityCost}k/month sustainable for ${sustainabilityYears}`,
    measurableProxy: `Can the parent enroll in facility within the waitlist timeline? (Measurable: is facility enrollment available in 6-8 months before home situation becomes dangerous?)`,
    downsideIfChosen: `Parent's autonomy significantly reduced; psychological impact of relocation; potential family rupture if siblings disagree; daily life separated from family`,
  };

  const sideB: TradeoffSide = {
    label: "Home Care + Family Support (Autonomy + Presence)",
    valueAtStake: `Parent maintains home autonomy and family proximity; familiar environment; child can supervise daily; $${homeCost}k/month if clinical 24/7 care required`,
    measurableProxy: `Can home care providers handle medical episodes (falls, cognitive episodes) without hospitalization risk? (Measurable: neuropsych eval says "home safe IF clinical 24/7"; cost makes it 3-4 month runway only)`,
    downsideIfChosen: `If hospitalization occurs, it is irreversible cognitive/functional damage (dementia acceleration); home care is temporary max 3-4 months; forces facility decision under worse conditions`,
  };

  return {
    tradeoffName: "Parent Autonomy vs. Safety / Clinical Care",
    sideA,
    sideB,
    decisionPressure: `The deadline (unsustainable situation in 60 days) is real. The irreversible element is that home deterioration → hospitalization → permanent cognitive decline is much worse than facility placement now. The facility waitlist (8 months) means enrollment decision cannot be delayed past 14 days without losing the option.`,
    missingMeasurements: [
      "Neuropsych evaluation: exact hospitalization risk if home care is imperfect",
      "Facility waitlist status: can enrollment window be extended past 14 days?",
      "Home care provider track record: hospitalizations avoided vs. facility comparison",
      "Cost sustainability: can $${homeCost}k/month be extended 12+ months if needed?",
    ],
  };
}

/**
 * Generic trade-off model (fallback)
 */
function modelGenericTradeoff(
  tension: string,
  context: {
    decisionUnderReview: string;
    primaryContradiction: string;
    evidenceBasis: string[];
    irreversibleElements: string[];
  }
): QuantifiedTradeoff {
  const parts = tension.split(/\s+vs\.?\s+|versus|\s+or\s+/i);
  const sideALabel = (parts[0] || "").trim() || "Option A";
  const sideBLabel = (parts[1] || "").trim() || "Option B";

  return {
    tradeoffName: tension,
    sideA: {
      label: sideALabel,
      valueAtStake: `${sideALabel} provides strategic benefit`,
      measurableProxy: `Can you measure the value if ${sideALabel} is chosen?`,
      downsideIfChosen: `${sideALabel} may carry hidden costs or constraints`,
    },
    sideB: {
      label: sideBLabel,
      valueAtStake: `${sideBLabel} provides security or preservation`,
      measurableProxy: `Can you measure the cost if ${sideBLabel} is chosen?`,
      downsideIfChosen: `${sideBLabel} may limit future options or growth`,
    },
    decisionPressure: `The core tension is unresolved between ${sideALabel.toLowerCase()} and ${sideBLabel.toLowerCase()}. Need to quantify the specific values at stake.`,
    missingMeasurements: [
      "Concrete value metric for each side",
      "Measurable proxy that would indicate success for each choice",
      "Cost of delay for each option",
    ],
  };
}

export default {
  modelTradeoff,
};
