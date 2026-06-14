/**
 * Intervention Calibration Engine
 *
 * Recommends the right intervention based on:
 * - Strategic Twin state (decision context, contradictions, readiness)
 * - Decision Memory (past events, commitments, outcomes)
 * - Evidence availability
 * - Pattern recurrence
 * - Consequence risk
 *
 * This is the strategic moat: competitors give one-size-fits-all advice.
 * This engine tailors to each case's unique context.
 */

import {
  InterventionCalibration,
  InterventionLevel,
  CalibrationContext,
  INTERVENTION_CALIBRATION_RULES,
} from "./intervention-calibration-contract";
import strategicTwinLoader from "../strategic-twin/strategic-twin-state-loader";
import decisionMemoryStore from "../decision-memory/decision-memory-store";

export class InterventionCalibrationEngine {
  /**
   * Calibrate the right intervention level for a case
   */
  calibrate(context: CalibrationContext, productCode?: string): InterventionCalibration {
    // Load current state
    const twin = strategicTwinLoader.loadTwinState(context.caseId);
    const memory = decisionMemoryStore.query({
      caseId: context.caseId,
    });

    // Compute recommendations
    const recommendation = this.computeRecommendation(context, twin, memory);

    // Build the calibration response
    const calibration: InterventionCalibration = {
      caseId: context.caseId,
      calibratedAt: new Date().toISOString(),
      calibratingProductCode: productCode || "",
      recommendedLevel: recommendation.level,
      reason: recommendation.reason,
      reasoning: {
        evidenceState: this.assessEvidenceState(context),
        patternRisk: this.assessPatternRisk(context, memory),
        readinessLevel: this.assessReadinessLevel(twin),
        consequenceRisk: context.consequenceRisk,
        timelinessFactors: this.assessTimelinessFactors(context),
      },
      evidenceNeeded: this.identifyEvidenceGaps(twin, memory),
      estimatedTimeToEvidence: this.estimateEvidenceTimeline(context),
      unsuitableInterventions: recommendation.unsuitableInterventions,
      unsuitableReasons: recommendation.unsuitableReasons,
      riskIfDelayed: this.assessDeferralRisk(context, twin),
      recommendedFollowupAt: this.calculateFollowupDate(context),
      boundaryNotice: this.getBoundaryNotice(context),
    };
    return calibration;
  }

  /**
   * Compute the recommended intervention level
   */
  private computeRecommendation(
    context: CalibrationContext,
    twin: any,
    memory: any
  ): {
    level: InterventionLevel;
    reason: string;
    unsuitableInterventions: InterventionLevel[];
    unsuitableReasons: string[];
  } {
    // Apply decision tree
    if (context.evidenceAvailability < 0.2) {
      return {
        level: "free_signal",
        reason: "Pattern recognized but evidence is minimal; recommend data collection before deeper intervention",
        unsuitableInterventions: [
          "reporting_output",
          "execution_governance",
          "board_facing_draft",
        ],
        unsuitableReasons: [
          "Cannot produce credible report without evidence",
          "Cannot execute governance without decision made",
          "Cannot brief board with incomplete evidence",
        ],
      };
    }

    if (context.decisionPressure === "critical") {
      if (context.evidenceAvailability > 0.7) {
        return {
          level: "board_facing_draft",
          reason: "Critical decision pressure with substantial evidence; escalate to board-facing analysis",
          unsuitableInterventions: [
            "free_signal",
            "evidence_limited_review",
            "diagnostic_deepening",
          ],
          unsuitableReasons: [
            "Situation requires escalation above advisory signal",
            "Board decision pending, need structured analysis",
            "Timing does not permit deeper diagnostic",
          ],
        };
      } else {
        return {
          level: "blocked_until_evidence",
          reason: "Critical decision pending but insufficient evidence; deferral required for credibility",
          unsuitableInterventions: [
            "reporting_output",
            "execution_governance",
            "board_facing_draft",
          ],
          unsuitableReasons: [
            "Risk of proceeding with inadequate evidence unacceptable",
            "Credibility loss from inadequate analysis not justified by speed",
          ],
        };
      }
    }

    if (context.patternRecurrenceCount > 2) {
      if (context.evidenceAvailability > 0.5) {
        return {
          level: "diagnostic_deepening",
          reason: "Repeated pattern with growing evidence; structured diagnosis needed to break recurrence",
          unsuitableInterventions: [
            "free_signal",
            "evidence_limited_review",
          ],
          unsuitableReasons: [
            "Advisory signal insufficient for recurrence patterns",
            "Limited review inadequate for repeated issue",
          ],
        };
      } else {
        return {
          level: "evidence_limited_review",
          reason: "Repeated pattern but evidence gaps remain; structured review of available evidence",
          unsuitableInterventions: ["free_signal"],
          unsuitableReasons: ["Advisory insufficient for recurring issue"],
        };
      }
    }

    // Default path: medium-pressure, partial evidence
    if (context.evidenceAvailability > 0.5) {
      return {
        level: "reporting_output",
        reason: "Sufficient evidence and clear decision need; structured decision support appropriate",
        unsuitableInterventions: [
          "free_signal",
          "blocked_until_evidence",
        ],
        unsuitableReasons: [
          "Evidence available, escalate above advisory",
          "Decision needed, evidence sufficient",
        ],
      };
    }

    // Low evidence, moderate pressure: evidence-limited review
    return {
      level: "evidence_limited_review",
      reason: "Partial evidence available; structured review under clear boundaries",
      unsuitableInterventions: [
        "reporting_output",
        "execution_governance",
        "board_facing_draft",
      ],
      unsuitableReasons: [
        "Incomplete evidence cannot support full report",
        "Cannot execute governance with uncertain foundation",
        "Board decision requires more complete evidence",
      ],
    };
  }

