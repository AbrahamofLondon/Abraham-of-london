/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/diagnostics/executive-reporting/run.tsx

import type { GetServerSideProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { trackStageStart, trackStageComplete, trackDropoff } from "@/lib/analytics/funnel";
import { track } from "@/lib/analytics/track";
import { useInterpretation } from "@/lib/ai/use-interpretation";
import {
  mergeExecutiveFindingsIntoThread,
  readConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import EngagementReadinessPanel from "@/components/diagnostics/results/EngagementReadinessPanel";
import LongitudinalIntelligence from "@/components/diagnostics/results/LongitudinalIntelligence";
import MultiStakeholderDivergence from "@/components/diagnostics/results/MultiStakeholderDivergence";
import OutcomeVerification from "@/components/diagnostics/results/OutcomeVerification";
import LadderProgressionGate from "@/components/diagnostics/results/LadderProgressionGate";
import PredictiveConsequence from "@/components/diagnostics/results/PredictiveConsequence";
import AITerrainExposure from "@/components/diagnostics/results/AITerrainExposure";
import DecisionTerrainStatus, { deriveTerrainState } from "@/components/diagnostics/results/DecisionTerrainStatus";
import { assessAITerrain } from "@/lib/diagnostics/ai-terrain";
import { assessAdvantageTerrain } from "@/lib/diagnostics/advantage-terrain";
import CompetitivePositionSignal from "@/components/diagnostics/results/CompetitivePosition";
import BoardSnapshot from "@/components/diagnostics/results/BoardSnapshot";
import BoardroomModeSurface from "@/components/reporting/boardroom/BoardroomModeSurface";
import AdvantagePathBlock from "@/components/strategy-room/AdvantagePathBlock";
import RetainerEntryGate from "@/components/strategy-room/RetainerEntryGate";
import { evaluateRetainerQualification } from "@/lib/retainer/qualification";
import { projectConsequence } from "@/lib/diagnostics/predictive-consequence";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";
import { useInstitutionalLayers } from "@/hooks/useInstitutionalLayers";
import { inferTrajectory, deriveEngagementReadiness, type EngagementReadiness } from "@/lib/diagnostics/prognosis";
import { buildBasisOfBrief } from "@/lib/positioning/proof-model";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  ChevronRight,
  Lock,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";
import InheritedThreadContext from "@/components/diagnostics/results/InheritedThreadContext";
import BoundaryProximityLine, {
  boundaryProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";
import ProofCapturePrompt from "@/components/proof/ProofCapturePrompt";
import StrategyRoomConversionBridge from "@/components/strategy-room/StrategyRoomConversionBridge";
import GovernanceEvidenceCarryForward from "@/components/strategy-room/GovernanceEvidenceCarryForward";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";
import {
  setCommercialAccessCookie,
  verifyCheckoutSessionForProduct,
} from "@/lib/server/billing/commercial-access";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";
import {
  extractAssessmentEvidenceCapture,
  mergeAssessmentEvidenceCapture,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import { buildGovernedMemoryFromEvidenceCapture } from "@/lib/product/governed-memory-presenter";
import { computeIrreversibilityIndex } from "@/lib/product/irreversibility-index";

type ExecutiveReportingIntakeForm = {
  // Identity (minimal)
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  sector: string;
  // Structured context
  authorityScope: string;
  boardInvolved: string;
  revenueBand: string;
  decisionWindow: string;
  headcountAffected: string;
  stakeholderBreadth: string;
  // High-yield free-text — each has a direct downstream consumer
  /** Consumer: position statement, contradiction map */
  decisionQuestion: string;
  /** Consumer: consequence pricing, cost of delay */
  whatHappensIfNothingChanges: string;
  /** Consumer: priority stack constraints, action sequencing */
  currentConstraint: string;
  /** Consumer: pattern engine, correction history */
  priorAttemptOutcome: string;
  /** Consumer: outcome verification, return brief anchor */
  verificationCriteria: string;
  // Legacy fields (maintained for API compat, not shown in form)
  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  sponsorNameOrSeat: string;
  marketExposure: string;
  estimatedExposureGBP: string;
  evidenceQuality: string;
  evidenceNotes: string;
};

type ExecutiveReportRecommendationView = {
  id: string;
  title: string;
  type: string;
  kind: string;
  description: string;
  priority: "high" | "medium" | "low";
  href?: string | null;
  score: number;
  reasons: string[];
};

type ExecutiveReportAssetView = {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  href?: string | null;
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
};

type ExecutiveReportViewModel = {
  header: {
    reportId: string;
    organisationName: string;
    title: string;
    subtitle: string;
    generatedAt: string;
    classification: string;
    route: string;
    authorityType: string;
    readinessTier: string;
    confidence: number;
  };
  summary: {
    state: string;
    headline: string;
    summary: string;
    mandate: string;
    primaryConstraint?: string;
    structuralImplication?: string;
    routeReason?: string;
    failureModes: string[];
    priorityStack: string[];
    requiredInterventions: string[];
    dominantDomains: string[];
    rationale: string[];
  };
  telemetry: {
    averageDissonance: number;
    burnoutIndex: number;
    sovereignCertainty: number;
    authorized: boolean;
    domains: Array<{
      label: string;
      intent: number;
      reality: number;
      dissonance: number;
    }>;
  };
  financialExposure: {
    replacementCost: number;
    executionLoss: number;
    totalExposure: number;
    replacementCostFormatted: string;
    executionLossFormatted: string;
    totalExposureFormatted: string;
  };
  observedOutcomes?: {
    title: "Observed Outcomes (System Evidence)";
    processedDecisionCases: number;
    comparableCaseCount: number;
    improvedPercent: number;
    averageTimeToImprovementDays: number | null;
    failureRateWhenIgnored: number;
    medianResolutionWindowDays: number | null;
    confidence: "insufficient" | "directional" | "governed";
    statements: string[];
  };
  constitution: {
    route: string;
    confidence?: number;
    priority: string;
    temperature: string;
    orgState: string;
    posture?: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
    escalationLevel?: number;
    revenueScore: number;
    dominantDomains: string[];
    failureModes: string[];
    requiredInterventions: string[];
    sponsorTypes: string[];
    worldviewAnchors: string[];
    disqualifiersTriggered?: string[];
    escalationAllowed?: boolean;
    narrativeSummary: string;
    rationale: string[];
  };
  recommendations: {
    summary: string;
    nextAction: string;
    worldviewAnchors: string[];
    commercialUseCases: string[];
    audience: string[];
    transformationStage: string[];
    matchedAssets: ExecutiveReportAssetView[];
    recommendations: ExecutiveReportRecommendationView[];
  };

  // legacy-friendly extras
  findings?: Array<{
    domain?: string;
    severity?: string;
    headline?: string;
    reading?: string;
    signal?: string;
  }>;
  boardActions?: string[];
  nextAction?: string;
};

type CanonicalReport = {
  schemaVersion?: string;
  generatedAt?: string;
  reportId?: string;
  campaign?: {
    id?: string;
    title?: string;
    organisationName?: string;
    generatedAt?: string;
  };
  registry?: {
    model?: string;
    node?: string;
    protocol?: string;
  };
  sections?: {
    executiveSummary?: {
      title?: string;
      subtitle?: string;
      state?: string;
      headline?: string;
      summary?: string;
      mandate?: string;
    };
    constitutionalPosture?: {
      route?: string;
      priority?: string;
      temperature?: string;
      orgState?: string;
      readinessTier?: string;
      authorityType?: string;
      revenueBand?: string;
      marketRiskBand?: string;
      clarityScore?: number;
      authorityScore?: number;
      governanceScore?: number;
      escalationLevel?: number;
      revenueScore?: number;
      dominantDomains?: string[];
      failureModes?: string[];
      requiredInterventions?: string[];
      sponsorTypes?: string[];
      worldviewAnchors?: string[];
      narrativeSummary?: string;
      rationale?: string[];
    };
    strategicDomainAnalysis?: {
      averageDissonance?: number;
      domains?: Array<{
        label?: string;
        intent?: number;
        reality?: number;
        dissonance?: number;
      }>;
    };
    financialExposure?: {
      replacementCost?: number;
      executionLoss?: number;
      totalExposure?: number;
      replacementCostFormatted?: string;
      executionLossFormatted?: string;
      totalExposureFormatted?: string;
    };
    integritySnapshot?: {
      sovereignCertainty?: number;
      burnoutIndex?: number;
      averageDissonance?: number;
      authorized?: boolean;
    };
    governedRecommendations?: {
      summary?: string;
      nextAction?: string;
      rationale?: string[];
      recommendations?: Array<{
        id?: string;
        title?: string;
        href?: string | null;
        kind?: string;
        score?: number;
        summary?: string;
        reasons?: string[];
      }>;
    };
    priorityStack?: { items?: string[] };
    failureModes?: { items?: string[] };
    requiredInterventions?: { items?: string[] };
    dominantDomains?: { items?: string[] };
    worldviewAnchors?: { items?: string[] };
    sponsorTypes?: { items?: string[] };
    rationale?: { items?: string[] };
    observedOutcomeEvidence?: {
      title?: string;
      processedDecisionCases?: number;
      comparableCaseCount?: number;
      improvedPercent?: number;
      averageTimeToImprovementDays?: number | null;
      failureRateWhenIgnored?: number;
      medianResolutionWindowDays?: number | null;
      confidence?: "insufficient" | "directional" | "governed";
      statements?: string[];
    };
  };
};

type ExecutiveReportingResult =
  | {
      ok: true;
      runKey: string;
      route?: "STRATEGY" | "DIAGNOSTIC" | "REJECT";
      checkpointId?: string | null;
      canonical?: CanonicalReport;
      viewModel?: ExecutiveReportViewModel;
      entitlements?: {
        hasAccess?: boolean;
        status?: string;
        tier?: string;
        remainingRuns?: number | null;
        [key: string]: unknown;
      };
      aiAdjustedConsequence?: any;
      diagnostics?: any;
      boardroom?: {
        qualified: boolean;
        reason?: string;
        dossier?: any;
      };
    }
  | {
      ok: false;
      error: string;
    };

type PageState = "intake" | "generating" | "result";

type ExecutiveReportingRunPageProps = {
  checkoutConfirmed?: boolean;
  attribution?: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    referrer: string | null;
  };
};

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

const INITIAL: ExecutiveReportingIntakeForm = {
  fullName: "",
  email: "",
  organisation: "",
  role: "",
  sector: "",
  problemStatement: "",
  symptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  authorityScope: "",
  sponsorNameOrSeat: "",
  boardInvolved: "",
  stakeholderBreadth: "",
  revenueBand: "",
  marketExposure: "",
  estimatedExposureGBP: "",
  decisionWindow: "",
  headcountAffected: "",
  evidenceQuality: "",
  evidenceNotes: "",
  priorAttemptOutcome: "",
  verificationCriteria: "",
  decisionQuestion: "",
  whatHappensIfNothingChanges: "",
};

/* ============================================================================
   LADDER UPSTREAM CONTEXT
   Reads prior-ladder-rung results from sessionStorage in priority order
   (most recent rung wins). Canonical keys per the ladder chain in
   CLAUDE_SESSION_LOG.md section 4 and mirrored by the ladder's writers in
   pages/diagnostics/enterprise-assessment.tsx and team-assessment.tsx.
============================================================================ */

type LadderUpstreamContext = {
  source:
    | "enterprise-assessment-result"
    | "team-assessment-result"
    | "purpose-alignment-result";
  layerLabel: string;
  subjectId?: string;
  totalPct?: number;
  severity?: string;
  band?: string;
  nextRoute?: string;
  sections?: Array<{ id: string; title: string; pct: number }>;
  teamAlignmentPct?: number | null;
  overallReality?: number;
  overallLeader?: number;
  overallGap?: number;
  fragilityStatus?: string;
  percent?: number;
  evidenceCapture?: AssessmentEvidenceCapture;
};

function readLadderUpstreamContext(): LadderUpstreamContext | null {
  if (typeof window === "undefined") return null;

  const KEYS: Array<{
    key: LadderUpstreamContext["source"];
    label: string;
  }> = [
    { key: "enterprise-assessment-result", label: "Enterprise Assessment" },
    { key: "team-assessment-result", label: "Team Assessment" },
    { key: "purpose-alignment-result", label: "Purpose Alignment" },
  ];

  try {
    for (const { key, label } of KEYS) {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") continue;

      return {
        source: key,
        layerLabel: label,
        subjectId: typeof p.subjectId === "string" ? p.subjectId : undefined,
        totalPct:
          typeof p.totalPct === "number"
            ? p.totalPct
            : typeof p.pct === "number"
              ? p.pct
              : undefined,
        severity: typeof p.severity === "string" ? p.severity : undefined,
        band: typeof p.band === "string" ? p.band : undefined,
        nextRoute: typeof p.nextRoute === "string" ? p.nextRoute : undefined,
        sections: Array.isArray(p.sections) ? p.sections : undefined,
        teamAlignmentPct:
          typeof p.teamAlignmentPct === "number" ? p.teamAlignmentPct : null,
        overallReality:
          typeof p.overallReality === "number" ? p.overallReality : undefined,
        overallLeader:
          typeof p.overallLeader === "number" ? p.overallLeader : undefined,
        overallGap:
          typeof p.overallGap === "number" ? p.overallGap : undefined,
        fragilityStatus:
          typeof p.fragilityStatus === "string" ? p.fragilityStatus : undefined,
        percent: typeof p.percent === "number" ? p.percent : undefined,
        evidenceCapture: extractAssessmentEvidenceCapture(p),
      };
    }
  } catch {
    /* sessionStorage unavailable (private mode / SSR) — degrade gracefully */
  }

  return null;
}

function safeString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : defaultValue;
}

function safeNumber(value: unknown, defaultValue = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
}

function safeBoolean(value: unknown, defaultValue = false): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => safeString(item)).filter(Boolean) : [];
}

