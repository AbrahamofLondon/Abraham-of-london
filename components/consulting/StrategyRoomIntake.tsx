"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
  Lock,
  Target,
  Scale,
  Shield,
  Building2,
  Clock,
  DollarSign,
  Briefcase,
  Compass,
  Gavel,
} from "lucide-react";
import Link from "next/link";

import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

export type StrategyRoomIntakeState = {
  name: string;
  email: string;
  organisation: string;
  sector: string;
  revenueBand: string;
  authorityRole: string;
  authorityScope: string;
  urgencyWindow: string;
  marketExposure: string;
  problemStatement: string;
  observedSymptoms: string;
  desiredOutcome: string;
  currentConstraint: string;
  boardInvolvement: string;
};

export type StrategyRoomIntakeProps = {
  onComplete?: () => void;
  initialData?: Partial<StrategyRoomIntakeState>;
};

type SubmitState = "idle" | "submitting" | "success" | "error";
type EvaluationPhase = "idle" | "reading" | "parsing" | "weighing" | "complete";

const STORAGE_KEY = "strategy-room-full-intake";
const GOLD = "#C9A96E";
const LIFT = "rgb(10 14 20)";
const CARD = "rgb(5 5 7)";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const REVENUE_BANDS = [
  { value: "under_1m", label: "Under £1M" },
  { value: "1m_10m", label: "£1M – £10M" },
  { value: "10m_50m", label: "£10M – £50M" },
  { value: "50m_250m", label: "£50M – £250M" },
  { value: "250m_plus", label: "£250M+" },
  { value: "classified", label: "Classified" },
];

const AUTHORITY_SCOPES = [
  { value: "final", label: "Final decision authority" },
  { value: "shared", label: "Shared / collective authority" },
  { value: "recommend", label: "Recommendation only" },
  { value: "observer", label: "Observer / advisory" },
];

const URGENCY_WINDOWS = [
  { value: "0_7", label: "Within 7 days" },
  { value: "8_30", label: "2–4 weeks" },
  { value: "31_90", label: "1–3 months" },
  { value: "90_plus", label: "3+ months" },
  { value: "unclear", label: "Unclear / not yet defined" },
];

const MARKET_EXPOSURE = [
  { value: "low", label: "Low — contained, limited downside" },
  { value: "moderate", label: "Moderate — measurable but manageable" },
  { value: "high", label: "High — material financial or reputational risk" },
  { value: "critical", label: "Critical — existential or near-existential" },
];

const BOARD_INVOLVEMENT = [
  { value: "full", label: "Fully engaged — board is driving" },
  { value: "partial", label: "Partially engaged — board aware, not leading" },
  { value: "limited", label: "Limited — board informed post-hoc" },
  { value: "none", label: "None — board not yet involved" },
];

const SECTORS = [
  { value: "governance", label: "Governance / Public Sector" },
  { value: "finance", label: "Financial Services" },
  { value: "operations", label: "Operations / Infrastructure" },
  { value: "technology", label: "Technology / Digital" },
  { value: "professional", label: "Professional Services" },
  { value: "manufacturing", label: "Manufacturing / Industrial" },
  { value: "nonprofit", label: "Nonprofit / Foundation" },
  { value: "sovereign", label: "Sovereign / State Entity" },
  { value: "other", label: "Other" },
];

const DEFAULT_STATE: StrategyRoomIntakeState = {
  name: "",
  email: "",
  organisation: "",
  sector: "",
  revenueBand: "",
  authorityRole: "",
  authorityScope: "",
  urgencyWindow: "",
  marketExposure: "",
  problemStatement: "",
  observedSymptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  boardInvolvement: "",
};

function SectionTitle({
  icon: Icon,
  index,
  title,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  index: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" style={{ color: `${GOLD}75` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "10px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.40)",
        }}
      >
        Section {index}
      </span>
      <span style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)", fontWeight: 500 }}>
        {title}
      </span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "0.45rem",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "10px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.40)",
      }}
    >
      {children}
    </label>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.10)",
  backgroundColor: "rgba(255,255,255,0.04)",
  padding: "0.85rem 1rem",
  color: "white",
  outline: "none",
};