  /**
   * Assess evidence state
   */
  private assessEvidenceState(context: CalibrationContext): string {
    if (context.evidenceAvailability < 0.2) {
      return "Minimal evidence available; pattern recognized but unvalidated";
    }
    if (context.evidenceAvailability < 0.5) {
      return "Partial evidence available with significant gaps; adequate for structured review";
    }
    if (context.evidenceAvailability < 0.8) {
      return "Substantial evidence available; some gaps remain manageable";
    }
    return "Comprehensive evidence available; confidence in analysis high";
  }

  /**
   * Assess pattern risk from memory
   */
  private assessPatternRisk(context: CalibrationContext, memory: any): string {
    const recurrenceCount = context.patternRecurrenceCount;

    if (recurrenceCount === 0) {
      return "First occurrence of pattern; low historical risk";
    }
    if (recurrenceCount <= 2) {
      return "Pattern emerged 2–3 times; moderate recurrence risk";
    }
    return `Pattern recurred ${recurrenceCount} times; high systemic risk; root cause requires investigation`;
  }

  /**
   * Assess readiness level from twin state
   */
  private assessReadinessLevel(twin: any): string {
    if (!twin) {
      return "No prior state; starting fresh";
    }

    return `Current readiness: ${twin.currentInterventionReadiness}. Reason: ${twin.readinessReason}`;
  }

  /**
   * Assess timeliness factors
   */
  private assessTimelinessFactors(context: CalibrationContext): string {
    const factors: string[] = [];

    if (context.timelineConstraint) {
      factors.push(`Timeline constraint: ${context.timelineConstraint}`);
    }
    if (context.budgetConstraint) {
      factors.push(`Budget constraint: ${context.budgetConstraint}`);
    }
    if (context.decisionPressure === "critical") {
      factors.push("Critical decision pressure limits deferral window");
    }

    return factors.length > 0
      ? factors.join("; ")
      : "No immediate timeline pressure";
  }

  /**
   * Identify evidence gaps
   */
  private identifyEvidenceGaps(twin: any, memory: any): string[] {
    const gaps: string[] = [];

    if (twin && twin.activeEvidenceGaps) {
      gaps.push(...twin.activeEvidenceGaps);
    }

    if (memory && memory.evidenceGaps) {
      memory.evidenceGaps.forEach((gap: any) => {
        if (!gaps.includes(gap.key)) {
          gaps.push(gap.key);
        }
      });
    }

    if (gaps.length === 0) {
      gaps.push("Evidence gaps unclear; diagnostic deepening recommended");
    }

    return gaps;
  }

  /**
   * Estimate timeline to evidence
   */
  private estimateEvidenceTimeline(context: CalibrationContext): string {
    if (context.evidenceAvailability > 0.7) {
      return "Evidence largely available; focus on analysis";
    }
    if (context.subjectType === "individual") {
      return "2–4 weeks for individual-focused evidence collection";
    }
    if (context.subjectType === "team") {
      return "3–6 weeks for team-level evidence collection";
    }
    return "4–8 weeks for organisational evidence collection";
  }

  /**
   * Assess deferral risk
   */
  private assessDeferralRisk(context: CalibrationContext, twin: any): string {
    if (context.decisionPressure === "critical") {
      return "High deferral cost; decision cannot wait indefinitely";
    }
    if (context.decisionPressure === "high") {
      return "Moderate deferral cost; window of 4–8 weeks available";
    }
    if (context.decisionPressure === "medium") {
      return "Low deferral cost; strategic deliberation possible";
    }
    return "Minimal time pressure; evidence collection can proceed at natural pace";
  }

  /**
   * Calculate next followup date
   */
  private calculateFollowupDate(context: CalibrationContext): string {
    const daysOut =
      context.decisionPressure === "critical"
        ? 7
        : context.decisionPressure === "high"
          ? 14
          : context.decisionPressure === "medium"
            ? 28
            : 60;

    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + daysOut);
    return followupDate.toISOString().substring(0, 10);
  }

  /**
   * Get boundary notice
   */
  private getBoundaryNotice(context: CalibrationContext): string {
    const notices: string[] = [];

    if (context.evidenceAvailability < 0.5) {
      notices.push(
        "Evidence is incomplete; analysis informs decision but does not guarantee outcome"
      );
    }
    if (context.patternRecurrenceCount > 0) {
      notices.push(
        "Pattern has recurred; investigate root cause to prevent future recurrence"
      );
    }
    if (context.consequenceRisk === "high" || context.consequenceRisk === "critical") {
      notices.push(
        "Consequence risk is elevated; verification governance required post-decision"
      );
    }

    return notices.length > 0
      ? notices.join("; ")
      : "No special boundary constraints identified";
  }
}

export default new InterventionCalibrationEngine();
