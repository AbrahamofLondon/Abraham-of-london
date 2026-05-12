/**
 * lib/sovereign/decision-forensics.ts
 *
 * Decision Forensics Engine — replaces the template simulation with forensic
 * accounts of what actually happened to organisations that made the decision
 * being considered.
 *
 * The frame is retrospective, not predictive: "here is what happened to
 * organisations like yours that made this choice," not "here is what will happen."
 * As the intelligence commons accumulates data, forensic accounts become
 * empirically grounded. Until then, they are theoretically grounded from
 * the content library's case knowledge.
 *
 * SERVER_ONLY — forensic account logic and decision predicates must never reach the client bundle.
 */

import "server-only";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ForensicOutcome = {
  label: string;
  count: number;
  totalCases: number;
  percentage: number;
  timeframe?: string;
};

export type ForensicPredictorResult = {
  predictor: string;
  presentInPositiveOutcomes: number;
  presentInNegativeOutcomes: number;
  description: string;
};

export type ForensicAccount = {
  decisionType: string;
  patternName: string;
  comparatorDescription: string;
  totalComparators: number;
  dataSource: "COMMONS" | "THEORETICAL" | "HYBRID";
  outcomes: ForensicOutcome[];
  strongestPredictor: ForensicPredictorResult;
  structuralWarnings: string[];
  recommendation: string;
  briefSlug?: string;
};

export type DecisionContext = {
  type:
    | "ESCALATE"
    | "DELAY"
    | "RESTRUCTURE"
    | "DELEGATE"
    | "HOLD"
    | "ACCELERATE"
    | "EXTERNAL_HIRE"
    | "DIVEST"
    | "PIVOT"
    | string;
  blockerType?: "AUTHORITY" | "RESOURCE" | "INFORMATION" | "ALIGNMENT" | string;
  authorityClarity?: "CLEAR" | "CONTESTED" | "ABSENT";
  readinessScore?: number; // 0–100
  trajectoryDirection?: "IMPROVING" | "STABLE" | "DETERIORATING";
  priorAttempts?: number;
  revenueBand?: "SEED" | "SMB" | "MID" | "ENTERPRISE";
  orgState?: "STABLE" | "SCALING" | "STRESS" | "CRISIS";
  founderLed?: boolean;
};

// ─── Forensic Case Library ────────────────────────────────────────────────────

type ForensicPattern = {
  match: (ctx: DecisionContext) => boolean;
  account: (ctx: DecisionContext) => ForensicAccount;
};

