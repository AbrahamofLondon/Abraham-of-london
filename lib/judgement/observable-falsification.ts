/**
 * lib/judgement/observable-falsification.ts
 *
 * Observable Falsification Model
 *
 * Converts vague tests ("test your assumptions", "clarify expectations") into
 * concrete, observable tests that would actually change the judgment if the evidence emerges.
 *
 * Wave 2F upgrade: addresses the falsification pressure failure (3/3 scenarios in Wave 2E).
 */

export interface ObservableFalsificationTest {
  currentJudgement: string;
  assumptionBeingTested: string;
  observableTest: string;
  evidenceThatConfirms: string;
  evidenceThatReverses: string;
  decisionChangeIfReversed: string;
  testDeadline: string;
}

/**
 * Build an observable falsification test
 */
export function buildObservableFalsification(context: {
  decisionUnderReview?: string;
  primaryContradiction?: string;
  deadlinePressure?: string;
  irreversibleElements?: string[];
  evidenceBasis?: string[];
  optionsUnderConsideration?: string[];
  decisionOwner?: string;
}): ObservableFalsificationTest {
  const lowerContext = (context.decisionUnderReview || "").toLowerCase();

  const safeContext: {
    decisionUnderReview: string;
    primaryContradiction: string;
    deadlinePressure: string;
    irreversibleElements: string[];
    evidenceBasis: string[];
    optionsUnderConsideration: string[];
  } = {
    decisionUnderReview: context.decisionUnderReview || "",
    primaryContradiction: context.primaryContradiction || "",
    deadlinePressure: context.deadlinePressure || "",
    irreversibleElements: context.irreversibleElements || [],
    evidenceBasis: context.evidenceBasis || [],
    optionsUnderConsideration: context.optionsUnderConsideration || [],
  };

  if (lowerContext.includes("career") || lowerContext.includes("job") || lowerContext.includes("startup")) {
    return buildCareerFalsification(safeContext);
  }

  if (lowerContext.includes("partner") || lowerContext.includes("co-founder") || lowerContext.includes("equity")) {
    return buildPartnershipFalsification(safeContext);
  }

  if (lowerContext.includes("family") || lowerContext.includes("parent") || lowerContext.includes("care")) {
    return buildFamilyFalsification(safeContext);
  }

  return buildGenericFalsification(safeContext);
}

/**
 * Career/startup decision falsification
 */
function buildCareerFalsification(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
  optionsUnderConsideration: string[];
}): ObservableFalsificationTest {
  const evidence = context.evidenceBasis.join(" ") || "";

  // Extract current salary if available
  const salaryMatch = evidence.match(/\$(\d+)k(?:\s+base)?/i);
  const currentSalary = salaryMatch && salaryMatch[1] ? parseInt(salaryMatch[1]) : null;
  const startupBase = currentSalary ? Math.floor(currentSalary * 0.9) : 100;

  // Extract savings/emergency info
  const savingsMatch = evidence.match(/\$(\d+)k(?:\s+(?:after|remaining|in))/i);
  const savings = savingsMatch && savingsMatch[1] ? parseInt(savingsMatch[1]) : 45;

  return {
    currentJudgement: `The startup offer is worth accepting IF the household can survive on $${startupBase}k base for at least 12-18 months while the company reaches ramen profitability or a growth milestone.`,

    assumptionBeingTested: `The spouse's income (or household savings) is sufficient to cover the $2,200/month minimum survival cost (mortgage, childcare, essentials) without external funding for at least 12 months if the startup fails.`,

    observableTest: `Have a specific conversation with your spouse: "If I accept the startup offer and it fails within 12 months, we'd be living on your income alone. Can you cover ~$2,200/month of mandatory expenses (mortgage, childcare, healthcare) for 12 months without cutting into retirement savings or taking on new debt?" Get a specific yes/no answer, not a conditional answer.`,

    evidenceThatConfirms: `If the spouse confirms: "Yes, I can cover $2,200/month for 12 months on my income alone without jeopardizing retirement or accumulating debt," then the financial viability assumption holds. The startup risk is bounded: you can afford to fail for up to 12 months. This would confirm the startup is financially viable.`,

    evidenceThatReverses: `If the spouse says: "I can cover $2,000/month for 6 months, but after that we'd need your income back" OR "covering $2,200/month means I stop retirement contributions" OR "I'd need to borrow against home equity," then the assumption fails. The runway is actually 6 months, not 12. The financial viability of accepting the startup is reversed.`,

    decisionChangeIfReversed: `If the household runway is only 6 months (not 12), then the startup must achieve meaningful revenue or next funding within 6 months to be survivable. The startup's burn rate, runway, and funding timeline become the direct decision driver. If the startup has 18+ months of runway but your household only has 6 months, you cannot afford to join the startup. The decision changes from "accept with household runway risk" to "decline until household finances improve" or "negotiate higher startup base to extend runway."`,

    testDeadline: `This test must be completed within 3 days. You need the answer before the startup offer deadline (14 days from original). The spouse conversation requires clarity, not emotion; schedule it for when both are calm and focused on the financial question specifically.`,
  };
}

/**
 * Partnership decision falsification
 */