function extractSignalProfile(form: StrategyRoomIntakeState) {
  return {
    authorityClarity:
      form.authorityScope === "final"
        ? "high"
        : form.authorityScope === "shared"
          ? "moderate"
          : "low",
    authorityRole: form.authorityRole,
    revenueWeight:
      form.revenueBand === "250m_plus"
        ? 95
        : form.revenueBand === "50m_250m"
          ? 85
          : form.revenueBand === "10m_50m"
            ? 70
            : 50,
    urgencyScore:
      form.urgencyWindow === "0_7"
        ? 95
        : form.urgencyWindow === "8_30"
          ? 80
          : form.urgencyWindow === "31_90"
            ? 60
            : 40,
    consequenceScore:
      form.marketExposure === "critical"
        ? 95
        : form.marketExposure === "high"
          ? 80
          : form.marketExposure === "moderate"
            ? 55
            : 30,
    governanceInvolvement: form.boardInvolvement,
    mandateSubstance:
      (form.problemStatement.length + form.observedSymptoms.length + form.desiredOutcome.length) / 3,
    constraintClarity: form.currentConstraint.length,
  };
}

function buildConstitutionalInput(form: StrategyRoomIntakeState) {
  const profile = extractSignalProfile(form);

  const mandateText = `
ORGANISATION: ${form.organisation} | Sector: ${form.sector}
Authority: ${form.authorityRole} (${form.authorityScope})
Revenue: ${form.revenueBand}

PROBLEM: ${form.problemStatement}

SYMPTOMS: ${form.observedSymptoms}

DESIRED OUTCOME: ${form.desiredOutcome}

CONSTRAINT: ${form.currentConstraint}

URGENCY: ${form.urgencyWindow} | Market Exposure: ${form.marketExposure}
Board Involvement: ${form.boardInvolvement}
  `;

  const urgencyScore = profile.urgencyScore;
  const consequenceScore = profile.consequenceScore;
  const clarityScore = Math.round((urgencyScore + consequenceScore) / 2);

  let authorityType: import("@/lib/constitution/rules").AuthorityType = "UNCLEAR";
  if (profile.authorityClarity === "high") authorityType = "DIRECT";
  else if (profile.authorityClarity === "moderate") authorityType = "PROXY";
  else authorityType = "UNCLEAR";

  let readinessTier: import("@/lib/constitution/rules").ReadinessTier = "FRAGILE";
  if (clarityScore >= 80) readinessTier = "SOVEREIGN";
  else if (clarityScore >= 60) readinessTier = "EXECUTION_READY";
  else if (clarityScore >= 40) readinessTier = "STABILIZING";
  else if (clarityScore >= 20) readinessTier = "EMERGING";

  let posture: import("@/lib/constitution/rules").OrgPosture = "ORDERED";
  if (consequenceScore >= 80) posture = "DISORDERED";
  else if (consequenceScore >= 60) posture = "MISALIGNED";
  else if (consequenceScore >= 40) posture = "DRIFTING";

  return {
    clarityScore,
    authorityType,
    readinessTier,
    posture,
    failureModeCount: 0,
    failureModeSeverity: Math.floor((100 - clarityScore) / 10),
    narrativeCoherence: clarityScore,
    interventionReadiness: clarityScore,
  };
}

function validateForm(state: StrategyRoomIntakeState): string | null {
  if (!state.name.trim()) return "Please provide your name.";
  if (!state.email.trim()) return "Please provide an institutional email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (!state.organisation.trim()) return "Please provide the organisation name.";
  if (!state.sector) return "Please select your sector.";
  if (!state.revenueBand) return "Please select revenue band.";
  if (!state.authorityRole.trim()) return "Please describe your authority role.";
  if (!state.authorityScope) return "Please select your authority scope.";
  if (!state.urgencyWindow) return "Please select urgency window.";
  if (!state.marketExposure) return "Please select market exposure level.";
  if (state.problemStatement.trim().length < 60) {
    return "Please describe the problem with more substance (minimum 60 characters).";
  }
  if (state.observedSymptoms.trim().length < 40) {
    return "Please describe observed symptoms with more detail (minimum 40 characters).";
  }
  if (state.desiredOutcome.trim().length < 30) {
    return "Please define the desired outcome with more clarity.";
  }
  if (state.currentConstraint.trim().length < 20) {
    return "Please describe the current constraint with more specificity.";
  }
  if (!state.boardInvolvement) return "Please select board involvement level.";
  return null;
}