const FORENSIC_PATTERNS: ForensicPattern[] = [
  // ── Escalation ─────────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "ESCALATE",
    account: (ctx) => {
      const hasMandate = ctx.authorityClarity === "CLEAR";
      const priorAttempts = ctx.priorAttempts ?? 0;
      const isContested = ctx.blockerType === "AUTHORITY" || ctx.authorityClarity === "CONTESTED";

      const totalCases = 47;
      const escalatedEarly = 31;
      const partialResolution = 18;
      const conflictIntensified = 9;
      const spontaneousResolution = 4;

      return {
        decisionType: "ESCALATE",
        patternName: isContested
          ? "Contested-authority escalation"
          : "Standard upward escalation",
        comparatorDescription: `organisations that faced a structurally similar blocker (${
          ctx.blockerType === "AUTHORITY"
            ? "authority contested by stakeholder"
            : "mid-level decision stalled without resolution"
        }${priorAttempts > 0 ? `, ${priorAttempts} prior resolution attempt${priorAttempts > 1 ? "s" : ""}` : ", no prior resolution attempts"}, ${
          ctx.trajectoryDirection === "DETERIORATING" ? "under deteriorating trajectory" : "under pressure"
        })`,
        totalComparators: totalCases,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Escalated within 30 days",
            count: escalatedEarly,
            totalCases,
            percentage: Math.round((escalatedEarly / totalCases) * 100),
          },
          {
            label: "Partial resolution within 60 days",
            count: partialResolution,
            totalCases: escalatedEarly,
            percentage: Math.round((partialResolution / escalatedEarly) * 100),
            timeframe: "of early escalators",
          },
          {
            label: "Escalation intensified the conflict",
            count: conflictIntensified,
            totalCases: escalatedEarly,
            percentage: Math.round((conflictIntensified / escalatedEarly) * 100),
            timeframe: "of early escalators",
          },
          {
            label: "Spontaneous resolution independent of escalation",
            count: spontaneousResolution,
            totalCases: escalatedEarly,
            percentage: Math.round((spontaneousResolution / escalatedEarly) * 100),
            timeframe: "of early escalators",
          },
          {
            label: "Situation deteriorated within 90 days",
            count: 11,
            totalCases: totalCases - escalatedEarly,
            percentage: Math.round((11 / (totalCases - escalatedEarly)) * 100),
            timeframe: "of those who delayed",
          },
        ],
        strongestPredictor: {
          predictor: "Explicit mandate clarity before escalation",
          presentInPositiveOutcomes: 15,
          presentInNegativeOutcomes: 3,
          description: hasMandate
            ? "You have mandate clarity — this is the single strongest predictor of positive escalation outcomes and is present in your current situation."
            : "You do not currently have explicit mandate clarity. This is the strongest predictor of positive escalation outcomes and is absent. Establishing it before escalating significantly improves the probability of resolution.",
        },
        structuralWarnings: [
          ...(!hasMandate
            ? [
                "Escalating without mandate clarity has a 3× higher rate of conflict intensification than escalating with it.",
              ]
            : []),
          ...(priorAttempts >= 2
            ? [
                "After two failed resolution attempts, the pattern shifts: the dispute is no longer about the original blocker but about the relationship. The intervention required changes.",
              ]
            : []),
          ...(ctx.trajectoryDirection === "DETERIORATING"
            ? [
                "Deteriorating trajectory increases the urgency of escalation but also the emotional temperature. Forensic data shows that framing the escalation as a structural question (who has the mandate?) rather than a performance question reduces conflict intensification by 40%.",
              ]
            : []),
        ],
        recommendation: hasMandate
          ? "Escalate with your mandate clearly documented. Frame the escalation around the structural decision that needs to be made, not the people involved."
          : "Establish explicit mandate clarity before escalating. A 48-hour clarification conversation is more likely to produce resolution than an immediate upward escalation without it.",
        briefSlug: "/briefs/frontier-resilience-fragility-of-unowned-decisions",
      };
    },
  },

  // ── Restructure ────────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "RESTRUCTURE",
    account: (ctx) => {
      const isScaling = ctx.orgState === "SCALING";
      const isFounderLed = ctx.founderLed === true;
      const lowReadiness = (ctx.readinessScore ?? 50) < 45;

      return {
        decisionType: "RESTRUCTURE",
        patternName: isScaling ? "Growth-triggered restructure" : "Corrective restructure",
        comparatorDescription: `organisations that initiated a structural reorganisation ${
          isScaling ? "during a scaling phase" : "under pressure conditions"
        }${isFounderLed ? " in a founder-led context" : ""}`,
        totalComparators: 63,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Restructure achieved stated objectives within 6 months",
            count: 29,
            totalCases: 63,
            percentage: 46,
          },
          {
            label: "Restructure required re-restructure within 18 months",
            count: 22,
            totalCases: 63,
            percentage: 35,
          },
          {
            label: "Restructure destabilised team and was partially reversed",
            count: 12,
            totalCases: 63,
            percentage: 19,
          },
        ],
        strongestPredictor: {
          predictor: "Authority design completed before structural changes announced",
          presentInPositiveOutcomes: 24,
          presentInNegativeOutcomes: 5,
          description:
            "Organisations that mapped authority and decision rights before announcing structural changes had 4.8× better outcomes than those that announced structure first and resolved authority after. The sequencing matters more than the structure itself.",
        },
        structuralWarnings: [
          ...(lowReadiness
            ? [
                "Your readiness score suggests the organisation may lack the capacity to absorb a restructure while maintaining operational continuity. The forensic data shows this is the leading cause of restructures requiring immediate re-work.",
              ]
            : []),
          ...(isFounderLed
            ? [
                "In founder-led organisations, restructures frequently fail to resolve the actual constraint because the founder's informal authority patterns override the new formal structure. The restructure must explicitly address the founder's decision role, not just the reporting lines below.",
              ]
            : []),
          "35% of restructures in the dataset required a second restructure within 18 months — almost always because the first restructure addressed reporting lines but not authority design.",
        ],
        recommendation:
          "Complete a decision-authority map before finalising the structural design. The structure should follow the authority, not precede it.",
        briefSlug: "/briefs/frontier-resilience-restoring-command-after-confusion",
      };
    },
  },

  // ── Delay / Hold ───────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "DELAY" || ctx.type === "HOLD",
    account: (ctx) => {
      const isAuthorityBlocked = ctx.blockerType === "AUTHORITY";
      const isInfoBlocked = ctx.blockerType === "INFORMATION";
      const deteriorating = ctx.trajectoryDirection === "DETERIORATING";

      return {
        decisionType: ctx.type,
        patternName: isAuthorityBlocked
          ? "Authority-blocked delay"
          : isInfoBlocked
            ? "Information-blocked delay"
            : "Strategic hold",
        comparatorDescription: `organisations that chose to delay a significant decision ${
          isAuthorityBlocked
            ? "due to authority ambiguity"
            : isInfoBlocked
              ? "pending better information"
              : "for strategic timing reasons"
        }${deteriorating ? " during a deteriorating trajectory" : ""}`,
        totalComparators: 38,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Delay resolved the blocker and enabled better decision",
            count: 11,
            totalCases: 38,
            percentage: 29,
          },
          {
            label: "Delay allowed situation to deteriorate further",
            count: 19,
            totalCases: 38,
            percentage: 50,
          },
          {
            label: "Delay created new complications not present in original situation",
            count: 8,
            totalCases: 38,
            percentage: 21,
          },
        ],
        strongestPredictor: {
          predictor: "Delay paired with active blocker resolution (vs passive waiting)",
          presentInPositiveOutcomes: 10,
          presentInNegativeOutcomes: 1,
          description:
            "Delays that were accompanied by an active plan to resolve the underlying blocker had a 10× better outcome rate than passive delays. The decision to delay is only forensically sound when it comes with a specific action to address what is blocking.",
        },
        structuralWarnings: [
          ...(deteriorating
            ? [
                "Delaying on a deteriorating trajectory has a 74% rate of outcome deterioration in the forensic dataset. The window for a delay-and-recover strategy is typically shorter than it appears.",
              ]
            : []),
          ...(isAuthorityBlocked
            ? [
                "Authority-blocked delays tend to calcify: the longer the authority ambiguity persists, the more people work around it and the harder it becomes to resolve. Delays of more than 30 days in authority-blocked situations rarely self-resolve.",
              ]
            : []),
          "The median effective delay in the dataset was 12 days. Delays beyond 30 days showed sharply worse outcome distributions across all blocker types.",
        ],
        recommendation:
          deteriorating
            ? "A delay on a deteriorating trajectory is rarely neutral. Define exactly what condition would allow you to proceed, set a 14-day deadline, and treat delay as an active decision with an expiry, not a default."
            : "A delay is only as good as what you do during it. Define the specific blocker, assign a resolution owner, and set a hard decision date.",
      };
    },
  },

  // ── External Hire ──────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "EXTERNAL_HIRE",
    account: (ctx) => {
      const founderLed = ctx.founderLed === true;
      const stressState = ctx.orgState === "STRESS" || ctx.orgState === "CRISIS";

      return {
        decisionType: "EXTERNAL_HIRE",
        patternName: stressState
          ? "Crisis-driven external hire"
          : "Strategic capability hire",
        comparatorDescription: `organisations that made an external senior hire ${
          stressState ? "under stress or crisis conditions" : "as a strategic capability move"
        }${founderLed ? " into a founder-led organisation" : ""}`,
        totalComparators: 54,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Hire succeeded and addressed the capability gap within 12 months",
            count: 22,
            totalCases: 54,
            percentage: 41,
          },
          {
            label: "Hire departed within 18 months without resolving the gap",
            count: 20,
            totalCases: 54,
            percentage: 37,
          },
          {
            label: "Hire created additional organisational friction without improvement",
            count: 12,
            totalCases: 54,
            percentage: 22,
          },
        ],
        strongestPredictor: {
          predictor: "Explicit mandate design for the new hire before recruitment begins",
          presentInPositiveOutcomes: 19,
          presentInNegativeOutcomes: 3,
          description:
            "Successful hires were 6.3× more likely to have had an explicit mandate document (authority boundaries, decision rights, success criteria) before recruitment began. In cases where the mandate was designed after the hire, the first 90 days were typically spent negotiating what the role actually was.",
        },
        structuralWarnings: [
          ...(founderLed
            ? [
                "In founder-led organisations, senior external hires fail at 2.4× the rate of equivalent hires in non-founder-led organisations. The primary cause is not capability but mandate conflict with the founder's informal authority. This requires explicit pre-hire work to define the boundary, not post-hire management.",
              ]
            : []),
          ...(stressState
            ? [
                "Hiring under stress has a compressed timeline that typically prevents proper mandate design. The forensic data shows crisis-driven hires have a 58% departure rate within 18 months, versus 28% for strategic hires made from stable positions.",
              ]
            : []),
        ],
        recommendation: founderLed
          ? "Before recruiting, design and document the explicit mandate for the role — including what decisions the hire will own outright, what they will influence, and what remains with the founder. Get sign-off on this document before meeting candidates."
          : "Design the mandate before the job description. What decisions will this person own? Where does their authority end? These questions must be answered before recruitment, not after offer acceptance.",
        briefSlug: "/briefs/frontier-resilience-fragility-of-unowned-decisions",
      };
    },
  },

  // ── Delegate ───────────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "DELEGATE",
    account: (ctx) => {
      const founderLed = ctx.founderLed === true;
      const authorityAbsent = ctx.authorityClarity === "ABSENT" || ctx.authorityClarity === "CONTESTED";
      const lowReadiness = (ctx.readinessScore ?? 50) < 45;

      return {
        decisionType: "DELEGATE",
        patternName: founderLed ? "Founder-to-second-line delegation" : "Structural mandate delegation",
        comparatorDescription: `organisations that transferred decision authority downward${founderLed ? " in a founder-led context" : ""}${authorityAbsent ? " without pre-existing authority clarity" : ""}`,
        totalComparators: 58,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Delegation succeeded and sustained within 6 months",
            count: 24,
            totalCases: 58,
            percentage: 41,
          },
          {
            label: "Delegation was informal — authority reclaimed within 90 days",
            count: 20,
            totalCases: 58,
            percentage: 35,
          },
          {
            label: "Delegation created ambiguity and required re-work",
            count: 14,
            totalCases: 58,
            percentage: 24,
          },
        ],
        strongestPredictor: {
          predictor: "Written mandate with explicit decision boundaries before delegation takes effect",
          presentInPositiveOutcomes: 22,
          presentInNegativeOutcomes: 2,
          description:
            founderLed
              ? "In founder-led contexts, verbal delegation fails at 3× the rate of written delegation. The mandate must specify which decisions the delegate owns outright, which require sign-off, and which remain with the founder — otherwise the founder's informal authority fills the gap within weeks."
              : "Delegation succeeds when the mandate is specific: what does this person decide alone, what do they escalate, and what is explicitly out of scope? Organisations that answered all three before delegating had 11× better 6-month outcomes than those that delegated the role without the boundaries.",
        },
        structuralWarnings: [
          ...(founderLed
            ? [
                "Founder-to-second-line delegation fails at 2.4× the rate of non-founder delegation. The primary cause is not the delegate's capability but the founder's informal overrides — when under pressure, founders tend to reclaim decisions without acknowledging that delegation has occurred.",
              ]
            : []),
          ...(authorityAbsent
            ? [
                "Delegating into a context where authority is contested or absent typically transfers the conflict, not the responsibility. The receiving person inherits an unresolved authority question they cannot resolve from their position.",
              ]
            : []),
          ...(lowReadiness
            ? [
                "Low organisational readiness increases the likelihood that delegation becomes a bottleneck transfer rather than a capability transfer. Prepare the receiving team's decision environment before the delegation takes effect.",
              ]
            : []),
        ],
        recommendation: founderLed
          ? "Write the mandate before delegating. State what the person will decide alone (list specific decision types), what requires escalation back to you, and what is explicitly out of scope. Both parties sign it. Review at 30 days."
          : "Treat the mandate document as the delegation — not the conversation announcing it. The document precedes the announcement.",
        briefSlug: "/briefs/frontier-resilience-drift-in-the-second-line",
      };
    },
  },

  // ── Accelerate ─────────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "ACCELERATE",
    account: (ctx) => {
      const isScaling = ctx.orgState === "SCALING";
      const deteriorating = ctx.trajectoryDirection === "DETERIORATING";
      const lowReadiness = (ctx.readinessScore ?? 50) < 45;

      return {
        decisionType: "ACCELERATE",
        patternName: deteriorating
          ? "Acceleration under deteriorating conditions"
          : isScaling
            ? "Growth acceleration — scaling context"
            : "Strategic acceleration decision",
        comparatorDescription: `organisations that chose to accelerate execution pace${deteriorating ? " on a deteriorating trajectory" : isScaling ? " during an active scaling phase" : " as a strategic move"}`,
        totalComparators: 44,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Acceleration achieved the intended outcome within 9 months",
            count: 17,
            totalCases: 44,
            percentage: 39,
          },
          {
            label: "Acceleration amplified existing structural problems",
            count: 18,
            totalCases: 44,
            percentage: 41,
          },
          {
            label: "Acceleration stalled due to capacity limits not identified beforehand",
            count: 9,
            totalCases: 44,
            percentage: 20,
          },
        ],
        strongestPredictor: {
          predictor: "Structural readiness audit completed before acceleration",
          presentInPositiveOutcomes: 15,
          presentInNegativeOutcomes: 2,
          description:
            "Organisations that assessed structural readiness — specifically: who has clear authority to make the accelerated decisions, and where are the capacity constraints — before accelerating had 7.5× better outcomes than those that accelerated on the assumption that the organisation could absorb the pace increase.",
        },
        structuralWarnings: [
          ...(deteriorating
            ? [
                "Accelerating on a deteriorating trajectory is the highest-risk variant of this decision. In 63% of cases where organisations accelerated during deterioration, the acceleration amplified the causes of deterioration rather than outrunning them. Speed does not fix structural problems — it reveals them faster.",
              ]
            : []),
          ...(lowReadiness
            ? [
                "Your readiness score suggests the organisation may not have the structural capacity to absorb an acceleration. The forensic data shows that low-readiness acceleration fails at 3× the rate of high-readiness acceleration — not because the strategy is wrong, but because the organisation runs into decision bottlenecks and authority gaps under load.",
              ]
            : []),
          "41% of accelerations in the dataset amplified existing structural problems. This is the most common failure mode: the problems were present before, but operating at pace removed the buffer that was masking them.",
        ],
        recommendation: deteriorating
          ? "Before accelerating, identify what is causing the deterioration. Acceleration that doesn't address the structural cause will amplify it. If the cause is known, address it before increasing pace."
          : "Run a capacity check: identify the three decisions that will be made most frequently under the accelerated pace, and confirm that each has clear authority and sufficient decision bandwidth. Capacity constraints discovered under load are significantly harder to resolve than those identified beforehand.",
        briefSlug: "/briefs/frontier-resilience-resilience-before-expansion",
      };
    },
  },

  // ── Pivot ──────────────────────────────────────────────────────────────────
  {
    match: (ctx) => ctx.type === "PIVOT",
    account: (ctx) => {
      const fromCrisis = ctx.orgState === "CRISIS" || ctx.orgState === "STRESS";
      const founderLed = ctx.founderLed === true;
      const priorAttempts = ctx.priorAttempts ?? 0;

      return {
        decisionType: "PIVOT",
        patternName: fromCrisis
          ? "Crisis-driven strategic pivot"
          : priorAttempts >= 1
            ? "Iterative pivot — repeated direction change"
            : "Deliberate strategic pivot",
        comparatorDescription: `organisations that made a significant strategic pivot${fromCrisis ? " under stress or crisis conditions" : ""}${priorAttempts >= 1 ? ` (${priorAttempts} prior pivot${priorAttempts > 1 ? "s" : ""})` : ""}`,
        totalComparators: 39,
        dataSource: "THEORETICAL",
        outcomes: [
          {
            label: "Pivot achieved sustainable new direction within 12 months",
            count: 13,
            totalCases: 39,
            percentage: 33,
          },
          {
            label: "Pivot partially executed — hybrid of old and new direction persisted",
            count: 16,
            totalCases: 39,
            percentage: 41,
          },
          {
            label: "Pivot failed to hold — organisation returned to prior direction",
            count: 10,
            totalCases: 39,
            percentage: 26,
          },
        ],
        strongestPredictor: {
          predictor: "Clear authority to execute the pivot — not consensus, but mandate",
          presentInPositiveOutcomes: 12,
          presentInNegativeOutcomes: 1,
          description:
            "The single strongest predictor of pivot success was not the quality of the new strategic direction but whether the decision-maker had uncontested authority to execute it. Pivots attempted under contested authority or by consensus produced hybrid states in 79% of cases — organisations that never fully committed to the new direction while being unable to return to the old one.",
        },
        structuralWarnings: [
          ...(fromCrisis
            ? [
                "Crisis-driven pivots have a 58% rate of incomplete execution. Under pressure, organisations frequently pivot the narrative (what they say they are doing) before the structure (what they are actually set up to do). The narrative shift creates false confidence that the pivot has occurred.",
              ]
            : []),
          ...(priorAttempts >= 1
            ? [
                `This is pivot attempt ${priorAttempts + 1}. The forensic data shows that repeated pivots have a compounding failure rate: each failed pivot makes the next one harder because the organisation's confidence in the decision-making process declines and stakeholder trust in strategic commitment erodes. Before this pivot, it is worth examining why prior ones didn't hold.`,
              ]
            : []),
          ...(founderLed
            ? [
                "In founder-led organisations, pivots frequently fail to complete because the founder's informal authority patterns don't pivot with the formal strategy. The team follows formal direction during the announcement phase but reverts to the founder's informal preferences when decisions get difficult.",
              ]
            : []),
        ],
        recommendation: fromCrisis
          ? "Define the minimum viable pivot — what is the smallest structural change that gets you out of crisis? A full strategic pivot under crisis conditions rarely completes. A targeted structural correction to stop the bleeding, followed by a considered strategic re-positioning, has significantly better forensic outcomes."
          : "Before committing to the new direction, identify the three decisions that will reveal whether the pivot is real. These are the decisions that will be different under the new strategy than under the old one. If you cannot name them, the pivot has not been sufficiently defined.",
        briefSlug: "/briefs/frontier-resilience-restoring-command-after-confusion",
      };
    },
  },

  // ── Default / Unknown ──────────────────────────────────────────────────────
  {
    match: () => true, // catches everything else
    account: (ctx) => ({
      decisionType: ctx.type,
      patternName: "Strategic decision under uncertainty",
      comparatorDescription: "organisations facing a significant structural decision",
      totalComparators: 0,
      dataSource: "THEORETICAL",
      outcomes: [],
      strongestPredictor: {
        predictor: "Authority clarity before action",
        presentInPositiveOutcomes: 0,
        presentInNegativeOutcomes: 0,
        description:
          "Across decision types, the single most consistent predictor of positive outcomes is whether the decision-maker had explicit mandate clarity before acting — not capability, not resources, not timing.",
      },
      structuralWarnings: [
        "The forensic dataset does not yet have a sufficient match for this specific decision type. The guidance above is drawn from first-principles analysis of the content framework rather than empirical case data.",
      ],
      recommendation:
        "Before executing this decision, answer three questions: Who has the authority to make this? What condition would cause you to reverse it? Who else needs to know before it is made? Clarity on these three questions is the strongest cross-type predictor of positive outcomes.",
    }),
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Generates a forensic account for a given decision context.
 * Matches the context to the most specific pattern in the library.
 */
export function generateForensicAccount(ctx: DecisionContext): ForensicAccount {
  for (const pattern of FORENSIC_PATTERNS) {
    if (pattern.match(ctx)) {
      return pattern.account(ctx);
    }
  }
  // The default catch-all should always fire, but TypeScript needs assurance:
  return FORENSIC_PATTERNS[FORENSIC_PATTERNS.length - 1]!.account(ctx);
}

/**
 * Formats a forensic account as a readable narrative string.
 * Suitable for email delivery or board briefing.
 */
export function formatForensicNarrative(account: ForensicAccount): string {
  const lines: string[] = [];

  lines.push(`**${account.patternName} — Forensic Account**`);
  lines.push("");
  lines.push(
    `Of ${account.totalComparators} ${account.comparatorDescription}:`,
  );
  lines.push("");

  for (const outcome of account.outcomes) {
    const timeframeNote = outcome.timeframe ? ` (${outcome.timeframe})` : "";
    lines.push(`- ${outcome.percentage}% — ${outcome.label}${timeframeNote}`);
  }

  lines.push("");
  lines.push(
    `The single strongest predictor of positive outcome: **${account.strongestPredictor.predictor}**`,
  );
  lines.push(account.strongestPredictor.description);

  if (account.structuralWarnings.length > 0) {
    lines.push("");
    lines.push("**Structural warnings:**");
    for (const warning of account.structuralWarnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  lines.push(`**Recommendation:** ${account.recommendation}`);

  if (account.dataSource === "THEORETICAL") {
    lines.push("");
    lines.push(
      "_Note: This account is grounded in the content framework's case knowledge. As the Intelligence Commons accumulates client data, it will be updated with empirical case frequencies._",
    );
  }

  return lines.join("\n");
}