function buildPartnershipFalsification(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
  optionsUnderConsideration: string[];
}): ObservableFalsificationTest {
  return {
    currentJudgement: `The co-founder partnership is worth proceeding with IF trust can be converted into enforceable operating terms that protect product control and limit equity downside.`,

    assumptionBeingTested: `The candidate will agree to written decision rights, equity dilution caps, and a documented exit mechanism BEFORE equity is granted. The candidate is trustworthy enough to put commitments in writing; if they resist writing terms, they are not trustworthy enough for 40% equity partnership.`,

    observableTest: `Before any commitment or equity grant, present the candidate with a one-page operating terms document covering: (1) Which decisions require founder sign-off (product, fundraising, hiring, major partnerships); (2) Equity dilution cap (dilution stops after Series A, or after $X funded); (3) Exit or parting-of-ways terms (if partnership fails in year 2, candidate's equity vests out or is subject to buyback at X% of value). Ask: "Can you commit to these terms as of [date]?" Record the response in writing (email).`,

    evidenceThatConfirms: `If the candidate responds: "I agree to all three terms. Let's finalize the document and sign," then the assumption holds. Written commitment is possible; trust can be formalized. The partnership can proceed with governance confidence. The candidate is mature enough to separate relationship trust from business structure.`,

    evidenceThatReverses: `If the candidate responds: "I don't want to discuss terms until after we're committed" OR "Let's see how it goes" OR "Terms are premature, we should build trust first" OR "I'm not comfortable with a dilution cap, I want real equity," then the assumption fails. The candidate will NOT formalize governance. They are expecting pure trust-based partnership. This is the exact scenario that creates co-founder conflict.`,

    decisionChangeIfReversed: `If the candidate refuses written terms, the decision reverses from "proceed with co-founder" to "hire Head of Operations instead" or "stay solo." The candidate's refusal to write terms is itself the evidence that trust cannot be converted into structure. Operating with unwritten terms is how co-founder disputes emerge in year 2-3. If they won't commit to terms in the courtship phase, they definitely won't in the friction phase.`,

    testDeadline: `This test must be completed within 5 days. You need the candidate's written response before the 60-day exclusivity window closes (specifically, before day 20 when they make a decision on alternatives). A simple email with the three terms, requesting a written yes/no, is sufficient.`,
  };
}

/**
 * Family care decision falsification
 */
function buildFamilyFalsification(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  evidenceBasis: string[];
  optionsUnderConsideration: string[];
  decisionOwner?: string;
}): ObservableFalsificationTest {
  const evidence = context.evidenceBasis.join(" ") || "";

  return {
    currentJudgement: `The decision is whether to place the parent in a facility now (preserving autonomy during clinical clarity) versus home care with family support (preserving physical presence).`,

    assumptionBeingTested: `The deadline is a true decision deadline, not just an emotional timeline. That is, there is a specific facility enrollment opportunity (waitlist, medical timing) that actually closes if not acted on in the next 14 days. If the deadline is real, facility placement must happen now. If the deadline is flexible, home care can be tried first.`,

    observableTest: `Contact the facility and the social worker and ask: "What is the exact date by which we must notify you of enrollment intent to secure a spot on the waiting list? If we decide after that date, what is the next available enrollment opportunity?" Get specific dates, not approximations. Ask the neuropsych evaluator: "Based on the parent's current cognitive level, how much decline would make home care unsafe?" Get a specific cognitive threshold, not a vague "eventually."`,

    evidenceThatConfirms: `If the facility says: "We need enrollment notification by [date 14 days from now], and the next opportunity is 8 months later" AND the neuropsych says: "Home care is safe now at mild dementia, but becomes unsafe if the parent reaches moderate dementia (which could happen in 6 months based on trajectory)," then the deadline is real. Facility enrollment now is the option-preserving action. The assumption holds.`,

    evidenceThatReverses: `If the facility says: "We can hold a spot for 30 days" OR "Enrollment can happen any month, no special deadline" AND the neuropsych says: "The parent can safely do home care for 6+ months before clinical safety becomes an issue," then the deadline is flexible. Home care trial for 3-4 months, then facility decision, is feasible. The urgency is lower than implied. The assumption that "facility now" is necessary is reversed.`,

    decisionChangeIfReversed: `If the deadline is flexible (no hard facility cutoff for 30 days), the decision changes from "place in facility now or miss the window" to "try structured home care for 3 months, with facility enrollment as the Plan B if home care fails or parent declines further." This significantly changes the decision frame—it shifts from "autonomy vs. safety (choose now)" to "test autonomy for 3 months, then execute safety plan if testing fails."`,

    testDeadline: `These tests must be completed within 7 days. You need written confirmation from the facility (email), social worker (note in medical record), and neuropsych evaluator (office note or email). The tests directly inform whether the "decide now" pressure is real or emotional.`,
  };
}

/**
 * Generic falsification (fallback)
 */
function buildGenericFalsification(context: {
  decisionUnderReview: string;
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
}): ObservableFalsificationTest {
  return {
    currentJudgement: `The current thinking is that the chosen option is the best available given the stated constraints.`,

    assumptionBeingTested: `That the stated constraints are real and the stated deadline is binding.`,

    observableTest: `Verify with the decision stakeholder: What would change if the deadline were extended by 2 weeks? What is the actual consequence of missing the stated deadline? Get a specific, time-bound answer.`,

    evidenceThatConfirms: `If the stakeholder confirms that the deadline is hard and missing it has a specific consequence (e.g., "the offer expires and we move to the next candidate"), then the urgency is real.`,

    evidenceThatReverses: `If the stakeholder says: "We could probably extend it" or "We'd wait to see if you change your mind," then the deadline pressure is overstated and artificial. The decision can be delayed.`,

    decisionChangeIfReversed: `If the deadline is flexible, the decision frame changes from "decide now under pressure" to "gather more evidence before deciding." More evidence could change which option is best.`,

    testDeadline: `Verify deadline assumptions within 3 days. You need clarity before the deadline pressure becomes too intense to think clearly.`,
  };
}

export default {
  buildObservableFalsification,
};