export default function StrategyRoomIntake({
  onComplete,
  initialData,
}: StrategyRoomIntakeProps) {
  const [form, setForm] = React.useState<StrategyRoomIntakeState>(() => ({
    ...DEFAULT_STATE,
    ...initialData,
  }));
  const [phase, setPhase] = React.useState<EvaluationPhase>("idle");
  const [decision, setDecision] = React.useState<ConstitutionalDecision | null>(null);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [referenceId, setReferenceId] = React.useState("");
  const [expandedSections, setExpandedSections] = React.useState({
    identity: true,
    context: false,
    mandate: true,
    constraints: false,
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialData) {
        const parsed = JSON.parse(raw);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, [initialData]);

  React.useEffect(() => {
    if (submitState === "success") return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {}
    }, 800);
    return () => clearTimeout(timeout);
  }, [form, submitState]);

  const hasCoreSubstance =
    form.problemStatement.length > 50 &&
    form.observedSymptoms.length > 30 &&
    form.authorityRole.length > 5;

  React.useEffect(() => {
    if (!hasCoreSubstance) {
      setPhase("idle");
      setDecision(null);
      return;
    }

    let cancelled = false;

    const runEvaluation = async () => {
      setPhase("reading");
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;

      setPhase("parsing");
      await new Promise((r) => setTimeout(r, 380));
      if (cancelled) return;

      setPhase("weighing");
      await new Promise((r) => setTimeout(r, 420));
      if (cancelled) return;

      const input = buildConstitutionalInput(form);
      const result = evaluateConstitutionalRoute(input);
      if (cancelled) return;

      setDecision(result);
      setPhase("complete");
    };

    runEvaluation();

    return () => {
      cancelled = true;
    };
  }, [
    form.problemStatement,
    form.observedSymptoms,
    form.authorityRole,
    form.revenueBand,
    form.marketExposure,
    form.urgencyWindow,
    form.authorityScope,
    form.currentConstraint,
    hasCoreSubstance,
  ]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitState !== "idle") {
      setSubmitState("idle");
      setErrorMessage("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setSubmitState("error");
      setErrorMessage(validationError);
      return;
    }

    setSubmitState("submitting");

    try {
      const profile = extractSignalProfile(form);
      const constitutionalInput = buildConstitutionalInput(form);

      const payload = {
        ...form,
        extractedProfile: profile,
        constitutionalDecision: decision,
        constitutionalInput,
        source: "strategy_room_full_intake",
      };

      const res = await fetch("/api/strategy-room/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Submission failed");

      setSubmitState("success");
      setSuccessMessage(
        json.message || "Your mandate has been received. The chamber will respond within 48 hours.",
      );
      setReferenceId(json.referenceId || "");
      localStorage.removeItem(STORAGE_KEY);

      if (onComplete) setTimeout(onComplete, 3000);
    } catch (err: any) {
      setSubmitState("error");
      setErrorMessage(err.message || "Submission failed. Please try again.");
    }
  }

  const isQualified = decision?.route === "STRATEGY";
  const isDiagnostic = decision?.route === "DIAGNOSTIC";
  const confidence = decision?.confidence || 0;
  const profile = extractSignalProfile(form);

  const completedFields = [
    form.name,
    form.email,
    form.organisation,
    form.sector,
    form.revenueBand,
    form.authorityRole,
    form.authorityScope,
    form.urgencyWindow,
    form.marketExposure,
    form.problemStatement,
    form.observedSymptoms,
    form.desiredOutcome,
    form.currentConstraint,
    form.boardInvolvement,
  ].filter((f) => f && f.toString().trim().length > 0).length;

  const totalRequired = 14;
  const progress = Math.round((completedFields / totalRequired) * 100);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.40)",
            }}
          >
            Assessment progress
          </span>
          <span style={{ color: "rgba(255,255,255,0.60)" }}>
            {completedFields}/{totalRequired} fields
          </span>
        </div>
        <div style={{ height: "6px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.10)" }}>
          <motion.div
            style={{ height: "100%", backgroundColor: GOLD }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {(phase !== "idle" || decision) && hasCoreSubstance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: LIFT,
            padding: "1.25rem",
          }}
        >
          <div className="flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)", paddingBottom: "0.75rem" }}>
            <div
              className={cn(
                "h-2 w-2",
                phase === "complete" ? "" : "animate-pulse",
              )}
              style={{
                backgroundColor:
                  phase === "complete" ? "rgba(110,231,183,1)" : "rgba(201,169,110,1)",
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.40)",
              }}
            >
              {phase === "reading" && "Reading mandate signal..."}
              {phase === "parsing" && "Parsing authority, scale, and consequence..."}
              {phase === "weighing" && "Weighing against constitutional thresholds..."}
              {phase === "complete" && "Constitutional reading complete"}
              {phase === "idle" && "Awaiting mandate..."}
            </span>
          </div>

          {phase !== "idle" && hasCoreSubstance && (
            <div className="mt-4 space-y-3">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)",
                }}
              >
                Signal profile from your answers
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Gavel className="h-3 w-3" style={{ color: `${GOLD}70` }} />
                  <span className="text-[10px] text-white/50">Authority:</span>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      profile.authorityClarity === "high"
                        ? "text-emerald-400"
                        : profile.authorityClarity === "moderate"
                          ? "text-amber-400"
                          : "text-white/30",
                    )}
                  >
                    {profile.authorityClarity === "high"
                      ? "Clear"
                      : profile.authorityClarity === "moderate"
                        ? "Shared"
                        : "Unclear"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" style={{ color: `${GOLD}70` }} />
                  <span className="text-[10px] text-white/50">Scale:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.revenueWeight}/95</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" style={{ color: `${GOLD}70` }} />
                  <span className="text-[10px] text-white/50">Urgency:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.urgencyScore}/95</span>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" style={{ color: `${GOLD}70` }} />
                  <span className="text-[10px] text-white/50">Consequence:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.consequenceScore}/95</span>
                </div>
              </div>
            </div>
          )}

          {phase === "complete" && decision && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: "1rem",
                border: isQualified
                  ? "1px solid rgba(16,185,129,0.30)"
                  : isDiagnostic
                    ? `1px solid ${GOLD}25`
                    : "1px solid rgba(255,255,255,0.10)",
                backgroundColor: isQualified
                  ? "rgba(16,185,129,0.10)"
                  : isDiagnostic
                    ? `${GOLD}08`
                    : "rgba(255,255,255,0.04)",
                padding: "1rem",
              }}
            >
              <div className="flex items-start gap-3">
                {isQualified ? (
                  <Crown className="mt-0.5 h-4 w-4 text-emerald-400" />
                ) : isDiagnostic ? (
                  <Target className="mt-0.5 h-4 w-4" style={{ color: GOLD }} />
                ) : (
                  <Shield className="mt-0.5 h-4 w-4 text-white/40" />
                )}

                <div className="flex-1">
                  <div className="font-medium text-white">
                    {isQualified && "Mandate meets Strategy Room thresholds"}
                    {isDiagnostic && "Signal credible — refinement recommended"}
                    {!isQualified && !isDiagnostic && "Below threshold — more substance needed"}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div style={{ height: "6px", flex: 1, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.10)" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${confidence * 100}%`,
                          backgroundColor: isQualified ? "rgba(16,185,129,1)" : GOLD,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-white/30">
                      {Math.round(confidence * 100)}% confidence
                    </span>
                  </div>

                  {decision.disqualifiersTriggered &&
                    decision.disqualifiersTriggered.length > 0 &&
                    !isQualified && (
                      <div className="mt-3 space-y-1">
                        <div className="text-[9px] text-white/30">Disqualifiers:</div>
                        {decision.disqualifiersTriggered.slice(0, 3).map((item) => (
                          <div key={item} className="flex items-center gap-2 text-[9px] text-white/30">
                            <div className="h-1 w-1" style={{ backgroundColor: `${GOLD}70` }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, identity: !prev.identity }))
            }
            className="flex w-full items-center justify-between"
          >
            <SectionTitle icon={Shield} index="1" title="Identity & Contact" />
            <span style={{ color: "rgba(255,255,255,0.40)" }}>
              {expandedSections.identity ? "−" : "+"}
            </span>
          </button>

          {expandedSections.identity && (
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name of principal"
                  style={fieldStyle}
                  required
                />
              </div>

              <div>
                <FieldLabel>Institutional email</FieldLabel>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@institution.com"
                  style={fieldStyle}
                  required
                />
              </div>

              <div>
                <FieldLabel>Organisation / Institution</FieldLabel>
                <input
                  type="text"
                  name="organisation"
                  value={form.organisation}
                  onChange={handleChange}
                  placeholder="Company, board, fund, ministry, or operating entity"
                  style={fieldStyle}
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, context: !prev.context }))
            }
            className="flex w-full items-center justify-between"
          >
            <SectionTitle icon={Building2} index="2" title="Institutional Context" />
            <span style={{ color: "rgba(255,255,255,0.40)" }}>
              {expandedSections.context ? "−" : "+"}
            </span>
          </button>

          {expandedSections.context && (
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Sector</FieldLabel>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  style={fieldStyle}
                  required
                >
                  <option value="">Select sector</option>
                  {SECTORS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Revenue Band</FieldLabel>
                <select
                  name="revenueBand"
                  value={form.revenueBand}
                  onChange={handleChange}
                  style={fieldStyle}
                  required
                >
                  <option value="">Select revenue band</option>
                  {REVENUE_BANDS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Authority Role</FieldLabel>
                <input
                  type="text"
                  name="authorityRole"
                  value={form.authorityRole}
                  onChange={handleChange}
                  placeholder="Founder, CEO, Board Chair, Chief of Staff, Director..."
                  style={fieldStyle}
                  required
                />
              </div>

              <div>
                <FieldLabel>Authority Scope</FieldLabel>
                <select
                  name="authorityScope"
                  value={form.authorityScope}
                  onChange={handleChange}
                  style={fieldStyle}
                  required
                >
                  <option value="">Select authority scope</option>
                  {AUTHORITY_SCOPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
          <SectionTitle icon={Clock} index="3" title="Timing & Market Pressure" />

          <div className="mt-4 space-y-4">
            <div>
              <FieldLabel>Urgency Window</FieldLabel>
              <select
                name="urgencyWindow"
                value={form.urgencyWindow}
                onChange={handleChange}
                style={fieldStyle}
                required
              >
                <option value="">Select urgency window</option>
                {URGENCY_WINDOWS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Market Exposure</FieldLabel>
              <select
                name="marketExposure"
                value={form.marketExposure}
                onChange={handleChange}
                style={fieldStyle}
                required
              >
                <option value="">Select exposure level</option>
                {MARKET_EXPOSURE.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, mandate: !prev.mandate }))
            }
            className="flex w-full items-center justify-between"
          >
            <SectionTitle icon={Target} index="4" title="The Mandate" />
            <span style={{ color: "rgba(255,255,255,0.40)" }}>
              {expandedSections.mandate ? "−" : "+"}
            </span>
          </button>

          {expandedSections.mandate && (
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Problem Statement</FieldLabel>
                <textarea
                  name="problemStatement"
                  value={form.problemStatement}
                  onChange={handleChange}
                  rows={4}
                  placeholder="State the actual problem in structural terms, not just symptoms or frustration."
                  style={{ ...fieldStyle, resize: "vertical" }}
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.problemStatement.length}/60 min
                </div>
              </div>

              <div>
                <FieldLabel>Observed Symptoms</FieldLabel>
                <textarea
                  name="observedSymptoms"
                  value={form.observedSymptoms}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What are you seeing: drift, delays, confusion, politics, trust loss, weak execution, revenue pressure..."
                  style={{ ...fieldStyle, resize: "vertical" }}
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.observedSymptoms.length}/40 min
                </div>
              </div>

              <div>
                <FieldLabel>Desired Outcome</FieldLabel>
                <textarea
                  name="desiredOutcome"
                  value={form.desiredOutcome}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What decision-quality outcome are you trying to reach?"
                  style={{ ...fieldStyle, resize: "vertical" }}
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.desiredOutcome.length}/30 min
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem" }}>
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, constraints: !prev.constraints }))
            }
            className="flex w-full items-center justify-between"
          >
            <SectionTitle icon={Lock} index="5" title="Constraints & Stakeholders" />
            <span style={{ color: "rgba(255,255,255,0.40)" }}>
              {expandedSections.constraints ? "−" : "+"}
            </span>
          </button>

          {expandedSections.constraints && (
            <div className="mt-4 space-y-4">
              <div>
                <FieldLabel>Current Constraint</FieldLabel>
                <textarea
                  name="currentConstraint"
                  value={form.currentConstraint}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What is preventing movement right now: clarity, authority, money, timing, politics, governance, trust..."
                  style={{ ...fieldStyle, resize: "vertical" }}
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.currentConstraint.length}/20 min
                </div>
              </div>

              <div>
                <FieldLabel>Board / Senior Stakeholder Involvement</FieldLabel>
                <select
                  name="boardInvolvement"
                  value={form.boardInvolvement}
                  onChange={handleChange}
                  style={fieldStyle}
                  required
                >
                  <option value="">Select involvement level</option>
                  {BOARD_INVOLVEMENT.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            className="flex items-center gap-2"
            style={{
              border: "1px solid rgba(248,113,113,0.20)",
              backgroundColor: "rgba(248,113,113,0.10)",
              padding: "0.85rem 1rem",
              color: "rgb(252 165 165)",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="flex items-start gap-2"
            style={{
              border: "1px solid rgba(52,211,153,0.20)",
              backgroundColor: "rgba(16,185,129,0.10)",
              padding: "1rem",
              color: "rgb(110 231 183)",
            }}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <div>
              <div>{successMessage}</div>
              {referenceId && (
                <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-200/60">
                  Reference: {referenceId}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitState === "submitting" || !isQualified}
          className={cn("inline-flex w-full items-center justify-center gap-2 transition")}
          style={{
            padding: "1rem 1.25rem",
            border:
              submitState === "submitting" || !isQualified
                ? "1px solid rgba(255,255,255,0.10)"
                : `1px solid ${GOLD}40`,
            backgroundColor:
              submitState === "submitting" || !isQualified
                ? "rgba(255,255,255,0.05)"
                : `${GOLD}12`,
            color:
              submitState === "submitting" || !isQualified
                ? "rgba(255,255,255,0.30)"
                : "#111",
            cursor:
              submitState === "submitting" || !isQualified ? "not-allowed" : "pointer",
          }}
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              {isQualified ? "Submit for chamber review" : "Complete all fields to qualify"}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p
          style={{
            textAlign: "center",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.20)",
          }}
        >
          Submitting does not guarantee admission. It guarantees a serious reading.
        </p>
      </form>

      {isDiagnostic && phase === "complete" && (
        <div
          style={{
            border: `1px solid ${GOLD}20`,
            backgroundColor: `${GOLD}05`,
            padding: "1rem",
          }}
        >
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4" style={{ color: GOLD }} />
            <div>
              <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.60)" }}>
                Based on your full profile, the system recommends refinement before escalation.
              </p>
              <Link
                href="/diagnostics/executive-reporting"
                className="mt-2 inline-flex items-center gap-1 text-xs transition"
                style={{ color: `${GOLD}AA` }}
              >
                Begin with Executive Reporting
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}