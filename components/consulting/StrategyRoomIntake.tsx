/* ============================================================================
   FILE: components/consulting/StrategyRoomIntake.tsx
   STRATEGY ROOM INTAKE — Full Constitutional Assessment
   14 questions. Each one feeds the engine. No shortcuts.
============================================================================ */

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
  Gavel,
  Scale,
  Eye,
  Zap,
  Shield,
  Building2,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Compass,
} from "lucide-react";
import Link from "next/link";

// Import the constitutional engine types
import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

// Full form state — 14 fields that actually feed the engine
export type StrategyRoomIntakeState = {
  // Identity (3 fields)
  name: string;
  email: string;
  organisation: string;
  
  // Institutional context (4 fields)
  sector: string;
  revenueBand: string;
  authorityRole: string;
  authorityScope: string;
  
  // Timing & pressure (2 fields)
  urgencyWindow: string;
  marketExposure: string;
  
  // The mandate (3 fields)
  problemStatement: string;
  observedSymptoms: string;
  desiredOutcome: string;
  
  // Constraints & stakeholders (2 fields)
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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Revenue band options
const REVENUE_BANDS = [
  { value: "under_1m", label: "Under £1M" },
  { value: "1m_10m", label: "£1M – £10M" },
  { value: "10m_50m", label: "£10M – £50M" },
  { value: "50m_250m", label: "£50M – £250M" },
  { value: "250m_plus", label: "£250M+" },
  { value: "classified", label: "Classified" },
];

// Authority scope options
const AUTHORITY_SCOPES = [
  { value: "final", label: "Final decision authority" },
  { value: "shared", label: "Shared / collective authority" },
  { value: "recommend", label: "Recommendation only" },
  { value: "observer", label: "Observer / advisory" },
];

// Urgency windows
const URGENCY_WINDOWS = [
  { value: "0_7", label: "Within 7 days" },
  { value: "8_30", label: "2–4 weeks" },
  { value: "31_90", label: "1–3 months" },
  { value: "90_plus", label: "3+ months" },
  { value: "unclear", label: "Unclear / not yet defined" },
];

// Market exposure levels
const MARKET_EXPOSURE = [
  { value: "low", label: "Low — contained, limited downside" },
  { value: "moderate", label: "Moderate — measurable but manageable" },
  { value: "high", label: "High — material financial or reputational risk" },
  { value: "critical", label: "Critical — existential or near-existential" },
];

// Board involvement levels
const BOARD_INVOLVEMENT = [
  { value: "full", label: "Fully engaged — board is driving" },
  { value: "partial", label: "Partially engaged — board aware, not leading" },
  { value: "limited", label: "Limited — board informed post-hoc" },
  { value: "none", label: "None — board not yet involved" },
];

// Sector options
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

// Helper to extract signals from each field for transparent display
function extractSignalProfile(form: StrategyRoomIntakeState) {
  return {
    authorityClarity: form.authorityScope === "final" ? "high" : form.authorityScope === "shared" ? "moderate" : "low",
    authorityRole: form.authorityRole,
    revenueWeight: form.revenueBand === "250m_plus" ? 95 : form.revenueBand === "50m_250m" ? 85 : form.revenueBand === "10m_50m" ? 70 : 50,
    urgencyScore: form.urgencyWindow === "0_7" ? 95 : form.urgencyWindow === "8_30" ? 80 : form.urgencyWindow === "31_90" ? 60 : 40,
    consequenceScore: form.marketExposure === "critical" ? 95 : form.marketExposure === "high" ? 80 : form.marketExposure === "moderate" ? 55 : 30,
    governanceInvolvement: form.boardInvolvement,
    mandateSubstance: (form.problemStatement.length + form.observedSymptoms.length + form.desiredOutcome.length) / 3,
    constraintClarity: form.currentConstraint.length,
  };
}

// Build the constitutional input from all 14 fields
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
  
  return {
    mandateText,
    role: form.authorityRole,
    jurisdiction: "international",
    organisationType: form.sector === "sovereign" ? "sovereign" : "corporation",
    annualRevenueBand: form.revenueBand,
    authorityClarity: profile.authorityClarity,
    urgencyScore: profile.urgencyScore,
    consequenceScore: profile.consequenceScore,
    governanceInvolvement: profile.governanceInvolvement,
    constraintClarity: profile.constraintClarity,
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

export default function StrategyRoomIntake({ onComplete, initialData }: StrategyRoomIntakeProps) {
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

  // Load draft
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && !initialData) {
        const parsed = JSON.parse(raw);
        setForm(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, [initialData]);

  // Auto-save
  React.useEffect(() => {
    if (submitState === "success") return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      } catch {}
    }, 800);
    return () => clearTimeout(timeout);
  }, [form, submitState]);

  // Evaluate as user completes fields
  const hasCoreSubstance = form.problemStatement.length > 50 && 
                           form.observedSymptoms.length > 30 && 
                           form.authorityRole.length > 5;

  React.useEffect(() => {
    if (!hasCoreSubstance) {
      setPhase("idle");
      setDecision(null);
      return;
    }

    const runEvaluation = async () => {
      setPhase("reading");
      await new Promise(r => setTimeout(r, 400));
      setPhase("parsing");
      await new Promise(r => setTimeout(r, 500));
      setPhase("weighing");
      await new Promise(r => setTimeout(r, 600));
      
      const input = buildConstitutionalInput(form);
      const result = evaluateConstitutionalRoute(input);
      setDecision(result);
      setPhase("complete");
    };

    runEvaluation();
  }, [form.problemStatement, form.observedSymptoms, form.authorityRole, form.revenueBand, form.marketExposure, form.urgencyWindow, hasCoreSubstance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (submitState !== "idle") {
      setSubmitState("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setSuccessMessage(json.message || "Your mandate has been received. The chamber will respond within 48 hours.");
      setReferenceId(json.referenceId || "");
      localStorage.removeItem(STORAGE_KEY);
      
      if (onComplete) setTimeout(onComplete, 3000);
    } catch (err: any) {
      setSubmitState("error");
      setErrorMessage(err.message || "Submission failed. Please try again.");
    }
  };

  const isQualified = decision?.route === "STRATEGY";
  const isDiagnostic = decision?.route === "DIAGNOSTIC";
  const confidence = decision?.confidence || 0;
  const profile = extractSignalProfile(form);

  // Count completed required fields
  const completedFields = [
    form.name, form.email, form.organisation, form.sector, form.revenueBand,
    form.authorityRole, form.authorityScope, form.urgencyWindow, form.marketExposure,
    form.problemStatement, form.observedSymptoms, form.desiredOutcome, form.currentConstraint, form.boardInvolvement
  ].filter(f => f && f.toString().trim().length > 0).length;
  
  const totalRequired = 14;
  const progress = Math.round((completedFields / totalRequired) * 100);

  return (
    <div className="space-y-8">
      {/* Progress and live reading header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono uppercase tracking-[0.16em] text-white/40">Assessment progress</span>
          <span className="text-white/60">{completedFields}/{totalRequired} fields</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Live constitutional reading — transparent assessment */}
      {(phase !== "idle" || decision) && hasCoreSubstance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-white/10 bg-black/40 p-5"
        >
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className={cn(
              "h-2 w-2 rounded-full",
              phase === "reading" ? "bg-amber-400 animate-pulse" :
              phase === "parsing" ? "bg-amber-400 animate-pulse" :
              phase === "weighing" ? "bg-amber-400 animate-pulse" :
              phase === "complete" ? "bg-emerald-400" : "bg-white/20"
            )} />
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-white/40">
              {phase === "reading" && "Reading mandate signal..."}
              {phase === "parsing" && "Parsing authority, scale, and consequence..."}
              {phase === "weighing" && "Weighing against constitutional thresholds..."}
              {phase === "complete" && "Constitutional reading complete"}
              {phase === "idle" && "Awaiting mandate..."}
            </span>
          </div>

          {/* Show what the system is detecting */}
          {phase !== "idle" && hasCoreSubstance && (
            <div className="mt-4 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/30">
                Signal profile from your answers
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Gavel className="h-3 w-3 text-amber-400/50" />
                  <span className="text-[10px] text-white/50">Authority:</span>
                  <span className={cn(
                    "text-[10px] font-mono",
                    profile.authorityClarity === "high" ? "text-emerald-400" : 
                    profile.authorityClarity === "moderate" ? "text-amber-400" : "text-white/30"
                  )}>
                    {profile.authorityClarity === "high" ? "Clear" : profile.authorityClarity === "moderate" ? "Shared" : "Unclear"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-amber-400/50" />
                  <span className="text-[10px] text-white/50">Scale:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.revenueWeight}/95</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-amber-400/50" />
                  <span className="text-[10px] text-white/50">Urgency:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.urgencyScore}/95</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-400/50" />
                  <span className="text-[10px] text-white/50">Consequence:</span>
                  <span className="text-[10px] font-mono text-white/60">{profile.consequenceScore}/95</span>
                </div>
              </div>
            </div>
          )}

          {/* The verdict */}
          {phase === "complete" && decision && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 rounded-xl p-4 text-sm",
                isQualified ? "border border-emerald-500/30 bg-emerald-500/10" :
                isDiagnostic ? "border border-amber-500/30 bg-amber-500/10" :
                "border border-white/10 bg-white/5"
              )}
            >
              <div className="flex items-start gap-3">
                {isQualified ? (
                  <Crown className="mt-0.5 h-4 w-4 text-emerald-400" />
                ) : isDiagnostic ? (
                  <Target className="mt-0.5 h-4 w-4 text-amber-400" />
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
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn("h-full rounded-full", isQualified ? "bg-emerald-400" : "bg-amber-400")}
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-white/30">
                      {Math.round(confidence * 100)}% confidence
                    </span>
                  </div>

                  {decision.disqualifiersTriggered && decision.disqualifiersTriggered.length > 0 && !isQualified && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[9px] text-white/30">Disqualifiers:</div>
                      {decision.disqualifiersTriggered.slice(0, 3).map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[9px] text-white/30">
                          <div className="h-1 w-1 rounded-full bg-amber-400/50" />
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

      {/* The Full Form — 14 questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, identity: !prev.identity }))}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Section 1</span>
              <span className="text-sm font-medium text-white">Identity & Contact</span>
            </div>
            <span className="text-white/40">{expandedSections.identity ? "−" : "+"}</span>
          </button>
          
          {expandedSections.identity && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name of principal"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Institutional email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@institution.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Organisation / Institution
                </label>
                <input
                  type="text"
                  name="organisation"
                  value={form.organisation}
                  onChange={handleChange}
                  placeholder="Company, board, fund, ministry, or operating entity"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Institutional Context */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, context: !prev.context }))}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Section 2</span>
              <span className="text-sm font-medium text-white">Institutional Context</span>
            </div>
            <span className="text-white/40">{expandedSections.context ? "−" : "+"}</span>
          </button>
          
          {expandedSections.context && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Sector
                </label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-black">Select sector</option>
                  {SECTORS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Revenue Band
                </label>
                <select
                  name="revenueBand"
                  value={form.revenueBand}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-black">Select revenue band</option>
                  {REVENUE_BANDS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Authority Role
                </label>
                <input
                  type="text"
                  name="authorityRole"
                  value={form.authorityRole}
                  onChange={handleChange}
                  placeholder="Founder, CEO, Board Chair, Chief of Staff, Director..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Authority Scope
                </label>
                <select
                  name="authorityScope"
                  value={form.authorityScope}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-black">Select authority scope</option>
                  {AUTHORITY_SCOPES.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Timing & Pressure */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Section 3</span>
            <span className="text-sm font-medium text-white">Timing & Market Pressure</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                Urgency Window
              </label>
              <select
                name="urgencyWindow"
                value={form.urgencyWindow}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                required
              >
                <option value="" className="bg-black">Select urgency window</option>
                {URGENCY_WINDOWS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                Market Exposure
              </label>
              <select
                name="marketExposure"
                value={form.marketExposure}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                required
              >
                <option value="" className="bg-black">Select exposure level</option>
                {MARKET_EXPOSURE.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: The Mandate */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, mandate: !prev.mandate }))}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Section 4</span>
              <span className="text-sm font-medium text-white">The Mandate</span>
            </div>
            <span className="text-white/40">{expandedSections.mandate ? "−" : "+"}</span>
          </button>
          
          {expandedSections.mandate && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Problem Statement
                </label>
                <textarea
                  name="problemStatement"
                  value={form.problemStatement}
                  onChange={handleChange}
                  rows={4}
                  placeholder="State the actual problem in structural terms, not just symptoms or frustration."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.problemStatement.length}/60 min
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Observed Symptoms
                </label>
                <textarea
                  name="observedSymptoms"
                  value={form.observedSymptoms}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What are you seeing: drift, delays, confusion, politics, trust loss, weak execution, revenue pressure..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.observedSymptoms.length}/40 min
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Desired Outcome
                </label>
                <textarea
                  name="desiredOutcome"
                  value={form.desiredOutcome}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What decision-quality outcome are you trying to reach?"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.desiredOutcome.length}/30 min
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Constraints & Stakeholders */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, constraints: !prev.constraints }))}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Section 5</span>
              <span className="text-sm font-medium text-white">Constraints & Stakeholders</span>
            </div>
            <span className="text-white/40">{expandedSections.constraints ? "−" : "+"}</span>
          </button>
          
          {expandedSections.constraints && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Current Constraint
                </label>
                <textarea
                  name="currentConstraint"
                  value={form.currentConstraint}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What is preventing movement right now: clarity, authority, money, timing, politics, governance, trust..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  required
                />
                <div className="mt-1 text-right text-[10px] text-white/25">
                  {form.currentConstraint.length}/20 min
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Board / Senior Stakeholder Involvement
                </label>
                <select
                  name="boardInvolvement"
                  value={form.boardInvolvement}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
                  required
                >
                  <option value="" className="bg-black">Select involvement level</option>
                  {BOARD_INVOLVEMENT.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
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
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-medium transition",
            isQualified
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "cursor-not-allowed border border-white/10 bg-white/5 text-white/30"
          )}
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

        <p className="text-center text-[9px] font-mono uppercase tracking-[0.16em] text-white/20">
          Submitting does not guarantee admission. It guarantees a serious reading.
        </p>
      </form>

      {/* Diagnostic bridge */}
      {isDiagnostic && phase === "complete" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 text-amber-400/50" />
            <div>
              <p className="text-sm text-white/60">
                Based on your full profile, the system recommends refinement before escalation.
              </p>
              <Link
                href="/diagnostics/executive-reporting"
                className="mt-2 inline-flex items-center gap-1 text-xs text-amber-400/60 hover:text-amber-300"
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