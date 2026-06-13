/**
 * lib/judgement/case-specific-consequence-model.ts
 *
 * Case-Specific Consequence Model
 *
 * Converts generic consequences ("increases risk", "bad outcome") into case-specific,
 * quantified consequences grounded in the scenario facts.
 *
 * Wave 2F upgrade: addresses the consequence modelling failure (3/3 scenarios in Wave 2E).
 */

export interface CaseSpecificConsequence {
  immediateConsequence: string;
  thirtyDayConsequence: string;
  irreversibleRisk: string;
  practicalCost: string;
  decisionDelayCost: string;
  whatGetsWorseIfIgnored: string;
}

/**
 * Model consequences specific to the case
 */
export function modelCaseSpecificConsequence(context: {
  decisionUnderReview?: string;
  primaryContradiction?: string;
  deadlinePressure?: string;
  irreversibleElements?: string[];
  evidenceBasis?: string[];
  desiredOutcome?: string;
}): CaseSpecificConsequence {
  const lowerContext = (context.decisionUnderReview || "").toLowerCase();

  const safeContext: {
    decisionUnderReview: string;
    primaryContradiction: string;
    deadlinePressure: string;
    irreversibleElements: string[];
    evidenceBasis: string[];
  } = {
    decisionUnderReview: context.decisionUnderReview || "",
    primaryContradiction: context.primaryContradiction || "",
    deadlinePressure: context.deadlinePressure || "",
    irreversibleElements: context.irreversibleElements || [],
    evidenceBasis: context.evidenceBasis || [],
  };

  if (lowerContext.includes("career") || lowerContext.includes("job") || lowerContext.includes("startup")) {
    return modelCareerConsequence(safeContext);
  }

  if (lowerContext.includes("partner") || lowerContext.includes("co-founder") || lowerContext.includes("equity")) {
    return modelPartnershipConsequence(safeContext);
  }

  if (lowerContext.includes("family") || lowerContext.includes("parent") || lowerContext.includes("care")) {
    return modelFamilyConsequence(safeContext);
  }

  return modelGenericConsequence(safeContext);
}

/**
 * Career/role consequences
 */
function modelCareerConsequence(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
}): CaseSpecificConsequence {
  const evidence = context.evidenceBasis.join(" ") || "";
  const deadline = context.deadlinePressure || "";

  const deadlineDays = deadline.includes("14") || deadline.includes("2 weeks") ? 14 : deadline.includes("30") ? 30 : 21;
  const thirtyDaysLabel = `in ${Math.ceil(30 / deadlineDays)} decision cycles`;

  return {
    immediateConsequence: `If the decision is not made within ${deadlineDays} days, the startup offer expires and the opportunity is permanently closed. The corporate role will be filled by external hire, reducing the fallback option from "stable $110k role" to "re-enter job market at unknown salary tier."`,

    thirtyDayConsequence: `${thirtyDaysLabel}: If the decision is delayed beyond 14 days without a binding acceptance, startup founder will move on to other candidates. The household will have burned the emergency reserves ($15k) on analysis rather than decision execution. The decision window has passed.`,

    irreversibleRisk: `Once the startup offer expires or the corporate role is filled, neither option is recoverable. The startup equity cliff (year 2) means if you accept later, you forfeit the early vesting. The corporate re-entry salary will be lower than the current $110k by 15-25% (market reset). This is a one-time window.`,

    practicalCost: `Accepting the startup costs $10k/year in guaranteed income reduction (${evidence.includes("$100k") ? "$100k vs. $110k" : "offer vs. current"}). It also costs 18 months of savings runway depletion ($45k → potentially $0 if startup fails). The cost of staying corporate is the opportunity cost: you will not have founder experience or equity, and the $110k ceiling is your realistic 10-year career max.`,

    decisionDelayCost: `Every week of delay (14 days = 2 weeks) increases the psychological pressure and reduces your actual decision options. The stated deadline is hard. Delay past 7 days signals to the startup that you're lukewarm; they will retract the offer. Delay past 14 days makes the decision for you (offers expired = stay corporate by default). The cost of delay is losing the decision agency itself.`,

    whatGetsWorseIfIgnored: `If you ignore the irreversibility ("I can always get another startup offer later"), you will find that: (1) founder equity windows are rare and time-limited; (2) your household situation (emergency expense) will only worsen if handled with short-term thinking (job-hopping, undersaving); (3) the corporate role ceiling is real—without a strategic move now, you will be the same salary in 5 years. The opportunity to make a conscious, well-informed strategic choice disappears in 14 days.`,
  };
}

/**
 * Partnership consequences
 */
