/**
 * UnifiedResultSurface — shared result rendering for all assessments.
 *
 * One component → all assessments upgraded simultaneously.
 * Always shows: case banner, consequence timeline, limitations,
 * condition-based directive CTA, feedback loop.
 *
 * Does NOT replace assessment-specific result content.
 * Wraps it with the shared conversion layer.
 */

import * as React from "react";
import CaseActiveBanner from "./CaseActiveBanner";
import LimitationsBlock from "./LimitationsBlock";
import ConsequenceTimeline from "./ConsequenceTimeline";
import DirectiveCTA from "./DirectiveCTA";
import FeedbackLoop from "./FeedbackLoop";
import DeterminismProof from "@/components/Intelligence/DeterminismProof";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type UnifiedResultSurfaceProps = {
  /** Assessment type */
  assessmentType: "purpose" | "constitutional" | "team" | "enterprise" | "fast";

  /** Case reference for persistence signal */
  caseReference: string;

  /** Whether user committed to action */
  committed?: boolean;

  /** Assessment-specific result content (rendered between banner and conversion) */
  children: React.ReactNode;

  /** Consequence timeline data */
  timeline?: {
    sevenDays: string;
    thirtyDays: string;
    ninetyDays: string;
    controlShiftSummary?: string;
  };

  /** For directive CTA routing */
  conditionClass?: string;
  route?: string;
  score?: number;
  costFirst?: boolean;

  /** Custom limitations override */
  customLimitations?: string[];

  /** Spine for determinism proof (optional) */
  spine?: IntelligenceSpine | null;

  /** Feedback callback */
  onFeedback?: (response: "yes" | "partial" | "no", reason?: string) => void;
};

export default function UnifiedResultSurface({
  assessmentType,
  caseReference,
  committed,
  children,
  timeline,
  conditionClass,
  route,
  score,
  costFirst,
  customLimitations,
  spine,
  onFeedback,
}: UnifiedResultSurfaceProps) {
  return (
    <div className="space-y-0">
      {/* 1. Case Active Banner */}
      <CaseActiveBanner
        caseReference={caseReference}
        committed={committed}
        assessmentType={assessmentType}
      />

      {/* 2. Assessment-specific result content */}
      {children}

      {/* 3. Consequence Timeline */}
      {timeline && (
        <ConsequenceTimeline
          sevenDays={timeline.sevenDays}
          thirtyDays={timeline.thirtyDays}
          ninetyDays={timeline.ninetyDays}
          controlShiftSummary={timeline.controlShiftSummary}
        />
      )}

      {/* 4. Limitations Block */}
      <LimitationsBlock
        assessmentType={assessmentType}
        customLimitations={customLimitations}
      />

      {/* 5. Directive CTA */}
      <DirectiveCTA
        assessmentType={assessmentType}
        conditionClass={conditionClass}
        route={route}
        score={score}
        costFirst={costFirst}
      />

      {/* 6. Determinism Proof (if spine available) */}
      {spine && (
        <div className="mt-6">
          <DeterminismProof spine={spine} compact />
        </div>
      )}

      {/* 7. Feedback Loop */}
      <FeedbackLoop
        assessmentType={assessmentType}
        onFeedback={onFeedback}
      />
    </div>
  );
}
