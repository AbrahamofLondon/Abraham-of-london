/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/diagnostics/executive-reporting/run.tsx

import type { GetServerSideProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { trackStageStart, trackStageComplete, trackDropoff } from "@/lib/analytics/funnel";
import { track } from "@/lib/analytics/track";
import {
  mergeExecutiveFindingsIntoThread,
  readConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import EngagementReadinessPanel from "@/components/diagnostics/results/EngagementReadinessPanel";
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
import ThresholdProximityLine, {
  thresholdProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";
import ProofCapturePrompt from "@/components/proof/ProofCapturePrompt";
import StrategyRoomConversionBridge from "@/components/strategy-room/StrategyRoomConversionBridge";
import {
  hasCommercialAccessCookie,
  setCommercialAccessCookie,
  verifyCheckoutSessionForProduct,
} from "@/lib/server/billing/commercial-access";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";

type ExecutiveReportingIntakeForm = {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  sector: string;
  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  currentConstraint: string;
  authorityScope: string;
  sponsorNameOrSeat: string;
  boardInvolved: string;
  stakeholderBreadth: string;
  revenueBand: string;
  marketExposure: string;
  estimatedExposureGBP: string;
  decisionWindow: string;
  headcountAffected: string;
  evidenceQuality: string;
  evidenceNotes: string;
  priorAttemptOutcome: string;
  decisionQuestion: string;
  whatHappensIfNothingChanges: string;
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
    severityScore: number;
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
      severityScore?: number;
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
      canonical?: CanonicalReport;
      viewModel?: ExecutiveReportViewModel;
      entitlements?: {
        hasAccess?: boolean;
        status?: string;
        tier?: string;
        remainingRuns?: number | null;
        [key: string]: unknown;
      };
      diagnostics?: any;
    }
  | {
      ok: false;
      error: string;
    };

type PageState = "intake" | "generating" | "result";

type ExecutiveReportingRunPageProps = {
  checkoutConfirmed?: boolean;
};

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
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
      };
    }
  } catch {
    /* sessionStorage unavailable (private mode / SSR) — degrade gracefully */
  }

  return null;
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
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
          This report includes benchmark positioning against an anonymised cohort of comparable organisations. Cohort sample meets the minimum threshold for governed comparison.
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
    // Tier 3: Full team-wide sentiment — threshold met
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
    // Tier 2: Directional team signal — respondents exist but below threshold
    blocks.push(
      <div key="sentiment-directional" style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.75rem" }}>
          Directional team signal{sentimentConfidence !== null ? ` · ${sentimentConfidence}% confidence` : ""}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.48)" }}>
          Team evidence includes respondent data but has not yet reached the threshold for full team-wide sentiment. The signal is directional — it indicates tendency but cannot be presented as comprehensive team reality. Additional respondents would strengthen this section.
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