function fmtPercent(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}/100` : "—";
}

function formatDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
      }
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "11px 13px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease, background-color 250ms ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.50rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7px",
  letterSpacing: "0.36em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.26)",
};

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    />
  );
}

function Textarea({
  name,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    />
  );
}

function Select({
  name,
  value,
  onChange,
  options,
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    >
      <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>
        Select…
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: "rgb(6 6 9)" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ClaimGovernedCapabilities({ canonical }: { canonical: any }) {
  const claims = canonical?.claimDecisions;
  if (!claims) return null;

  const blocks: React.ReactNode[] = [];

  // Benchmark position — only when claim-governor permits
  if (claims.benchmarked?.allowed) {
    blocks.push(
      <div key="benchmark" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.75rem" }}>
          Benchmark position · Cohort comparison
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
          This report includes benchmark positioning against an anonymised cohort of comparable organisations. Cohort sample meets the minimum standard for governed comparison.
        </p>
      </div>,
    );
  }

  // Predictive / trajectory outlook — only when claim-governor permits
  if (claims.predictive?.allowed) {
    blocks.push(
      <div key="predictive" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.75rem" }}>
          Trajectory outlook · {claims.predictive.reason?.includes("Bounded") ? "Bounded scenario mode" : "Longitudinal projection"}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
          {claims.predictive.reason?.includes("Bounded")
            ? "Scenario outlook is derived from bounded modeling of current structural conditions. This is not a statistical forecast — it is a governed projection of three possible trajectories given the current evidence base."
            : "Trajectory projection is supported by longitudinal diagnostic depth. The outlook reflects observed movement across multiple diagnostic snapshots."}
        </p>
      </div>,
    );
  }

  // Team evidence — three-tier claim expression
  const sentimentBlock = canonical?.teamSentimentReality || canonical?.sections?.teamSentimentReality;
  const sentimentMode = sentimentBlock?.mode;
  const respondentDerived = sentimentBlock?.respondentDerived === true;
  const sentimentConfidence = typeof sentimentBlock?.confidence === "number" ? sentimentBlock.confidence : null;

  if (claims["team-wide sentiment"]?.allowed && respondentDerived) {
    // Tier 3: Full team-wide sentiment — participation standard met
    blocks.push(
      <div key="sentiment" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.75rem" }}>
          Respondent-derived team sentiment{sentimentConfidence !== null ? ` · ${sentimentConfidence}% confidence` : ""}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
          Team evidence in this report is derived from structured responses collected directly from team members. Confidence reflects respondent coverage and completion rate. This is observed team sentiment, not leadership estimate.
        </p>
      </div>,
    );
  } else if (sentimentMode === "multi_respondent" || (respondentDerived && !claims["team-wide sentiment"]?.allowed)) {
    // Tier 2: Directional team reading — respondents exist but participation remains limited
    blocks.push(
      <div key="sentiment-directional" style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.75rem" }}>
          Directional team signal{sentimentConfidence !== null ? ` · ${sentimentConfidence}% confidence` : ""}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.48)" }}>
          Team evidence includes respondent data but has not yet reached the participation standard for full team-wide sentiment. The reading is directional — it indicates tendency but cannot be presented as comprehensive team reality. Additional respondents would strengthen this section.
        </p>
      </div>,
    );
  } else {
    // Tier 1: Leader view only
    blocks.push(
      <div key="sentiment-leader" style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "0.75rem" }}>
          Team evidence · Leadership view
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.40)" }}>
          Team evidence in this report reflects leadership&apos;s view of team reality, not direct team input. Confidence is correspondingly limited. A respondent-based team assessment would produce stronger, independently verifiable evidence for this section.
        </p>
      </div>,
    );
  }

  // Monitoring — only when claim-governor permits
  if (claims.monitoring?.allowed) {
    blocks.push(
      <div key="monitoring" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.75rem" }}>
          Monitoring posture · Longitudinal tracking active
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
          This report is part of a longitudinal monitoring sequence. Movement over time, persistent tensions, and trajectory direction are tracked. Intervention effect is assessed where prior corrective action is documented.
        </p>
      </div>,
    );
  }

  // Data-integrated — only when claim-governor permits
  if (claims["data-integrated"]?.allowed) {
    blocks.push(
      <div key="data" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.75rem" }}>
          Enterprise signal integration · Data-supported evidence
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
          This report incorporates imported enterprise signals as structured evidence inputs. Signal quality and constitutional relevance are assessed before inclusion.
        </p>
      </div>,
    );
  }

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
        Capability provenance
      </div>
      {blocks}
    </div>
  );
}

function BasisOfBriefBlock({ canonical, thread }: { canonical: any; thread: any }) {
  const sections = canonical?.sections;
  const constitution = sections?.constitutionalPosture ?? canonical?.constitution;
  if (!constitution) return null;

  const ladderStages: string[] = [];
  if (thread?.stagesCompleted?.length) {
    ladderStages.push(...thread.stagesCompleted);
  } else {
    if (constitution) ladderStages.push("constitutional_diagnostic");
    if (canonical?.ladderContext?.team) ladderStages.push("team_assessment");
    if (canonical?.ladderContext?.enterprise) ladderStages.push("enterprise_assessment");
    ladderStages.push("executive_reporting");
  }

  const sentimentBlock = canonical?.teamSentimentReality ?? sections?.teamSentimentReality;
  const basis = buildBasisOfBrief({
    ladderStages,
    teamMode: sentimentBlock?.mode,
    respondentCount: sentimentBlock?.respondentCount ?? 0,
    teamConfidence: sentimentBlock?.confidence ?? 0,
    benchmarkSampleSize: canonical?.benchmarkPosition?.cohort?.sampleSize ?? 0,
    longitudinalDepth: canonical?.longitudinalMonitoring?.snapshotCount ?? 0,
    boundedScenarioMode: true,
    importedSignalCount: canonical?.enterpriseSignals?.signalCount ?? 0,
    intakeMode: canonical?.ladderContext?.intakeMode ?? "ladder",
    snapshotCount: canonical?.longitudinalMonitoring?.snapshotCount ?? 0,
  });

  const notes = basis.proofBlock.confidenceNotes;
  if (!notes.length) return null;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.012)", padding: "1.5rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "1rem" }}>
        Basis of this brief
      </div>
      <div className="space-y-1.5">
        {notes.map((note, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
              {note}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.16)" }}>
        Intake mode: {basis.intakeMode === "sponsored_direct" ? "Sponsored direct" : basis.intakeMode === "monitoring_rerun" ? "Monitoring rerun" : "Diagnostic ladder"}
      </div>
    </div>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <GoldRule soft />
      <div style={{ marginTop: "1.5rem" }}>
        <Eyebrow>{label}</Eyebrow>
      </div>
    </div>
  );
}

function severityColor(s: string): { border: string; bg: string; text: string } {
  switch (s) {
    case "CRITICAL":
      return {
        border: "rgba(248,113,113,0.25)",
        bg: "rgba(248,113,113,0.06)",
        text: "rgba(252,165,165,0.90)",
      };
    case "HIGH":
      return {
        border: "rgba(251,146,60,0.25)",
        bg: "rgba(251,146,60,0.06)",
        text: "rgba(253,186,116,0.90)",
      };
    case "MEDIUM":
      return {
        border: `${GOLD}30`,
        bg: `${GOLD}08`,
        text: `${GOLD}CC`,
      };
    default:
      return {
        border: "rgba(255,255,255,0.08)",
        bg: "rgba(255,255,255,0.02)",
        text: "rgba(255,255,255,0.45)",
      };
  }
}

function routeColor(r: string): { border: string; bg: string; text: string } {
  switch (r) {
    case "STRATEGY":
      return {
        border: "rgba(52,211,153,0.25)",
        bg: "rgba(52,211,153,0.06)",
        text: "rgba(110,231,183,0.90)",
      };
    case "REJECT":
      return {
        border: "rgba(248,113,113,0.25)",
        bg: "rgba(248,113,113,0.06)",
        text: "rgba(252,165,165,0.90)",
      };
    default:
      return {
        border: `${GOLD}30`,
        bg: `${GOLD}08`,
        text: `${GOLD}CC`,
      };
  }
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-2"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.30em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.20)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.10em",
          color: "rgba(255,255,255,0.60)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "rgba(0,0,0,0.18)",
        padding: "0.85rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          minHeight: "1.7rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "0.45rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 400,
          fontSize: "1.35rem",
          lineHeight: 1,
          color: "rgba(255,255,255,0.88)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARDROOM DOSSIER SECTION
// ─────────────────────────────────────────────────────────────────────────────

function BoardroomDossierSection({
  boardroom,
  runKey,
  email,
}: {
  boardroom: { qualified: boolean; reason?: string; dossier?: any } | null;
  runKey?: string;
  email?: string | null;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [exportResult, setExportResult] = React.useState<string | null>(null);

  if (!boardroom) return null;

  // Non-qualified: restrained message
  if (!boardroom.qualified) {
    return (
      <div style={{ margin: "1rem 0", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem 1rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.35rem" }}>
          Boardroom Dossier not generated
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.86rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)" }}>
          {boardroom.reason || "This case does not currently meet board-level exposure or evidence threshold."}
        </p>
      </div>
    );
  }

  const dossier = boardroom.dossier;
  if (!dossier?.sections?.length) return null;

  // Convert BoardroomDossier sections → BoardroomSlide[]
  const slides = [
    // Dossier sections
    ...dossier.sections.map((section: { id: string; label: string; content: string; tone: string }) => ({
      id: section.id,
      eyebrow: section.tone === "confrontational" ? "CONFRONTATIONAL" : section.tone === "quantified" ? "QUANTIFIED" : "FACTUAL",
      title: section.label,
      render: (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.75)" }}>
          {section.content}
        </p>
      ),
    })),
    // Objection handling slide
    ...(dossier.objectionHandling?.length ? [{
      id: "objection-handling",
      eyebrow: "GOVERNANCE",
      title: "Anticipated Objections",
      render: (
        <div style={{ display: "grid", gap: "1rem" }}>
          {dossier.objectionHandling.map((oh: { objection: string; response: string }, i: number) => (
            <div key={i}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.35rem" }}>
                Objection: {oh.objection}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.60)" }}>
                {oh.response}
              </p>
            </div>
          ))}
        </div>
      ),
    }] : []),
    // Decision path slide
    ...(dossier.decisionPath?.length ? [{
      id: "decision-path",
      eyebrow: "DECISION",
      title: "Decision Path Options",
      render: (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {dossier.decisionPath.map((dp: { option: string; consequence: string; recommended: boolean }, i: number) => (
            <div key={i} style={{ border: `1px solid ${dp.recommended ? "rgba(201,169,110,0.30)" : "rgba(255,255,255,0.06)"}`, backgroundColor: dp.recommended ? "rgba(201,169,110,0.04)" : "rgba(255,255,255,0.015)", padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: dp.recommended ? "#C9A96E" : "rgba(255,255,255,0.35)" }}>
                  {dp.option}
                </span>
                {dp.recommended && <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C9A96E" }}>Recommended</span>}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
                {dp.consequence}
              </p>
            </div>
          ))}
        </div>
      ),
    }] : []),
  ];

  async function handleExportPdf() {
    if (!runKey || !email) return;
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch("/api/executive-reporting/export/boardroom-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runKey, email }),
      });
      const data = await res.json();
      if (data.ok) {
        setExportResult(data.message || "Boardroom PDF export queued.");
      } else {
        setExportResult(data.error || "Export failed.");
      }
    } catch {
      setExportResult("Export request failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div id="boardroom-dossier" style={{ margin: "1.5rem 0" }}>
      {/* Qualification banner + controls */}
      <div style={{ border: "1px solid rgba(201,169,110,0.25)", backgroundColor: "rgba(201,169,110,0.04)", padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A96E", marginBottom: "0.5rem" }}>
              Boardroom Dossier available
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)", maxWidth: "50ch" }}>
              This case qualifies for board-level treatment. {slides.length} presentation sections generated from governed evidence.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.35)", backgroundColor: expanded ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.06)", padding: "8px 16px", cursor: "pointer" }}
            >
              {expanded ? "Close Boardroom Mode" : "Open Boardroom Mode"}
            </button>
            {runKey && email && (
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", padding: "8px 16px", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.5 : 1 }}
              >
                {exporting ? "Exporting..." : "Export Boardroom PDF"}
              </button>
            )}
          </div>
        </div>
        {exportResult && (
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
            {exportResult}
          </p>
        )}
      </div>

      {/* Slide deck — only when expanded */}
      {expanded && slides.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <BoardroomModeSurface
            slides={slides}
            title={dossier.title || "Executive Reporting Boardroom Briefing"}
            classification={dossier.classification || "BOARD_RESTRICTED"}
            generatedAt={dossier.generatedAt}
          />
        </div>
      )}
    </div>
  );
}

function ResultSurface({
  result,
  onRerun,
  thread,
  email,
}: {
  result: Extract<ExecutiveReportingResult, { ok: true }>;
  onRerun: () => void;
  thread: ConstitutionalThread | null;
  email?: string | null;
}) {
  const { longitudinal, multiStakeholder, outcome } = useInstitutionalLayers({ email, stage: "executive", enabled: !!email });
  const vm = result.viewModel;
  const canonical = result.canonical;
  const header = vm?.header;
  const summary = vm?.summary;
  const telemetry = vm?.telemetry;
  const financialExposure = vm?.financialExposure;
  const observedOutcomes =
    vm?.observedOutcomes ?? canonical?.sections?.observedOutcomeEvidence;
  const constitution = vm?.constitution;
  const recommendations = vm?.recommendations;
  const findings = vm?.findings ?? [];
  const boardActions = vm?.boardActions ?? summary?.priorityStack ?? [];
  const nextAction = vm?.nextAction ?? recommendations?.nextAction ?? summary?.mandate ?? "";
  const route = header?.route ?? result.route ?? constitution?.route ?? "DIAGNOSTIC";
  const rc = routeColor(route);
  const entitlements = result.entitlements;
  const clarityScore = safeNumber(constitution?.clarityScore, header?.confidence ?? 0);
  const evidenceGraph = (canonical as any)?.evidenceGraph ?? {};
  const evidenceNodes = Array.isArray(evidenceGraph.nodes) ? evidenceGraph.nodes : [];
  const decisionObjects = Array.isArray(evidenceGraph.decisionObjects) ? evidenceGraph.decisionObjects : [];
  const latestDecisionObject = [...decisionObjects].reverse()[0] as any;
  const graphContradictions = evidenceNodes
    .filter((node: any) => node?.kind === "contradiction")
    .slice(-5);
  const graphConsequences = evidenceNodes
    .filter((node: any) => node?.kind === "consequence" || node?.kind === "exposure_estimate")
    .slice(-4);
  const graphActions = evidenceNodes
    .filter((node: any) => node?.kind === "action")
    .slice(-4);
  const evidenceCarryForward = mergeAssessmentEvidenceCapture(
    extractAssessmentEvidenceCapture(canonical),
    extractAssessmentEvidenceCapture((result as any)?.intake),
    extractAssessmentEvidenceCapture((result as any)?.intake?.diagnosticsMeta),
  );
  const executiveMemory = buildGovernedMemoryFromEvidenceCapture({
    evidence: evidenceCarryForward,
    sourceSurface: "EXECUTIVE_REPORTING",
    defaultStatus: {
      decisionDependency: "UNRESOLVED",
      failureCause: "UNRESOLVED",
      priorAttempts: "ACTIVE",
      verificationCriteria: "ACTIVE",
      escalationTrigger: "UNRESOLVED",
    },
  }).filter((item) =>
    ["decisionDependency", "failureCause", "priorAttempts", "verificationCriteria", "escalationTrigger"].includes(item.id),
  ).slice(0, 3);

  // ── PURPOSE ALIGNMENT EVIDENCE CARRIED FORWARD ──
  const paBlock = (canonical as any)?.purposeAlignmentEvidence;
  const paMemoryItems = paBlock
    ? convertPurposeAlignmentToGovernedMemory({
        available: true,
        sourceSurface: "PURPOSE_ALIGNMENT",
        assessedAt: paBlock.assessedAt ?? null,
        schemaVersion: null,
        profile: paBlock.profile ?? null,
        compositeScore: paBlock.compositeScore ?? null,
        strongestDomain: null,
        weakestDomain: paBlock.weakestDomain ?? null,
        competingObligation: paBlock.previouslyReportedCompetingObligation ?? null,
        consequence: paBlock.previouslyReportedConsequence ?? null,
        institutionalConsequence: null,
        primaryPattern: paBlock.earlierAlignmentSignal?.split(":")[0]?.trim() ?? null,
        patternConsequence: paBlock.earlierAlignmentSignal?.includes(":") ? paBlock.earlierAlignmentSignal.split(":").slice(1).join(":").trim() : null,
        contradictions: [],
        domainScores: [],
        firstAction: paBlock.carriedForwardDirective ?? null,
        corrections: [],
        assessmentId: null,
      })
    : [];
  const mergedMemory = [...paMemoryItems, ...executiveMemory];

  const executiveMemoryImpact = executiveMemory.some((item) => item.id === "decisionDependency")
    ? "The recommendation is being shaped around the unresolved dependency rather than assuming execution authority already exists."
    : executiveMemory.some((item) => item.id === "failureCause" || item.id === "priorAttempts")
      ? "The recommendation has been narrowed to avoid repeating earlier correction logic that was reported to fail or fail to hold."
      : "The recommendation is being shaped against the declared verification standard rather than generic progress language.";

  const dominantDomains = summary?.dominantDomains ?? constitution?.dominantDomains ?? [];
  const failureModes = summary?.failureModes ?? constitution?.failureModes ?? [];
  const requiredInterventions =
    summary?.requiredInterventions ?? constitution?.requiredInterventions ?? [];

  // Intelligence layer — async interpretation enrichment
  const intake = (result as any)?.intake;

  // Predictive consequence — "Cost of Non-Decision"
  const consequenceProjection = React.useMemo(() => projectConsequence({
    contradictions: graphContradictions.map((n: any) => ({
      severity: String(n.severity ?? "medium"),
      confidence: typeof n.confidence === "number" ? n.confidence : 0.5,
    })),
    recurrenceCount: 0,
    maxDivergenceGap: 0,
    escalationLevel: safeNumber(constitution?.escalationLevel, 0),
    daysSinceIdentification: 0,
    revenueBand: safeString(constitution?.revenueBand ?? intake?.revenueBand),
    priorInterventionCount: 0,
  }), [graphContradictions, constitution, intake]);

  // AI Terrain Assessment
  const aiTerrain = React.useMemo(() => assessAITerrain({
    sector: safeString(intake?.sector ?? (constitution as any)?.sector, "professional_services"),
    revenueBand: safeString(constitution?.revenueBand ?? intake?.revenueBand, ""),
    avgDecisionCycleDays: safeNumber((constitution as any)?.decisionCycleDays, 21),
    aiMentionedInProblem: safeString(intake?.problemStatement ?? intake?.decisionQuestion).toLowerCase().includes("ai") ||
      safeString(intake?.symptoms ?? intake?.currentConstraint).toLowerCase().includes("automat"),
    competitorAIAdoption: safeString(intake?.sector).toLowerCase().includes("tech") ||
      safeString(intake?.sector).toLowerCase().includes("fintech") ||
      safeString(intake?.problemStatement).toLowerCase().includes("competitor"),
    blockedDecisionCount: graphContradictions.length,
    contradictionCount: graphContradictions.length,
    hasAIGovernance: false,
    aiInOperations: safeString(intake?.problemStatement ?? "").toLowerCase().includes("ai") &&
      safeString(intake?.currentConstraint ?? "").toLowerCase().includes("implement"),
  }), [intake, constitution, graphContradictions]);

  // Advantage terrain assessment
  const advantagePath = React.useMemo(() => assessAdvantageTerrain({
    velocityGapPercent: aiTerrain.decisionVelocity.gapPercent,
    aiClassification: aiTerrain.classification,
    contradictionCount: graphContradictions.length,
    resolvedContradictionCount: 0,
    sector: safeString(intake?.sector, "professional_services"),
    competitorAIAdoption: aiTerrain.decisionVelocity.gapPercent > 30,
    activeDomains: dominantDomains.map(String),
    revenueBand: safeString(constitution?.revenueBand ?? intake?.revenueBand, ""),
  }), [aiTerrain, graphContradictions, intake, constitution, dominantDomains]);

  const { interpretation, loading: interpretLoading } = useInterpretation({
    canonicalResult: canonical?.sections ?? {},
    userInputs: {
      problemStatement: intake?.decisionQuestion ?? intake?.problemStatement ?? "",
      constraints: intake?.currentConstraint ?? "",
      objective: intake?.whatHappensIfNothingChanges ?? "",
      symptoms: intake?.priorAttemptOutcome ?? "",
    },
    stage: "executive",
    tensionThread: thread as Record<string, unknown> | null,
    enabled: Boolean(canonical?.sections),
  });

  // Prognostic layer
  const readinessNum = ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[safeString(constitution?.readinessTier)] ?? 50;
  const trajectory = inferTrajectory(clarityScore, readinessNum, failureModes);
  const engagementReadiness = deriveEngagementReadiness({
    revenueBand: safeString(constitution?.revenueBand),
    problemStatement: "", // full problem was in the intake, not persisted in the result
    urgencyWindow: safeString(constitution?.temperature) === "SCORCHING" ? "IMMEDIATE" : safeString(constitution?.temperature) === "HOT" ? "NEAR_TERM" : "MID_TERM",
    authorityScope: safeString(constitution?.authorityType),
  });

  // Decision object — canonical across ER and SR
  const decisionText = latestDecisionObject?.decisionText
    ?? safeString(intake?.decisionQuestion)
    ?? safeString((canonical?.sections as any)?.executiveSummary?.mandate)
    ?? nextAction;
  const constraintText = latestDecisionObject?.constraintText
    ?? safeString(intake?.currentConstraint)
    ?? "";
  const costOfDelayText = safeString(intake?.whatHappensIfNothingChanges) || "";
  const exposureFormatted = financialExposure?.totalExposureFormatted
    ?? financialExposure?.totalExposureFormatted
    ?? (financialExposure?.totalExposure ? `\u00a3${Math.round(Number(financialExposure.totalExposure)).toLocaleString()}` : null);
  const projectedCost90 =
    consequenceProjection.estimatedExposure.quarterly > 0
      ? `\u00a3${consequenceProjection.estimatedExposure.quarterly.toLocaleString()}`
      : exposureFormatted;
  const aiAdjustedConsequence = (result as any).aiAdjustedConsequence ?? (canonical as any)?.aiAdjustedConsequence;
  const executiveIrreversibility = (() => {
    const signalCount = [
      financialExposure?.totalExposure != null && Number(financialExposure.totalExposure) > 0,
      consequenceProjection.estimatedExposure.quarterly > 0,
      Boolean(graphContradictions.length),
      Boolean(costOfDelayText),
    ].filter(Boolean).length;
    if (signalCount < 2) return null;
    return computeIrreversibilityIndex({
      costAccumulated: Number(financialExposure?.totalExposure ?? 0) || consequenceProjection.estimatedExposure.quarterly || undefined,
      costThreshold: consequenceProjection.estimatedExposure.quarterly || Number(financialExposure?.totalExposure ?? 0) || undefined,
      daysWithoutAction: costOfDelayText ? 30 : undefined,
      consequenceMaterialised: route === "STRATEGY",
      factors: graphContradictions.length > 0 ? [{
        factor: "TRUST_EROSION",
        contribution: Math.min(25, graphContradictions.length * 8),
        description: `${graphContradictions.length} contradiction signal${graphContradictions.length === 1 ? "" : "s"} remain active in the report evidence.`,
      }] : undefined,
    });
  })();

  return (
    <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-12">

        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "20px 24px", marginBottom: "18px" }}>
          <div style={{ display: "grid", gap: "14px" }}>
            <section>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Dominant finding</span>
              <p style={{ marginTop: "6px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.45, color: "rgba(255,255,255,0.84)" }}>
                {interpretation?.conditionLabel ?? summary?.headline ?? "Condition identified"}
              </p>
              <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.42)" }}>
                {interpretation?.contradictionInsight ?? summary?.summary ?? interpretation?.narrative ?? "The report has identified a governing condition that now requires a decision."}
              </p>
            </section>

            {boardActions.length > 0 && (
              <section>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Governed priority stack</span>
                {boardActions.slice(0, 3).map((action: unknown, index: number) => (
                  <p key={`${String(action)}-${index}`} style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                    {String(index + 1).padStart(2, "0")} {String(action)}
                  </p>
                ))}
              </section>
            )}

            {decisionText && (
              <section>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Required decision</span>
                <p style={{ marginTop: "4px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
                  {decisionText}
                </p>
              </section>
            )}

            {(exposureFormatted || projectedCost90 || executiveIrreversibility) && (
              <section>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.70)" }}>Financial exposure / cost of delay</span>
                {exposureFormatted && <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>Current priced exposure: {exposureFormatted}</p>}
                {projectedCost90 && <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>Projected 90-day cost of delay: {projectedCost90}</p>}
                {executiveIrreversibility && <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>Irreversibility estimate: {executiveIrreversibility.summary} This is an irreversibility estimate, not a verified external fact.</p>}
              </section>
            )}

            <section>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Boardroom readiness</span>
              <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                {result.boardroom?.qualified ? "Boardroom-ready. A dossier is available for board-level review." : result.boardroom?.reason || "Boardroom readiness has not been earned yet."}
              </p>
            </section>

            {mergedMemory.length > 0 && (
              <section>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Evidence carried forward</span>
                <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                  This report is carrying forward prior governance evidence. The recommendation has not been generated in isolation.
                </p>
              </section>
            )}

            <section>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}88` }}>Next admitted step</span>
              <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                {route === "STRATEGY"
                  ? "Enter Strategy Room. Execution is admitted and the checkpoint has been created against this report."
                  : "No forced paid escalation is being claimed. Strategy Room remains available only if execution conditions are met."}
              </p>
            </section>
          </div>
        </div>

        {/* ── BLOCK 0: BOARD SNAPSHOT ── */}
        <BoardSnapshot data={{
          primaryContradiction: graphContradictions[0]
            ? String((graphContradictions[0] as any).summary ?? (graphContradictions[0] as any).label ?? "Structural contradiction detected")
            : (summary as any)?.headline ?? (header as any)?.headline ?? "Condition identified — contradiction active",
          costOfInaction90Days: consequenceProjection.estimatedExposure.quarterly > 0
            ? `£${consequenceProjection.estimatedExposure.quarterly.toLocaleString()}`
            : exposureFormatted || "Requires pricing",
          decisionVelocityRisk: `${aiTerrain.decisionVelocity.gapPercent}% behind AI baseline (${aiTerrain.decisionVelocity.current}d vs ${aiTerrain.decisionVelocity.baseline}d)`,
          competitivePosition: advantagePath.competitivePosition.replace("_", " "),
          requiredAction: safeString(nextAction) || boardActions[0] || "Action required — see priority stack",
        }} />
        {mergedMemory.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <GovernanceEvidenceCarryForward
              title="Evidence carried forward"
              intro="This report has inherited prior governance evidence. It affects the recommendation because earlier failure logic, dependency, or proof standards remain relevant."
              impact={executiveMemoryImpact}
              items={mergedMemory}
              variant="executive"
            />
          </div>
        )}
        {result.boardroom?.qualified && (
          <div style={{ textAlign: "right", marginTop: "0.35rem" }}>
            <a
              href="#boardroom-dossier"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", textDecoration: "none" }}
            >
              Open Boardroom Dossier &darr;
            </a>
          </div>
        )}

        {/* ── BLOCK 0b: BOARDROOM DOSSIER ── */}
        <BoardroomDossierSection
          boardroom={result.boardroom ?? null}
          runKey={result.runKey}
          email={email}
        />

        {/* ── BLOCK 1: OPENING COST LINE ── */}
        <div style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(252,165,165,0.15)" }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            lineHeight: 1.15,
            color: "rgba(252,165,165,0.70)",
            fontStyle: "italic",
            maxWidth: "44ch",
          }}>
            {exposureFormatted
              ? `This condition is already costing you ${exposureFormatted}.`
              : interpretation?.conditionLabel
                ? interpretation.conditionLabel
                : summary?.headline ?? "The consequence is now priced."}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
              {[header?.organisationName, route, safeString(constitution?.readinessTier)].filter(Boolean).join(" \u00b7 ")}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.18em", color: rc.text }}>{route}</span>
          </div>
        </div>

        {projectedCost90 && (
          <div style={{ border: "1px solid rgba(252,165,165,0.32)", backgroundColor: "rgba(252,165,165,0.055)", padding: "1rem 1.25rem", marginTop: "1rem", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.65)" }}>
              Projected Cost of Inaction (90 days)
            </span>
            <div style={{ marginTop: "0.35rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "clamp(1.35rem, 3vw, 2rem)", color: "rgba(252,165,165,0.88)", fontWeight: 700 }}>
              {projectedCost90}
            </div>
          </div>
        )}

        {aiAdjustedConsequence && (
          <div style={{ border: "1px solid rgba(147,197,253,0.24)", backgroundColor: "rgba(147,197,253,0.045)", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(147,197,253,0.72)" }}>
              AI-adjusted consequence projection
            </span>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Exposure", value: aiAdjustedConsequence.aiExposureLevel },
                { label: "Classification", value: aiAdjustedConsequence.classification },
                { label: "Velocity", value: `${aiAdjustedConsequence.decisionVelocityScore}/100` },
                { label: "Acceleration risk", value: `${aiAdjustedConsequence.projectedAccelerationRisk ?? aiAdjustedConsequence.accelerationRiskScore}/100` },
              ].map((item) => (
                <div key={item.label} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.5rem 0.65rem" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "5.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{item.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(147,197,253,0.82)", marginTop: "0.2rem" }}>{String(item.value ?? "—")}</div>
                </div>
              ))}
            </div>
            {Array.isArray(aiAdjustedConsequence.reasoning) && (
              <p style={{ marginTop: "0.65rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.42)" }}>
                {aiAdjustedConsequence.reasoning.join(" ")}
              </p>
            )}
          </div>
        )}

        {/* ── BLOCK 2: NAMED CONDITION ── */}
        <div className="py-4">
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>Identified condition</span>
          <h2 style={{ marginTop: "0.3rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "clamp(0.85rem, 1.8vw, 1.1rem)", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)", fontWeight: 700 }}>
            {interpretation?.conditionLabel ?? summary?.headline ?? safeString(constitution?.posture) ?? "CONDITION IDENTIFIED"}
          </h2>
          {interpretation?.conditionExplanation && (
            <p style={{ marginTop: "0.4rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", maxWidth: "52ch" }}>
              {interpretation.conditionExplanation}
            </p>
          )}
        </div>

        {/* ── BLOCK 3: CONTRADICTION ── */}
        {(graphContradictions.length > 0 || interpretation?.contradictionInsight) && (
          <div style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.03)", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>Contradiction</span>
            {interpretation?.contradictionInsight && (
              <p style={{ marginTop: "0.35rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(252,165,165,0.55)" }}>
                {interpretation.contradictionInsight}
              </p>
            )}
            {graphContradictions.map((c: any, i: number) => (
              <p key={i} style={{ marginTop: "0.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(252,165,165,0.40)" }}>
                {String(c.summary || c.label || "")}
              </p>
            ))}
          </div>
        )}

        {/* ── BLOCK 4: CONSEQUENCE MODEL (visible math) ── */}
        {financialExposure && (
          <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1.25rem", marginBottom: "0.75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>Consequence model</span>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Execution loss", value: financialExposure.executionLossFormatted ?? financialExposure.executionLossFormatted },
                { label: "Replacement cost", value: financialExposure.replacementCostFormatted ?? financialExposure.replacementCostFormatted },
                { label: "Total exposure", value: exposureFormatted },
              ].filter((m) => m.value).map((m) => (
                <div key={m.label} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.5rem 0.75rem" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "5.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{m.label}</span>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", color: GOLD, marginTop: "0.15rem" }}>{m.value}</div>
                </div>
              ))}
            </div>
            {costOfDelayText && (
              <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", color: "rgba(255,255,255,0.30)" }}>
                If delayed: {costOfDelayText}
              </p>
            )}
          </div>
        )}

        {/* ── BLOCK 5: DECISION OBJECT (visually dominant) ── */}
        {decisionText && (
          <div style={{ border: `1px solid ${GOLD}28`, backgroundColor: `${GOLD}06`, padding: "1.25rem", marginBottom: "0.75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>Decision required</span>
            <p style={{ marginTop: "0.35rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
              {decisionText}
            </p>
            {constraintText && (
              <div className="mt-2">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Constraint</span>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", color: "rgba(255,255,255,0.38)", marginTop: "0.15rem" }}>{constraintText}</p>
              </div>
            )}
          </div>
        )}

        {/* ── BLOCK 6: PRIORITY STACK ── */}
        {boardActions.length > 0 && (
          <div style={{ border: `1px solid ${AMBER}25`, backgroundColor: `${AMBER}05`, padding: "1.25rem", marginBottom: "0.75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: AMBER }}>Required actions</span>
            {boardActions.slice(0, 5).map((action: unknown, i: number) => (
              <div key={i} className="flex items-start gap-2 py-1.5" style={{ borderBottom: i < Math.min(boardActions.length, 5) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: `${AMBER}70`, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>{String(action)}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── BLOCK 7: IF IGNORED ── */}
        <div style={{ padding: "0.75rem 0", marginBottom: "0.75rem" }}>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)" }}>If ignored</span>
          <p style={{ marginTop: "0.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(252,165,165,0.45)" }}>
            {interpretation?.narrative ?? summary?.mandate ?? "The condition persists. Exposure compounds. The window for effective action narrows."}
          </p>
        </div>

        {/* ── BLOCK 7b: COMPETITIVE POSITION ── */}
        <CompetitivePositionSignal position={advantagePath.competitivePosition} />
        <DecisionTerrainStatus
          state={deriveTerrainState(aiTerrain.decisionVelocity.gapPercent)}
          velocityGapPercent={aiTerrain.decisionVelocity.gapPercent}
        />
        <AITerrainExposure data={aiTerrain} />

        {/* ── BLOCK 7c: COST OF NON-DECISION (AI-ADJUSTED) ── */}
        <PredictiveConsequence data={consequenceProjection} />

        {/* ── BLOCK 7d: EFFICACY COMMAND — accept/challenge/escalate ── */}
        {(() => {
          const topPriority = (canonical as any)?.priorityStack?.[0] ?? (canonical as any)?.requiredInterventions?.[0] ?? (canonical as any)?.sections?.priorityStack?.[0] ?? "Address the governing condition.";
          return (
            <div style={{ borderLeft: `2px solid rgba(201,169,110,0.25)`, backgroundColor: "rgba(201,169,110,0.03)", padding: "20px 24px", marginTop: "24px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: "#C9A96E" }}>Your required move</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontSize: "1.15rem", lineHeight: 1.45, color: "rgba(255,255,255,0.85)", marginTop: "8px" }}>
                Accept or challenge the governed priority: {typeof topPriority === "string" ? topPriority.slice(0, 150) : "Address the governing condition."}
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginTop: "8px" }}>
                The report has identified the priority intervention. Accept and proceed to execution, or challenge with evidence. Non-response will be treated as implicit acceptance.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                <a href="/strategy-room" style={{ padding: "10px 18px", backgroundColor: "#F5F5F5", color: "#0B0B0B", textDecoration: "none", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
                  Accept — enter Strategy Room
                </a>
                <button onClick={() => { const cid = result.checkpointId; if (!cid) { alert("No checkpoint available for this report. The system cannot record your challenge without a checkpoint reference."); return; } const note = prompt("What evidence challenges this priority?"); if (note) { fetch("/api/checkpoints/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkpointId: cid, responseStatus: "DISPUTED_FINDING", whatChanged: note }) }).catch(() => {}); } }} style={{ padding: "10px 18px", backgroundColor: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
                  Challenge with evidence
                </button>
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: "10px" }}>
                Checkpoint: 7-day priority decision &middot; Source: Executive Reporting &middot; Evidence posture: system-inferred
              </p>
            </div>
          );
        })()}

        {/* ── BLOCK 7e: ADVANTAGE PATH ── */}
        <AdvantagePathBlock data={advantagePath} />

        {/* ── BLOCK 8: FORCED LADDER PROGRESSION ── */}
        {route === "STRATEGY" && (
          <LadderProgressionGate
            severity="critical"
            nextStage={{
              label: "Strategy Room",
              href: "/strategy-room",
              reason: "This condition requires governed intervention. The Strategy Room inherits this evidence, sequences the intervention, and enforces execution.",
            }}
            consequenceOfExit="Your condition has been priced. Exiting without entering execution means this exposure compounds unchecked. The system has recorded this decision point — delay will be visible in your next assessment."
            trajectoryWarning="Executive Reporting has classified this as STRATEGY route. Without execution, the priced consequence increases with each decision cycle."
            canDefer={false}
          />
        )}
        {route !== "STRATEGY" && (
          <LadderProgressionGate
            severity="medium"
            nextStage={{
              label: "Strategy Room",
              href: "/strategy-room",
              reason: "The Strategy Room is available when execution is required. Your current route does not mandate it, but the evidence is preserved.",
            }}
            consequenceOfExit="Your condition has been documented but not yet enforced. Re-entry is available when the condition escalates."
          />
        )}

        {interpretLoading && (
          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", marginBottom: "1rem" }}>
            Interpreting condition...
          </div>
        )}

        <details style={{ marginTop: "1.5rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem 1.1rem" }}>
          <summary style={{ cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
            Evidence, governance, and method
          </summary>
          <div style={{ marginTop: "1rem" }}>
            <LongitudinalIntelligence data={longitudinal} />
            <MultiStakeholderDivergence data={multiStakeholder} />
            <OutcomeVerification data={outcome} />
          </div>
        </details>

        {/* Retainer gate — conditional on longitudinal/multi-stakeholder evidence */}
        <RetainerEntryGate qualification={evaluateRetainerQualification({
          persistingContradictions: longitudinal?.persistingContradictions ?? [],
          recurringPatterns: longitudinal?.tensionPersistence ?? [],
          stakeholderContradictions: (multiStakeholder?.structuralContradictions ?? []).map((c) => ({
            domain: c.domain, gap: c.gap, severity: c.severity,
          })),
          longitudinalClassification: longitudinal?.classification,
        })} />

        {/* ── SECONDARY: evidence convergence + diagnostic data ── */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-6" />

        {/* Cross-stage memory */}
        {thread && (
          <div className="mb-4" style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Evidence convergence</span>
            <p style={{ marginTop: "0.3rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.35)" }}>
              Constitutional diagnostic: {thread.posture} · {thread.route} · {Math.round(thread.confidence * 100)}% confidence.
              {thread.failureModes.length > 0 ? ` Failure modes: ${thread.failureModes.join(", ")}.` : ""}
            </p>
          </div>
        )}

        {/* Closing inevitability */}
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(252,165,165,0.35)", fontStyle: "italic", marginBottom: "1.5rem" }}>
          If unresolved, this condition compounds.
        </p>

        {/* Run key */}
        <div className="mb-4 flex items-center gap-2">
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
            {result.runKey}
          </span>
        </div>

      </div>
    </div>
  );
}

function ExecutiveReportingIntake({
  onGenerating,
  onResult,
  onError,
  onEmailCaptured,
}: {
  onGenerating: () => void;
  onResult: (r: Extract<ExecutiveReportingResult, { ok: true }>) => void;
  onError: () => void;
  onEmailCaptured?: (email: string) => void;
}) {
  const [form, setForm] = React.useState<ExecutiveReportingIntakeForm>(INITIAL);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [upstreamContext, setUpstreamContext] =
    React.useState<LadderUpstreamContext | null>(null);

  React.useEffect(() => {
    const nextContext = readLadderUpstreamContext();
    setUpstreamContext(nextContext);
    const evidence = nextContext?.evidenceCapture;
    if (!evidence) return;
    setForm((prev) => ({
      ...prev,
      currentConstraint: prev.currentConstraint || evidence.decisionDependency || evidence.failureCause || prev.currentConstraint,
      priorAttemptOutcome: prev.priorAttemptOutcome || evidence.priorAttempts || evidence.failureCause || prev.priorAttemptOutcome,
      verificationCriteria: prev.verificationCriteria || evidence.verificationCriteria || prev.verificationCriteria,
    }));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function buildPayload() {
    return {
      subjectId: upstreamContext?.subjectId || undefined,
      fullName: form.fullName,
      email: form.email,
      organisation: form.organisation,
      role: form.role,
      sector: form.sector,
      problemStatement: form.problemStatement,
      symptoms: form.symptoms,
      desiredOutcome: form.desiredOutcome,
      currentConstraint: form.currentConstraint,
      governance: {
        authorityScope: form.authorityScope,
        sponsorNameOrSeat: form.sponsorNameOrSeat,
        boardInvolved: form.boardInvolved,
        stakeholderBreadth: form.stakeholderBreadth,
      },
      economics: {
        revenueBand: form.revenueBand,
        marketExposure: form.marketExposure,
        estimatedExposureGBP: Number(form.estimatedExposureGBP) || 0,
        decisionWindow: form.decisionWindow,
        headcountAffected: Number(form.headcountAffected) || 0,
      },
      history: {
        evidenceQuality: form.evidenceQuality,
        evidenceNotes: form.evidenceNotes,
        priorAttemptOutcome: form.priorAttemptOutcome,
      },
      decisionNeed: {
        decisionQuestion: form.decisionQuestion,
        whatHappensIfNothingChanges: form.whatHappensIfNothingChanges,
        verificationCriteria: form.verificationCriteria,
      },
      diagnosticsMeta: {
        signalReadinessScore: 0,
        upstreamContext,
      },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    onGenerating();

    try {
      const res = await fetch("/api/executive-reporting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: buildPayload() }),
      });

      const data = (await res.json()) as ExecutiveReportingResult;

      if (!data.ok) {
        setError(data.error ?? "Report generation failed. Check the form and try again.");
        setSubmitting(false);
        onError();
        return;
      }

      onResult(data);
      if (form.email) onEmailCaptured?.(form.email);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
      onError();
    }
  }

  return (
    <div style={{ backgroundColor: BASE }}>
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-12 lg:py-20">
        <div className="mb-10">
          <Eyebrow>Executive Reporting · Governed intake</Eyebrow>
          <h2
            style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Structured executive intake.
          </h2>
          <p
            style={{
              marginTop: "0.85rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "1.02rem",
              lineHeight: 1.72,
              color: "rgba(255,255,255,0.38)",
              maxWidth: "48ch",
            }}
          >
            This intake governs what the executive brief can address. Expect 10–15 minutes.
            Your answers are translated into a constitutional position, financial exposure,
            governed priority stack, and escalation logic where evidence warrants it.
          </p>
          <p style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>
            Every decision is evaluated against cost, speed, and competitive position.
          </p>
          <div
            className="mt-5 grid gap-3 sm:grid-cols-3"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.34)",
            }}
          >
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem" }}>
              Governed executive brief · One-time
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem" }}>
              Derived from your specific evidence
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem" }}>
              Governed analysis — no generic output
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem" }}>
              This is not advisory. This is decision enforcement.
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "0.85rem" }}>
              Decisions enforced. Outcomes tracked.
            </div>
          </div>
        </div>

        {upstreamContext && (
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem 1.25rem",
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}07`,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
                marginBottom: "0.55rem",
              }}
            >
              Carrying forward · {upstreamContext.layerLabel}
            </div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.95rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              {typeof upstreamContext.totalPct === "number" && (
                <span>
                  Score {upstreamContext.totalPct}%
                  {upstreamContext.severity ? ` · ${upstreamContext.severity}` : ""}
                  {upstreamContext.band ? ` · ${upstreamContext.band}` : ""}
                </span>
              )}
              {typeof upstreamContext.overallReality === "number" && (
                <span>
                  {typeof upstreamContext.totalPct === "number" ? " · " : ""}
                  Team reality {upstreamContext.overallReality}%
                  {typeof upstreamContext.overallLeader === "number"
                    ? ` (leader ${upstreamContext.overallLeader}%)`
                    : ""}
                </span>
              )}
              {typeof upstreamContext.percent === "number" &&
                upstreamContext.source === "purpose-alignment-result" && (
                  <span>Purpose alignment {upstreamContext.percent}%</span>
                )}
              {upstreamContext.nextRoute && (
                <span style={{ color: "rgba(255,255,255,0.42)" }}>
                  {" · "}Route hint: {upstreamContext.nextRoute}
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-10">

            {/* ── GROUP 1: IDENTITY (minimal) ── */}
            <div>
              <GroupHeader label="Identity" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" />
                </Field>
                <Field label="Email address" required>
                  <Input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@organisation.com" />
                </Field>
                <Field label="Organisation" required>
                  <Input name="organisation" value={form.organisation} onChange={handleChange} placeholder="Institution or company name" />
                </Field>
                <Field label="Role" required>
                  <Input name="role" value={form.role} onChange={handleChange} placeholder="Founder, CEO, Chair, Director..." />
                </Field>
              </div>
            </div>

            {/* ── GROUP 2: STRUCTURED CONTEXT ── */}
            <div>
              <GroupHeader label="Decision scope" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Authority scope" required>
                  <Select name="authorityScope" value={form.authorityScope} onChange={handleChange}
                    options={[
                      { label: "I decide directly", value: "DIRECT" },
                      { label: "I influence and sponsor", value: "PROXY" },
                      { label: "I am exploring", value: "UNCLEAR" },
                    ]}
                  />
                </Field>
                <Field label="Board involvement">
                  <Select name="boardInvolved" value={form.boardInvolved} onChange={handleChange}
                    options={[
                      { label: "Yes", value: "YES" },
                      { label: "No", value: "NO" },
                      { label: "Pending", value: "UNCERTAIN" },
                    ]}
                  />
                </Field>
                <Field label="Revenue band" required>
                  <Select name="revenueBand" value={form.revenueBand} onChange={handleChange}
                    options={[
                      { label: "Under £50k", value: "MICRO" },
                      { label: "£50k – £250k", value: "SMB" },
                      { label: "£250k – £1m", value: "MID" },
                      { label: "£1m – £10m", value: "ENTERPRISE" },
                      { label: "Above £10m", value: "WHALE" },
                    ]}
                  />
                </Field>
                <Field label="Decision window" required>
                  <Select name="decisionWindow" value={form.decisionWindow} onChange={handleChange}
                    options={[
                      { label: "30 days", value: "IMMEDIATE" },
                      { label: "90 days", value: "NEAR_TERM" },
                      { label: "6–12 months", value: "MID_TERM" },
                      { label: "Strategic horizon", value: "LONG_HORIZON" },
                    ]}
                  />
                </Field>
                <Field label="Headcount affected">
                  <Select name="headcountAffected" value={form.headcountAffected} onChange={handleChange}
                    options={[
                      { label: "Under 20", value: "20" },
                      { label: "20–100", value: "100" },
                      { label: "100–500", value: "500" },
                      { label: "500+", value: "1000" },
                    ]}
                  />
                </Field>
                <Field label="Stakeholder scope">
                  <Select name="stakeholderBreadth" value={form.stakeholderBreadth} onChange={handleChange}
                    options={[
                      { label: "Local / team", value: "LOCAL" },
                      { label: "Multi-team", value: "MULTI_TEAM" },
                      { label: "Executive level", value: "EXECUTIVE" },
                      { label: "Board / institutional", value: "INSTITUTIONAL" },
                    ]}
                  />
                </Field>
              </div>
            </div>

            {/* ── GROUP 3: HIGH-YIELD FREE TEXT — each field has a direct consumer ── */}
            <div>
              <GroupHeader label="The decision" />
              <p style={{ marginTop: "-0.5rem", marginBottom: "1rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
                Four questions. Each one changes the report. No fluff — write what is real.
              </p>
              <div className="space-y-5">
                <Field label="What decision is actually on the table?" required>
                  <Textarea
                    name="decisionQuestion"
                    value={form.decisionQuestion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Not the topic. The decision. One sentence if possible."
                  />
                </Field>
                <Field label="What becomes more expensive if this is delayed?" required>
                  <Textarea
                    name="whatHappensIfNothingChanges"
                    value={form.whatHappensIfNothingChanges}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Name the specific cost — financial, structural, political, reputational."
                  />
                </Field>
                <Field label="What is the real constraint?" required>
                  <Textarea
                    name="currentConstraint"
                    value={form.currentConstraint}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Not symptoms. The thing preventing this decision from being made right now."
                  />
                </Field>
                <Field label="What has already been tried, and what specifically went wrong?">
                  <Textarea
                    name="priorAttemptOutcome"
                    value={form.priorAttemptOutcome}
                    onChange={handleChange}
                    rows={3}
                    placeholder="If nothing: say nothing. If something failed: state what and why."
                  />
                </Field>
                <Field label="Fourteen days from now, what observable evidence would prove this action changed the condition?">
                  <Textarea
                    name="verificationCriteria"
                    value={form.verificationCriteria}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Name the specific evidence — not a feeling, not a metric. What would you point to?"
                  />
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1.25rem 1.5rem",
                border: "1px solid rgba(248,113,113,0.20)",
                backgroundColor: "rgba(248,113,113,0.04)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <AlertTriangle
                style={{
                  width: "13px",
                  height: "13px",
                  color: "rgba(252,165,165,0.80)",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.97rem",
                  lineHeight: 1.65,
                  color: "rgba(252,165,165,0.85)",
                }}
              >
                {error}
              </p>
            </div>
          )}

          <div style={{ marginTop: "2.5rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 transition-all duration-300"
              style={{
                padding: "16px 28px",
                border: `1px solid ${isSubmitting ? "rgba(255,255,255,0.07)" : `${GOLD}42`}`,
                backgroundColor: isSubmitting ? "rgba(255,255,255,0.02)" : `${GOLD}10`,
                color: isSubmitting ? "rgba(255,255,255,0.22)" : `${GOLD}CC`,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = `${GOLD}65`;
                  e.currentTarget.style.backgroundColor = `${GOLD}18`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.borderColor = `${GOLD}42`;
                  e.currentTarget.style.backgroundColor = `${GOLD}10`;
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="h-3.5 w-3.5 animate-spin border border-current border-t-transparent"
                    style={{ borderRadius: "50%" }}
                  />
                  Generating executive report…
                </>
              ) : (
                <>
                  Generate executive report
                  <ArrowRight style={{ width: "12px", height: "12px" }} />
                </>
              )}
            </button>

            <p
              style={{
                marginTop: "0.85rem",
                textAlign: "center",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.14)",
              }}
            >
              Intake is governed. Run record is persisted. Not stored for marketing use.
              Decisions evaluated against an AI-accelerated market baseline.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExecutiveReportingRunPage({
  checkoutConfirmed = false,
  attribution,
}: ExecutiveReportingRunPageProps) {
  const [pageState, setPageState] = React.useState<PageState>("intake");
  const [result, setResult] = React.useState<Extract<ExecutiveReportingResult, { ok: true }> | null>(
    null,
  );
  const [thread, setThread] = React.useState<ConstitutionalThread | null>(null);
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [upstreamContext, setUpstreamContext] = React.useState<{ instrumentResultId?: string; marketContextId?: string }>({});

  React.useEffect(() => {
    trackStageStart("executive");

    // Detect upstream context from decision instruments or market intelligence
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const instrumentId = params.get("instrumentResultId");
      const marketId = params.get("marketContextId");
      if (instrumentId) {
        track("er_instrument_context_detected", { instrumentResultId: instrumentId });
        setUpstreamContext((prev) => ({ ...prev, instrumentResultId: instrumentId }));
      }
      if (marketId) {
        track("er_market_context_detected", { marketContextId: marketId });
        setUpstreamContext((prev) => ({ ...prev, marketContextId: marketId }));
      }
    }

    if (attribution?.source) {
      track("enterprise_attribution_captured", {
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
      });
    }
    track("executive_reporting_intake_started", {
      checkout_confirmed: checkoutConfirmed,
      attribution_source: attribution?.source ?? "organic",
    });
    if (checkoutConfirmed) {
      track("executive_reporting_checkout_returned_success", {
        stage: "executive",
      });
    }
    setThread(readConstitutionalThread());
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "cancelled") {
        const raw = window.sessionStorage.getItem("executive-report-result");
        if (raw) {
          const parsed = JSON.parse(raw) as ExecutiveReportingResult;
          if (parsed.ok) {
            setResult(parsed);
            setPageState("result");
          }
        }
      }
    } catch {
      // Session result restore is a convenience only.
    }
    const handleUnload = () => trackDropoff("executive");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  function handleGenerating() {
    setPageState("generating");
  }

  function handleError() {
    setPageState("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleResult(r: Extract<ExecutiveReportingResult, { ok: true }>) {
    setResult(r);
    setPageState("result");
    track("executive_reporting_intake_completed", {
      route: r.route || "DIAGNOSTIC",
    });
    track("executive_reporting_result_rendered", {
      route: r.route || "DIAGNOSTIC",
      has_thread: Boolean(readConstitutionalThread()),
    });
    trackStageComplete("executive", "strategy", "/strategy-room");

    // Handoff to the Strategy Room rung. Canonical key per the ladder chain
    // in CLAUDE_SESSION_LOG.md section 4:
    //   purpose-alignment-result → team-assessment-result
    //   → enterprise-assessment-result → executive-report-result
    //   → strategy-room-result
    // Mirrors the Team → Enterprise and Enterprise → ER write patterns.
    // Persists the full successful result so any downstream reader gets both
    // the report data and server-computed envelope fields.
    // Write executive findings into the constitutional thread
    // Compute prognosis for thread persistence
    const erConstitution = (r.canonical as any)?.constitution;
    const erReadinessNum = ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[String(erConstitution?.readinessTier || "")] ?? 50;
    const erFailureModes = Array.isArray(erConstitution?.failureModes) ? erConstitution.failureModes : [];
    const erTrajectory = inferTrajectory(Number(erConstitution?.clarityScore) || 50, erReadinessNum, erFailureModes);
    const erEngagement = deriveEngagementReadiness({
      revenueBand: String(erConstitution?.revenueBand || ""),
      urgencyWindow: String(erConstitution?.temperature) === "SCORCHING" ? "IMMEDIATE" : String(erConstitution?.temperature) === "HOT" ? "NEAR_TERM" : "MID_TERM",
      authorityScope: String(erConstitution?.authorityType || ""),
    });

    mergeExecutiveFindingsIntoThread({
      completedAt: new Date().toISOString(),
      runKey: r.runKey || "",
      route: r.route || "DIAGNOSTIC",
      orgState: erConstitution?.orgState || "DRIFTING",
      readinessTier: erConstitution?.readinessTier || "EMERGING",
      narrativeHeadline: (r.canonical as any)?.report?.narrative?.headline || "",
      trajectory: erTrajectory,
      engagementReadiness: erEngagement.readinessPercent,
      advisoryValueEstimate: erEngagement.advisoryValueFormatted,
      nextAction: erEngagement.nextActionLabel,
    });
    setThread(readConstitutionalThread());

    try {
      sessionStorage.setItem("executive-report-result", JSON.stringify(r));
    } catch {
      /* sessionStorage unavailable (private mode / SSR) — handoff degrades gracefully */
    }
  }

  function handleRerun() {
    setResult(null);
    setPageState("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Generate a board-grade executive intelligence brief from a structured constitutional intake."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: 0,
            right: 0,
            zIndex: 60,
          }}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="flex items-center gap-2">
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                <ArrowLeft style={{ width: "10px", height: "10px" }} />
                Executive Reporting
              </Link>
              <span style={{ color: "rgba(255,255,255,0.10)" }}>/</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}
              >
                {pageState === "result" ? "Brief" : pageState === "generating" ? "Generating" : "Intake"}
              </span>
            </div>
          </div>
        </div>

        {pageState === "intake" && (
          <>
            <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute"
                  style={{
                    right: "-5%",
                    top: "-15%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)`,
                    filter: "blur(140px)",
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
                />
                <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
              </div>

              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${GOLD}20, transparent)` }}
              />

              <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-12">
                <div className="pb-12 pt-28 text-center md:pt-32">
                  <div className="mb-8 flex justify-center">
                    <Eyebrow>Executive Reporting · {getProductDisplayPrice("executive_reporting")}</Eyebrow>
                  </div>

                  <h1
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(2.2rem, 5vw, 4rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.038em",
                      color: "rgba(255,255,255,0.94)",
                    }}
                  >
                    Decision enforcement intake.
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.28)" }}>The consequence is already compounding.</span>
                  </h1>

                  <p
                    style={{
                      margin: "1.25rem auto 0",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.38)",
                      maxWidth: "46ch",
                    }}
                  >
                    This prices the consequence, orders the decisions, and defines the enforcement path.
                    The condition compounds whether or not you proceed.
                  </p>
                  {checkoutConfirmed && (
                    <div
                      className="mx-auto mt-5 max-w-xl"
                      style={{
                        border: `1px solid ${GOLD}22`,
                        backgroundColor: `${GOLD}07`,
                        padding: "0.9rem 1.1rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.24em",
                          textTransform: "uppercase",
                          color: `${GOLD}A0`,
                        }}
                      >
                        Payment confirmed · continue with Executive Reporting
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "1.4rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "8px 12px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Lock style={{ width: "12px", height: "12px", color: `${GOLD}85` }} />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px",
                        letterSpacing: "0.24em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.24)",
                      }}
                    >
                      10–15 minute intake · Board-grade output · Strategy Room bridge
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <ExecutiveReportingIntake
              onGenerating={handleGenerating}
              onResult={handleResult}
              onError={handleError}
              onEmailCaptured={setSubmittedEmail}
            />
          </>
        )}

        {pageState === "generating" && (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: VOID,
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={GRAIN} />
            <div className="relative z-10 text-center">
              <div
                className="mx-auto mb-6 h-5 w-5 animate-spin border border-current border-t-transparent"
                style={{
                  borderColor: `${GOLD}80`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "0.85rem",
                }}
              >
                Assembling governed executive position…
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.28)",
                  fontStyle: "italic",
                }}
              >
                Evaluating constitutional posture, financial exposure, priority stack, and trajectory outlook.
              </p>
            </div>
          </div>
        )}

        {pageState === "result" && result && (
          <>
            <section
              style={{
                backgroundColor: VOID,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-12">
                <div className="pb-8 pt-20">
                  <div
                    className="mb-8 h-px w-8"
                    style={{ background: `linear-gradient(to right, ${GOLD}35, transparent)` }}
                  />
                  <Eyebrow>Executive Report · Generated</Eyebrow>
                </div>
              </div>
            </section>

            <ResultSurface result={result} onRerun={handleRerun} thread={thread} email={submittedEmail} />
          </>
        )}
      </div>
    </Layout>
  );
}


export const getServerSideProps: GetServerSideProps<ExecutiveReportingRunPageProps> = async (ctx) => {
  // Capture UTM attribution
  const attribution = {
    source: typeof ctx.query.utm_source === "string" ? ctx.query.utm_source : typeof ctx.query.source === "string" ? ctx.query.source : null,
    medium: typeof ctx.query.utm_medium === "string" ? ctx.query.utm_medium : null,
    campaign: typeof ctx.query.utm_campaign === "string" ? ctx.query.utm_campaign : null,
    referrer: ctx.req.headers.referer ?? null,
  };

  // Resolve identity from session/cookies first, fall back to query params
  let resolvedEmail: string | null = typeof ctx.query.email === "string" ? ctx.query.email : null;
  let resolvedUserId: string | null = typeof ctx.query.subjectId === "string" ? ctx.query.subjectId : null;
  try {
    const { resolveIdentity } = await import("@/lib/auth/resolve-identity");
    const cookieHeader = ctx.req.headers.cookie ?? "";
    const headers = new Headers();
    headers.set("cookie", cookieHeader);
    if (ctx.req.headers.host) headers.set("host", ctx.req.headers.host);
    const fakeReq = new Request(`http://${ctx.req.headers.host ?? "localhost"}${ctx.req.url}`, { headers });
    const identity = await resolveIdentity(fakeReq as any);
    resolvedEmail = identity.email ?? resolvedEmail;
    resolvedUserId = identity.subjectId ?? resolvedUserId;
  } catch { /* identity resolution is best-effort */ }

  const accessDecision = await enforceExecutiveReportingAccess({
    email: resolvedEmail,
    subjectId: resolvedUserId,
    campaignId: typeof ctx.query.campaignId === "string" ? ctx.query.campaignId : null,
    intakeMode: typeof ctx.query.intakeMode === "string" ? ctx.query.intakeMode : "ladder",
    sponsoredDirect: ctx.query.sponsoredDirect === "true",
    sponsorNameOrSeat: typeof ctx.query.sponsor === "string" ? ctx.query.sponsor : null,
    monitoringAccountId: typeof ctx.query.monitoringAccountId === "string" ? ctx.query.monitoringAccountId : null,
    monitoringContext: ctx.query.monitoring === "true",
  });

  if (!accessDecision.allowed) {
    return {
      redirect: {
        destination: `${accessDecision.requiredPath || "/diagnostics/watch"}?executive=blocked`,
        permanent: false,
      },
    };
  }

  if (ctx.query.checkout === "success") {
    try {
      const valid = await verifyCheckoutSessionForProduct(
        ctx.query.session_id,
        "executive_reporting",
      );
      if (valid && typeof ctx.query.session_id === "string") {
        setCommercialAccessCookie(ctx, "executive_reporting", ctx.query.session_id);
        return { props: { checkoutConfirmed: true, attribution } };
      }
    } catch {
      // Fall through to the paywall with a clean state.
    }
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId: resolvedUserId,
    email: resolvedEmail,
    slug: "assessment.executive_reporting",
  });

  if (entitlement.granted) {
    return { props: { checkoutConfirmed: false, attribution } };
  }

  return {
    redirect: {
      destination: "/diagnostics/executive-reporting?access=required",
      permanent: false,
    },
  };
};