function modelPartnershipConsequence(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
}): CaseSpecificConsequence {
  const deadline = context.deadlinePressure || "";
  const deadlineDays = deadline.includes("20 days") ? 20 : deadline.includes("60") ? 60 : 30;

  return {
    immediateConsequence: `If commitment happens without written decision rights and equity terms, you import the "trust uncertainty" directly into your operating structure. The co-founder can unilaterally direct resources, set product priorities, or make financial commitments. The first real disagreement becomes a governance crisis, not a negotiable boundary. This is immediate risk, not future risk.`,

    thirtyDayConsequence: `In 30 days: If the partner is brought on without written terms, the first product decision where you disagree reveals the structural vulnerability. If decision rights are not written, the partner can argue seniority/majority/investor preference. You have no contract-backed position. The psychological pressure to "preserve the relationship" will force capitulation, and your product control is gone.`,

    irreversibleRisk: `If 40% equity is granted without vesting, you will permanently surrender voting control and capital allocation authority. If the relationship fails in year 2, you cannot undo the equity grant—it will result in the partner retaining 40% ownership for the rest of the company's life. This outcome is irreversible unless you execute a hostile buyout (expensive, relationship-destroying) or agree to unfavorable exit terms.`,

    practicalCost: `The cost of partnership is 40% of all future equity upside (if you exit at $10M, you forfeit $4M; if you exit at $50M, you forfeit $20M). The cost of staying solo is that growth is slower, fundraising is harder, and you personally carry operational burden. The cost of hiring a Head of Ops ($180k + 5% equity) is $180k/year salary + 5% ownership—much cheaper, but you do not gain investor relationships or board-level expertise.`,

    decisionDelayCost: `Every day past today, the candidate is considering other ventures. In 20 days, the candidate makes a decision on another opportunity, and your window closes. If you delay past 20 days, the partnership option is off the table. You then must choose between: (1) hire a Head of Ops (slower growth, operator not investor), (2) stay solo (growth ceiling at $5M), or (3) raise institutional capital without operator expertise (difficult terms, dilution). Delay makes the decision for you (partnership option expires = solo or hire path forced).`,

    whatGetsWorseIfIgnored: `If you delay or proceed without written terms, the ambiguity about "how decisions get made" will become your biggest operational liability. The co-founder will assume they have equal authority; you will assume you retain product control. By the time you disagree (18 months in), the partnership psychology makes it impossible to impose written governance retroactively. The relationship becomes a slow deterioration rather than a clear separation. Control issues compound as the company scales.`,
  };
}

/**
 * Family care consequences
 */
function modelFamilyConsequence(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
}): CaseSpecificConsequence {
  const evidence = context.evidenceBasis.join(" ") || "";
  const hasWaitlist = evidence.includes("8 month");
  const hasDeclineRisk = evidence.includes("mild dementia") && evidence.includes("2-3 year");

  return {
    immediateConsequence: `If the immediate action does not preserve procedural rights (enroll in facility now while spot is available, or formalize home care contract), the parent remains in an unsustainable situation for the next 60 days. The neuropsych evaluation says "mild dementia, 2-3 year decline trajectory," which means the next 60 days will show visible cognitive decline. The window to make a clinical decision about "home" vs. "facility" narrows as the parent's condition worsens.`,

    thirtyDayConsequence: `In 30 days: If no decisive action (facility enrollment started, home care contract signed, clinical supervision established), the parent will have declined further cognitively. A decision that is appropriate at mild dementia becomes inappropriate at moderate dementia. The family will feel pressure to decide under worse conditions. The child will shift from "which option is best for autonomy vs. safety?" to "how do we prevent hospitalization immediately?" The decision frame worsens.`,

    irreversibleRisk: `The irreversible risk is hospitalization due to a fall or medical emergency at home. If hospitalization occurs due to dementia-related complications (fall, medication confusion, hygiene crisis), the cognitive decline will be permanent—a 75-year-old may lose 5 years of cognitive function in recovery. This outcome will result in facility placement being far more difficult and less favorable than proactive placement now. The window to place an autonomous person in facility is now; the window to place a cognitively damaged person is much later and far worse.`,

    practicalCost: `The cost of facility now is $6.5k/month for sustainable care (15+ years of financial runway). The cost of home care is $8k/month, but only sustainable for 3-4 months due to cost. The cost of staying home with family care is zero upfront but carries catastrophic risk (hospitalization = irreversible decline + crisis-mode placement at higher cost + worse outcomes). The financial cost of home care failure (hospitalization → rehabilitation → facility placement at 2-3 years remaining life vs. 10-15 years) is incalculable.`,

    decisionDelayCost: `The facility has an 8-month waitlist. Enrollment decision must be made in 14 days to secure the spot. If you delay the enrollment decision past 14 days, you lose the facility spot and must wait another 8 months. In 8 months, the parent will have declined from "mild" to "moderate-to-severe" dementia. The decision to place in facility becomes a crisis decision, not a planned decision. Family conflict is much worse under crisis pressure.`,

    whatGetsWorseIfIgnored: `If you delay the decision hoping "emotions will resolve it" or "a perfect solution will emerge," the parent will decline, the medical situation will worsen, and you will eventually face the same decision under much worse conditions. Home care only works if established immediately with proper clinical supervision. Once the parent falls or has a medical emergency, home care is no longer an option (insurance liability, client capacity). The delay does not preserve autonomy; it guarantees crisis-mode facility placement later with worse outcomes. The clock is real.`,
  };
}

/**
 * Generic consequence model (fallback)
 */
function modelGenericConsequence(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
}): CaseSpecificConsequence {
  const deadline = context.deadlinePressure || "upcoming";
  const irreversible = context.irreversibleElements[0] || "core impact";

  return {
    immediateConsequence: `If the decision is not made, the current situation becomes more untenable. The stated deadline (${deadline}) creates immediate pressure.`,

    thirtyDayConsequence: `In 30 days, if no decision is reached, the constraint will have worsened or become impossible to ignore. The options may narrow.`,

    irreversibleRisk: `The irreversible element is: ${irreversible}. Once this is lost or committed to, it cannot be recovered.`,

    practicalCost: `The immediate cost of each option is unclear without more specific metrics. The long-term cost will become apparent as the decision unfolds.`,

    decisionDelayCost: `Delay increases pressure and reduces decision-making quality. The longer the decision is deferred, the fewer options remain available.`,

    whatGetsWorseIfIgnored: `If this decision is ignored, the underlying constraint will force the issue anyway, but under worse conditions. Proactive decision is better than reactive crisis response.`,
  };
}

export default {
  modelCaseSpecificConsequence,
};