function ResultSurface({
  result,
  onRerun,
  thread,
}: {
  result: Extract<ExecutiveReportingResult, { ok: true }>;
  onRerun: () => void;
  thread: ConstitutionalThread | null;
}) {
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

  const dominantDomains = summary?.dominantDomains ?? constitution?.dominantDomains ?? [];
  const failureModes = summary?.failureModes ?? constitution?.failureModes ?? [];
  const requiredInterventions =
    summary?.requiredInterventions ?? constitution?.requiredInterventions ?? [];

  // Prognostic layer
  const readinessNum = ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[safeString(constitution?.readinessTier)] ?? 50;
  const trajectory = inferTrajectory(clarityScore, readinessNum, failureModes);
  const engagementReadiness = deriveEngagementReadiness({
    revenueBand: safeString(constitution?.revenueBand),
    problemStatement: "", // full problem was in the intake, not persisted in the result
    urgencyWindow: safeString(constitution?.temperature) === "SCORCHING" ? "IMMEDIATE" : safeString(constitution?.temperature) === "HOT" ? "NEAR_TERM" : "MID_TERM",
    authorityScope: safeString(constitution?.authorityType),
  });

  return (
    <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>Executive Report</Eyebrow>
            <h1
              style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.92)",
                maxWidth: "18ch",
              }}
            >
              {summary?.headline ?? canonical?.sections?.executiveSummary?.headline ?? "Executive Report generated."}
            </h1>

            <p
              style={{
                marginTop: "0.75rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.98rem",
                lineHeight: 1.68,
                color: "rgba(255,255,255,0.36)",
                maxWidth: "56ch",
              }}
            >
              {[header?.organisationName, summary?.state, header?.classification]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="mt-1 flex shrink-0 flex-wrap items-center gap-2.5">
            <span
              style={{
                padding: "5px 14px",
                border: `1px solid ${rc.border}`,
                backgroundColor: rc.bg,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: rc.text,
              }}
            >
              {route}
            </span>

            {header?.readinessTier && (
              <span
                style={{
                  padding: "5px 14px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.20em",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                {header.readinessTier}
              </span>
            )}

            <span
              style={{
                padding: "5px 14px",
                border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.20em",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {result.runKey}
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            {thread && (
              <InheritedThreadContext thread={thread} title="Diagnostic progression" />
            )}

            <TrajectoryLine trajectory={trajectory} />
            <EngagementReadinessPanel readiness={engagementReadiness} title="Engagement readiness prognosis" />

            {/* Claim-governed capability sections */}
            <ClaimGovernedCapabilities canonical={result.canonical} />

            {/* Basis of this brief — proof layer */}
            <BasisOfBriefBlock canonical={result.canonical} thread={thread} />

            <ProofCapturePrompt
              sourceStage="executive_reporting"
              routeResultType={route}
              mode="paid"
              isPaidStage
            />

            {(summary?.summary || summary?.mandate) && (
              <div
                style={{
                  border: `1px solid ${GOLD}20`,
                  backgroundColor: `${GOLD}07`,
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "1rem",
                  }}
                >
                  Executive summary
                </div>

                {summary?.summary && (
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.70)",
                    }}
                  >
                    {summary.summary}
                  </p>
                )}

                {summary?.mandate && (
                  <p
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.97rem",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.45)",
                      fontStyle: "italic",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: "1rem",
                    }}
                  >
                    {summary.mandate}
                  </p>
                )}
              </div>
            )}

            {(summary?.primaryConstraint ||
              summary?.structuralImplication ||
              summary?.routeReason) && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "1.5rem 1.75rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    marginBottom: "0.9rem",
                  }}
                >
                  Constitutional verdict
                </div>

                {summary?.primaryConstraint && (
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.02rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    Primary institutional constraint: {summary.primaryConstraint}
                  </p>
                )}

                {summary?.routeReason && (
                  <p
                    style={{
                      marginTop: "0.65rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.92rem",
                      lineHeight: 1.68,
                      color: "rgba(255,255,255,0.48)",
                    }}
                  >
                    Route decision: {summary.routeReason}
                  </p>
                )}

                <ThresholdProximityLine
                  text={thresholdProximityText({
                    label: "Clarity",
                    value: clarityScore,
                    thresholdLabel: "STRATEGY",
                    threshold: 65,
                  })}
                />

                {summary?.structuralImplication && (
                  <p
                    style={{
                      marginTop: "0.65rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.92rem",
                      lineHeight: 1.68,
                      color: "rgba(255,255,255,0.38)",
                      fontStyle: "italic",
                    }}
                  >
                    {summary.structuralImplication}
                  </p>
                )}
              </div>
            )}

            {findings.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    marginBottom: "0.85rem",
                  }}
                >
                  Board-level findings ({findings.length})
                </div>

                <div className="space-y-3">
                  {findings.map((f, i) => {
                    const severity = f.severity ?? "LOW";
                    const sc = severityColor(severity);

                    return (
                      <div
                        key={`${f.headline ?? "finding"}-${i}`}
                        style={{
                          border: `1px solid ${sc.border}`,
                          backgroundColor: sc.bg,
                          padding: "1.5rem",
                        }}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.32em",
                              textTransform: "uppercase",
                              color: sc.text,
                            }}
                          >
                            {f.domain ?? "DOMAIN"}
                          </span>

                          <span
                            style={{
                              padding: "2px 8px",
                              border: `1px solid ${sc.border}`,
                              backgroundColor: "rgba(0,0,0,0.20)",
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.28em",
                              textTransform: "uppercase",
                              color: sc.text,
                              flexShrink: 0,
                            }}
                          >
                            {severity}
                          </span>
                        </div>

                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.02rem",
                            lineHeight: 1.45,
                            color: "rgba(255,255,255,0.82)",
                            marginBottom: "0.6rem",
                          }}
                        >
                          {f.headline ?? "Finding"}
                        </p>

                        {f.reading && (
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.92rem",
                              lineHeight: 1.65,
                              color: "rgba(255,255,255,0.50)",
                              marginBottom: "0.6rem",
                            }}
                          >
                            {f.reading}
                          </p>
                        )}

                        {f.signal && (
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.88rem",
                              lineHeight: 1.60,
                              color: "rgba(255,255,255,0.32)",
                              fontStyle: "italic",
                            }}
                          >
                            Signal: {f.signal}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {telemetry?.domains && telemetry.domains.length > 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Strategic domain analysis
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {telemetry.domains.slice(0, 5).map((d, i) => (
                    <div key={`${d.label}-${i}`} style={{ padding: "0.95rem 1.25rem" }}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.30em",
                            textTransform: "uppercase",
                            color: `${GOLD}B0`,
                          }}
                        >
                          {d.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6.5px",
                            letterSpacing: "0.18em",
                            color: "rgba(255,255,255,0.38)",
                          }}
                        >
                          Dissonance {Math.round(d.dissonance)}
                        </span>
                      </div>

                      <div
                        className="grid gap-3 sm:grid-cols-3"
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.18em",
                          color: "rgba(255,255,255,0.50)",
                        }}
                      >
                        <div>Intent {Math.round(d.intent)}</div>
                        <div>Reality {Math.round(d.reality)}</div>
                        <div>Gap {Math.round(d.dissonance)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {observedOutcomes && (
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: `1px solid ${GOLD}10`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Observed Outcomes (System Evidence)
                  </span>
                </div>

                <div style={{ padding: "1.1rem 1.25rem" }}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricTile
                      label="Similar cases improved"
                      value={`${Math.round(safeNumber(observedOutcomes.improvedPercent, 0))}%`}
                    />
                    <MetricTile
                      label="Avg time to improvement"
                      value={
                        typeof observedOutcomes.averageTimeToImprovementDays === "number"
                          ? `${Math.round(observedOutcomes.averageTimeToImprovementDays)} days`
                          : "Pending"
                      }
                    />
                    <MetricTile
                      label="Failure rate when ignored"
                      value={`${Math.round(safeNumber(observedOutcomes.failureRateWhenIgnored, 0))}%`}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {(observedOutcomes.statements ?? []).slice(0, 3).map((statement, i) => (
                      <div
                        key={`${statement}-${i}`}
                        className="flex items-start gap-2.5"
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.94rem",
                          lineHeight: 1.65,
                          color: "rgba(255,255,255,0.68)",
                        }}
                      >
                        <Scale
                          style={{
                            width: "13px",
                            height: "13px",
                            color: `${GOLD}85`,
                            flexShrink: 0,
                            marginTop: "5px",
                          }}
                        />
                        <span>{statement}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: "0.9rem",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.24)",
                    }}
                  >
                    Cases processed: {safeNumber(observedOutcomes.processedDecisionCases, 0)} · Confidence: {observedOutcomes.confidence ?? "insufficient"}
                  </div>
                </div>
              </div>
            )}

            {boardActions.length > 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Board actions
                  </span>
                </div>

                <div style={{ padding: "1rem 1.25rem" }}>
                  {boardActions.map((a, i) => (
                    <div
                      key={`${a}-${i}`}
                      className="flex items-start gap-3 py-2.5"
                      style={{
                        borderBottom: i < boardActions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <CheckSquare
                        style={{
                          width: "13px",
                          height: "13px",
                          color: `${GOLD}80`,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.97rem",
                          lineHeight: 1.60,
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    Governed recommendations
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {recommendations.recommendations.slice(0, 4).map((rec, i) => (
                    <div key={`${rec.id}-${i}`} style={{ padding: "1rem 1.25rem" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.98rem",
                              color: "rgba(255,255,255,0.76)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {rec.title}
                          </p>

                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.26em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.22)",
                              marginBottom: "0.45rem",
                            }}
                          >
                            {rec.kind} · {rec.priority} · Score {Math.round(rec.score)}
                          </div>

                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                              color: "rgba(255,255,255,0.44)",
                              marginBottom: rec.reasons.length ? "0.5rem" : 0,
                            }}
                          >
                            {rec.description}
                          </p>

                          {rec.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {rec.reasons.slice(0, 3).map((reason) => (
                                <span
                                  key={reason}
                                  style={{
                                    padding: "3px 7px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                    fontSize: "6px",
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.24)",
                                  }}
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {rec.href && (
                          <Link
                            href={rec.href}
                            className="inline-flex shrink-0 items-center gap-1 transition-opacity hover:opacity-70"
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.24em",
                              textTransform: "uppercase",
                              color: `${GOLD}AA`,
                            }}
                          >
                            Open
                            <ArrowRight style={{ width: "10px", height: "10px" }} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations?.matchedAssets && recommendations.matchedAssets.length > 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Matched assets
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {recommendations.matchedAssets.slice(0, 4).map((asset, i) => (
                    <div key={`${asset.id}-${i}`} style={{ padding: "1rem 1.25rem" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.98rem",
                              color: "rgba(255,255,255,0.76)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {asset.title}
                          </p>

                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.26em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.22)",
                              marginBottom: "0.45rem",
                            }}
                          >
                            {asset.kind} · Confidence {Math.round(asset.confidence)}
                          </div>

                          {asset.commercialUseCases && asset.commercialUseCases.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {asset.commercialUseCases.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    padding: "3px 7px",
                                    border: `1px solid ${GOLD}22`,
                                    backgroundColor: `${GOLD}08`,
                                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                    fontSize: "6px",
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: `${GOLD}BE`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {asset.href && (
                          <Link
                            href={asset.href}
                            className="inline-flex shrink-0 items-center gap-1 transition-opacity hover:opacity-70"
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.24em",
                              textTransform: "uppercase",
                              color: `${GOLD}AA`,
                            }}
                          >
                            Open
                            <ArrowRight style={{ width: "10px", height: "10px" }} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextAction && (
              <div
                style={{
                  border: `1px solid ${GOLD}22`,
                  backgroundColor: `${GOLD}06`,
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "0.65rem",
                  }}
                >
                  Constitutional mandate
                </div>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.05rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.72)",
                    fontStyle: "italic",
                  }}
                >
                  {nextAction}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {header && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Report header
                  </span>
                </div>
                <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                  <MetricRow label="Report ID" value={header.reportId} />
                  <MetricRow label="Organisation" value={header.organisationName} />
                  <MetricRow label="Route" value={header.route} />
                  <MetricRow label="Authority" value={header.authorityType} />
                  <MetricRow label="Readiness tier" value={header.readinessTier} />
                  <MetricRow label="Confidence" value={fmtPercent(header.confidence)} />
                  <MetricRow label="Generated" value={formatDate(header.generatedAt)} />
                </div>
              </div>
            )}

            {constitution && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Constitutional posture
                  </span>
                </div>
                <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                  <MetricRow label="Org state" value={constitution.orgState} />
                  <MetricRow label="Priority" value={constitution.priority} />
                  <MetricRow label="Temperature" value={constitution.temperature} />
                  <MetricRow label="Clarity score" value={fmtPercent(constitution.clarityScore)} />
                  <MetricRow label="Authority score" value={fmtPercent(constitution.authorityScore)} />
                  <MetricRow label="Governance score" value={fmtPercent(constitution.governanceScore)} />
                  <MetricRow label="Severity score" value={fmtPercent(constitution.severityScore)} />
                  <MetricRow label="Revenue band" value={constitution.revenueBand} />
                  <MetricRow label="Market risk band" value={constitution.marketRiskBand} />
                </div>
              </div>
            )}

            {telemetry && (
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06` }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: `1px solid ${GOLD}10`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Integrity snapshot
                  </span>
                </div>
                <div style={{ padding: "0.75rem 1.25rem" }}>
                  <MetricRow label="Sovereign certainty" value={fmtPercent(telemetry.sovereignCertainty)} />
                  <MetricRow label="Burnout index" value={fmtPercent(telemetry.burnoutIndex)} />
                  <MetricRow label="Average dissonance" value={String(Math.round(telemetry.averageDissonance))} />
                  <MetricRow label="Authorized" value={telemetry.authorized ? "YES" : "NO"} />
                </div>
              </div>
            )}

            {financialExposure && (
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06` }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: `1px solid ${GOLD}10`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Financial exposure estimate
                  </span>
                </div>
                <div style={{ padding: "0.75rem 1.25rem" }}>
                  <MetricRow label="Replacement cost" value={financialExposure.replacementCostFormatted} />
                  <MetricRow label="Execution loss" value={financialExposure.executionLossFormatted} />
                  <MetricRow label="Total exposure" value={financialExposure.totalExposureFormatted} />
                </div>
              </div>
            )}

            {summary?.priorityStack && summary.priorityStack.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    Priority stack
                  </span>
                </div>
                <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                  {summary.priorityStack.slice(0, 6).map((item, i) => (
                    <div
                      key={`${item}-${i}`}
                      className="flex items-start gap-2.5 py-2"
                      style={{
                        borderBottom: i < summary.priorityStack.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.4rem",
                          lineHeight: 1,
                          color: `${GOLD}25`,
                          flexShrink: 0,
                          minWidth: "22px",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.88rem",
                          lineHeight: 1.55,
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requiredInterventions.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                  padding: "1rem 1.25rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.36em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.18)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Required interventions
                </div>
                {requiredInterventions.slice(0, 6).map((m, i) => (
                  <div key={`${m}-${i}`} className="flex items-start gap-2.5 py-1.5">
                    <Target
                      style={{
                        width: "11px",
                        height: "11px",
                        color: `${GOLD}75`,
                        flexShrink: 0,
                        marginTop: "3px",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.50)",
                      }}
                    >
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {failureModes.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(252,165,165,0.12)",
                  backgroundColor: "rgba(252,165,165,0.03)",
                  padding: "1rem 1.25rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.36em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.60)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Failure modes
                </div>

                {failureModes.map((m, i) => (
                  <div key={`${m}-${i}`} className="flex items-start gap-2.5 py-1.5">
                    <AlertTriangle
                      style={{
                        width: "11px",
                        height: "11px",
                        color: "rgba(252,165,165,0.55)",
                        flexShrink: 0,
                        marginTop: "3px",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.50)",
                      }}
                    >
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(dominantDomains.length > 0 ||
              recommendations?.audience?.length ||
              recommendations?.commercialUseCases?.length ||
              recommendations?.transformationStage?.length ||
              summary?.rationale?.length ||
              entitlements) && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Diagnostic metadata
                  </span>
                </div>
                <div style={{ padding: "1rem 1.25rem" }}>
                  {dominantDomains.length > 0 && (
                    <>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: `${GOLD}9A`,
                          marginBottom: "0.55rem",
                        }}
                      >
                        Dominant domains
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {dominantDomains.slice(0, 5).map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "4px 8px",
                              border: `1px solid ${GOLD}22`,
                              backgroundColor: `${GOLD}08`,
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6px",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: `${GOLD}BE`,
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {recommendations?.audience?.length ? (
                    <>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                          marginBottom: "0.55rem",
                        }}
                      >
                        Audience
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {recommendations.audience.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "4px 8px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6px",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.26)",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {recommendations?.commercialUseCases?.length ? (
                    <>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                          marginBottom: "0.55rem",
                        }}
                      >
                        Commercial use cases
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {recommendations.commercialUseCases.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "4px 8px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6px",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.26)",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {recommendations?.transformationStage?.length ? (
                    <>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                          marginBottom: "0.55rem",
                        }}
                      >
                        Transformation stage
                      </div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {recommendations.transformationStage.slice(0, 4).map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "4px 8px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6px",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.26)",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {summary?.rationale?.length ? (
                    <>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.30em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.24)",
                          marginBottom: "0.65rem",
                        }}
                      >
                        Rationale
                      </div>
                      <div className="space-y-2">
                        {summary.rationale.slice(0, 4).map((item, i) => (
                          <div key={`${item}-${i}`} className="flex items-start gap-2.5">
                            <Scale
                              style={{
                                width: "11px",
                                height: "11px",
                                color: "rgba(255,255,255,0.22)",
                                flexShrink: 0,
                                marginTop: "4px",
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                                fontWeight: 300,
                                fontSize: "0.87rem",
                                lineHeight: 1.55,
                                color: "rgba(255,255,255,0.44)",
                              }}
                            >
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {entitlements && (
                    <div style={{ marginTop: summary?.rationale?.length ? "1rem" : 0 }}>
                      <GoldRule soft />
                      <div style={{ marginTop: "1rem" }}>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6.5px",
                            letterSpacing: "0.30em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.24)",
                            marginBottom: "0.55rem",
                          }}
                        >
                          Access status
                        </div>
                        <div className="space-y-1.5">
                          {"status" in entitlements && (
                            <div
                              style={{
                                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                                fontWeight: 300,
                                fontSize: "0.9rem",
                                color: "rgba(255,255,255,0.50)",
                              }}
                            >
                              Status: {safeString(entitlements.status, "active")}
                            </div>
                          )}
                          {"tier" in entitlements && (
                            <div
                              style={{
                                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                                fontWeight: 300,
                                fontSize: "0.9rem",
                                color: "rgba(255,255,255,0.50)",
                              }}
                            >
                              Tier: {safeString(entitlements.tier, "standard")}
                            </div>
                          )}
                          {"remainingRuns" in entitlements && entitlements.remainingRuns != null && (
                            <div
                              style={{
                                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                                fontWeight: 300,
                                fontSize: "0.9rem",
                                color: "rgba(255,255,255,0.50)",
                              }}
                            >
                              Remaining runs: {String(entitlements.remainingRuns)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.75rem 2rem",
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.01)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.97rem",
                  color: "rgba(255,255,255,0.35)",
                  fontStyle: "italic",
                }}
              >
                {route === "STRATEGY"
                  ? "The constitutional signal warrants direct strategic engagement."
                  : route === "REJECT"
                    ? "The matter is not yet at decision-grade threshold. Foundational work should precede escalation."
                    : "A diagnostic reading has been produced. Structured correction should precede premium escalation."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {route === "STRATEGY" && (
                <Link
                  href="/strategy-room"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${GOLD}35`,
                    backgroundColor: `${GOLD}0D`,
                    color: `${GOLD}BB`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${GOLD}60`;
                    e.currentTarget.style.backgroundColor = `${GOLD}18`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${GOLD}35`;
                    e.currentTarget.style.backgroundColor = `${GOLD}0D`;
                  }}
                >
                  Strategy Room
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
              )}

              {(route === "DIAGNOSTIC" || route === "REJECT") && (
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${GOLD}28`,
                    backgroundColor: `${GOLD}08`,
                    color: `${GOLD}AA`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${GOLD}4A`;
                    e.currentTarget.style.backgroundColor = `${GOLD}12`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${GOLD}28`;
                    e.currentTarget.style.backgroundColor = `${GOLD}08`;
                  }}
                >
                  Diagnostic ladder
                  <ChevronRight style={{ width: "11px", height: "11px" }} />
                </Link>
              )}

              <button
                type="button"
                onClick={onRerun}
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.28)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                }}
              >
                Rerun diagnostic
              </button>
            </div>
          </div>
        </div>

        <StrategyRoomConversionBridge
          className="mt-10"
          price={395}
          ctaHref="/strategy-room"
          checkoutPriceCode="strategy_room"
          originPath="/diagnostics/executive-reporting/run"
          primaryCtaLabel="Enter Strategy Room"
          title="You now have the interpretation. Strategy Room is where it becomes intervention."
          description="Executive Reporting shows the constitutional constraint, exposure, and priority stack. Strategy Room is the premium escalation for turning that reading into governed action under real decision pressure."
          signals={[
            "The report has identified a material constraint that requires a decision",
            "The next risk is delay, avoidance, or fragmented execution",
            "You need intervention logic, not another layer of interpretation",
          ]}
        />
      </div>
    </div>
  );
}

function ExecutiveReportingIntake({
  onGenerating,
  onResult,
  onError,
}: {
  onGenerating: () => void;
  onResult: (r: Extract<ExecutiveReportingResult, { ok: true }>) => void;
  onError: () => void;
}) {
  const [form, setForm] = React.useState<ExecutiveReportingIntakeForm>(INITIAL);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [upstreamContext, setUpstreamContext] =
    React.useState<LadderUpstreamContext | null>(null);

  React.useEffect(() => {
    setUpstreamContext(readLadderUpstreamContext());
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
              Deterministic logic — no generic output
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
                <Field label="Sector">
                  <Input name="sector" value={form.sector} onChange={handleChange} placeholder="Sector or operating context" />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Current condition" />
              <div className="space-y-4">
                <Field label="Problem statement" required>
                  <Textarea
                    name="problemStatement"
                    value={form.problemStatement}
                    onChange={handleChange}
                    rows={6}
                    placeholder="State the structural problem, not just the symptoms. Minimum 120 characters."
                  />
                </Field>
                <Field label="Observed symptoms" required>
                  <Textarea
                    name="symptoms"
                    value={form.symptoms}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe what is visible on the ground."
                  />
                </Field>
                <Field label="Desired outcome" required>
                  <Textarea
                    name="desiredOutcome"
                    value={form.desiredOutcome}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What decision-grade outcome is required?"
                  />
                </Field>
                <Field label="Current constraint" required>
                  <Textarea
                    name="currentConstraint"
                    value={form.currentConstraint}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What is materially preventing movement?"
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Authority & decision scope" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Authority scope" required>
                  <Select
                    name="authorityScope"
                    value={form.authorityScope}
                    onChange={handleChange}
                    options={[
                      { label: "I decide directly (DIRECT)", value: "DIRECT" },
                      { label: "I influence and sponsor (PROXY)", value: "PROXY" },
                      { label: "I am exploring only (UNCLEAR)", value: "UNCLEAR" },
                    ]}
                  />
                </Field>
                <Field label="Decision sponsor or seat" required>
                  <Input
                    name="sponsorNameOrSeat"
                    value={form.sponsorNameOrSeat}
                    onChange={handleChange}
                    placeholder="Name or position of decision sponsor"
                  />
                </Field>
                <Field label="Board involved">
                  <Select
                    name="boardInvolved"
                    value={form.boardInvolved}
                    onChange={handleChange}
                    options={[
                      { label: "Yes", value: "YES" },
                      { label: "No", value: "NO" },
                      { label: "Not yet / uncertain", value: "UNCERTAIN" },
                    ]}
                  />
                </Field>
                <Field label="Stakeholder breadth">
                  <Select
                    name="stakeholderBreadth"
                    value={form.stakeholderBreadth}
                    onChange={handleChange}
                    options={[
                      { label: "Individual / local", value: "LOCAL" },
                      { label: "Multi-team", value: "MULTI_TEAM" },
                      { label: "Executive level", value: "EXECUTIVE" },
                      { label: "Board level", value: "BOARD" },
                      { label: "Institutional", value: "INSTITUTIONAL" },
                    ]}
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Economics & consequence" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Revenue band" required>
                  <Select
                    name="revenueBand"
                    value={form.revenueBand}
                    onChange={handleChange}
                    options={[
                      { label: "Under £50k", value: "MICRO" },
                      { label: "£50k – £250k", value: "SMB" },
                      { label: "£250k – £1m", value: "MID" },
                      { label: "£1m – £10m", value: "ENTERPRISE" },
                      { label: "Above £10m", value: "WHALE" },
                    ]}
                  />
                </Field>
                <Field label="Market exposure" required>
                  <Select
                    name="marketExposure"
                    value={form.marketExposure}
                    onChange={handleChange}
                    options={[
                      { label: "Stable", value: "LOW" },
                      { label: "Some volatility", value: "MEDIUM" },
                      { label: "Meaningful pressure", value: "HIGH" },
                      { label: "Severe instability", value: "CRITICAL" },
                    ]}
                  />
                </Field>
                <Field label="Estimated financial exposure (£)" required>
                  <Input
                    name="estimatedExposureGBP"
                    value={form.estimatedExposureGBP}
                    onChange={handleChange}
                    type="number"
                    placeholder="e.g. 500000"
                  />
                </Field>
                <Field label="Decision window">
                  <Select
                    name="decisionWindow"
                    value={form.decisionWindow}
                    onChange={handleChange}
                    options={[
                      { label: "Immediate / 30 days", value: "IMMEDIATE" },
                      { label: "Quarter / 90 days", value: "NEAR_TERM" },
                      { label: "6–12 months", value: "MID_TERM" },
                      { label: "Long horizon", value: "LONG_HORIZON" },
                    ]}
                  />
                </Field>
                <Field label="Headcount affected">
                  <Input
                    name="headcountAffected"
                    value={form.headcountAffected}
                    onChange={handleChange}
                    type="number"
                    placeholder="Number of people affected"
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Evidence quality & prior attempts" />
              <div className="space-y-4">
                <Field label="Evidence quality" required>
                  <Select
                    name="evidenceQuality"
                    value={form.evidenceQuality}
                    onChange={handleChange}
                    options={[
                      { label: "High — documented, recent, cross-verified", value: "HIGH" },
                      { label: "Medium — partial documentation", value: "MEDIUM" },
                      { label: "Low — largely anecdotal", value: "LOW" },
                    ]}
                  />
                </Field>
                <Field label="Evidence notes" required>
                  <Textarea
                    name="evidenceNotes"
                    value={form.evidenceNotes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the evidence base and its quality."
                  />
                </Field>
                <Field label="Prior correction attempts">
                  <Select
                    name="priorAttemptOutcome"
                    value={form.priorAttemptOutcome}
                    onChange={handleChange}
                    options={[
                      { label: "None — first attempt", value: "NONE" },
                      { label: "Attempted — partially worked", value: "PARTIAL" },
                      { label: "Attempted — did not hold", value: "FAILED" },
                      { label: "Attempted — situation worsened", value: "WORSENED" },
                    ]}
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Timing & consequence" />
              <div className="space-y-4">
                <Field label="Decision question" required>
                  <Textarea
                    name="decisionQuestion"
                    value={form.decisionQuestion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What specific decision needs to be made?"
                  />
                </Field>
                <Field label="Cost of inaction" required>
                  <Textarea
                    name="whatHappensIfNothingChanges"
                    value={form.whatHappensIfNothingChanges}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What compounds if nothing changes?"
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
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExecutiveReportingRunPage({
  checkoutConfirmed = false,
}: ExecutiveReportingRunPageProps) {
  const [pageState, setPageState] = React.useState<PageState>("intake");
  const [result, setResult] = React.useState<Extract<ExecutiveReportingResult, { ok: true }> | null>(
    null,
  );
  const [thread, setThread] = React.useState<ConstitutionalThread | null>(null);

  React.useEffect(() => {
    trackStageStart("executive");
    track("executive_reporting_intake_started", {
      checkout_confirmed: checkoutConfirmed,
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
                    <Eyebrow>Executive Reporting · £95</Eyebrow>
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
                    Paid interpretation intake.
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.28)" }}>Receive the consequence map.</span>
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
                    This is the first paid layer in the ladder: a board-grade interpretation
                    of structural strain, financial exposure, priority order, and the next
                    decision path.
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

            <ResultSurface result={result} onRerun={handleRerun} thread={thread} />
          </>
        )}
      </div>
    </Layout>
  );
}


export const getServerSideProps: GetServerSideProps<ExecutiveReportingRunPageProps> = async (ctx) => {
  const accessDecision = await enforceExecutiveReportingAccess({
    email: typeof ctx.query.email === "string" ? ctx.query.email : null,
    subjectId: typeof ctx.query.subjectId === "string" ? ctx.query.subjectId : null,
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

  const hasCookie = hasCommercialAccessCookie(ctx.req.headers.cookie, "executive_reporting");
  if (hasCookie) return { props: { checkoutConfirmed: ctx.query.checkout === "success" } };

  if (ctx.query.checkout === "success") {
    try {
      const valid = await verifyCheckoutSessionForProduct(
        ctx.query.session_id,
        "executive_reporting",
      );
      if (valid && typeof ctx.query.session_id === "string") {
        setCommercialAccessCookie(ctx, "executive_reporting", ctx.query.session_id);
        return { props: { checkoutConfirmed: true } };
      }
    } catch {
      // Fall through to the paywall with a clean state.
    }
  }

  return {
    redirect: {
      destination: "/diagnostics/executive-reporting?access=required",
      permanent: false,
    },
  };
};
