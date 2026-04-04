"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  Crown,
  Eye,
  Gavel,
  Globe2,
  Landmark,
  LineChart,
  Loader2,
  Lock,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Users2,
  XCircle,
  Layers,
  FileText,
  ChevronRight,
} from "lucide-react";

import {
  evaluateConstitutionalRoute,
  type AuthorityType,
  type ConstitutionalDecision,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";

type SubmitState = "idle" | "success" | "error";

type EntityType = "corporation" | "foundation" | "sovereign" | "partnership";
type RevenueBand =
  | "under_1m"
  | "1m_10m"
  | "10m_50m"
  | "50m_plus"
  | "classified";
type GovernanceModel =
  | "direct"
  | "proxy"
  | "collective"
  | "hybrid"
  | "uncertain";
type UrgencyLevel = "low" | "material" | "high" | "critical";
type TimeHorizon = "0_90" | "90_180" | "180_365" | "365_plus";
type ConstraintLevel = "limited" | "moderate" | "severe" | "existential";
type MarketPressure = "low" | "rising" | "active" | "acute";

type FormState = {
  name: string;
  role: string;
  email: string;
  organisation: string;
  website: string;
  entityType: EntityType;
  jurisdiction: string;
  annualRevenue: RevenueBand;
  governanceModel: GovernanceModel;
  teamSize: string;
  strategicIntent: string;
  presentingProblem: string;
  desiredOutcome: string;
  primaryConstraint: string;
  urgencyLevel: UrgencyLevel;
  timeHorizon: TimeHorizon;
  constraintLevel: ConstraintLevel;
  marketPressure: MarketPressure;
};

type ApiSuccess = {
  ok: true;
  message: string;
  referenceId: string;
  priorityStatus?: string | null;
  warning?: string;
  constitutionalDecision?: ConstitutionalDecision;
};

type ApiFailure = {
  ok: false;
  error: string;
  details?: unknown;
  constitutionalDecision?: ConstitutionalDecision;
};

const STORAGE_KEY = "strategy-room-intake-v4";
const AUTO_SAVE_DELAY_MS = 900;

const TRANSITION = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

const DEFAULT_STATE: FormState = {
  name: "",
  role: "",
  email: "",
  organisation: "",
  website: "",
  entityType: "corporation",
  jurisdiction: "",
  annualRevenue: "under_1m",
  governanceModel: "uncertain",
  teamSize: "",
  strategicIntent: "",
  presentingProblem: "",
  desiredOutcome: "",
  primaryConstraint: "",
  urgencyLevel: "material",
  timeHorizon: "90_180",
  constraintLevel: "moderate",
  marketPressure: "rising",
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function hasRecaptchaSiteKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
}

async function getSafeRecaptchaToken(action: string): Promise<string | null> {
  if (!hasRecaptchaSiteKey()) return null;
  try {
    const mod = await import("@/lib/recaptchaClient");
    return typeof mod.getRecaptchaTokenSafe === "function"
      ? await mod.getRecaptchaTokenSafe(action)
      : null;
  } catch {
    return null;
  }
}

function revenueScore(value: RevenueBand): number {
  switch (value) {
    case "50m_plus":
      return 90;
    case "10m_50m":
      return 78;
    case "1m_10m":
      return 64;
    case "classified":
      return 62;
    case "under_1m":
    default:
      return 45;
  }
}

function teamScore(teamSize: string): number {
  const n = Number(teamSize);
  if (!Number.isFinite(n) || n <= 0) return 35;
  if (n >= 500) return 90;
  if (n >= 100) return 78;
  if (n >= 25) return 66;
  if (n >= 10) return 55;
  return 42;
}

function governanceAuthority(model: GovernanceModel): AuthorityType {
  switch (model) {
    case "direct":
      return "DIRECT";
    case "proxy":
    case "hybrid":
      return "PROXY";
    case "collective":
    case "uncertain":
    default:
      return "UNCLEAR";
  }
}

function inferReadinessTier(state: FormState): ReadinessTier {
  const authority = governanceAuthority(state.governanceModel);
  const base =
    state.entityType === "sovereign"
      ? "SOVEREIGN"
      : state.entityType === "corporation"
        ? "EXECUTION_READY"
        : state.entityType === "foundation"
          ? "STABILIZING"
          : "EMERGING";

  if (authority === "UNCLEAR") return "FRAGILE";
  if (state.constraintLevel === "existential") return "FRAGILE";
  if (state.constraintLevel === "severe" && base === "EXECUTION_READY") return "STABILIZING";
  return base;
}

function inferPosture(
  state: FormState,
  clarityScore: number,
  narrativeCoherence: number,
): OrgPosture {
  if (
    state.governanceModel === "uncertain" ||
    state.constraintLevel === "existential" ||
    (clarityScore < 35 && narrativeCoherence < 35)
  ) {
    return "DISORDERED";
  }

  if (
    state.governanceModel === "collective" ||
    state.constraintLevel === "severe" ||
    state.marketPressure === "acute"
  ) {
    return "MISALIGNED";
  }

  if (
    state.entityType === "partnership" ||
    state.marketPressure === "active" ||
    state.urgencyLevel === "high"
  ) {
    return "DRIFTING";
  }

  return "ORDERED";
}

function computeTextSignal(value: string, strongAt: number, maxPoints: number): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return clamp(
    Math.round((trimmed.length / strongAt) * maxPoints),
    Math.ceil(maxPoints * 0.25),
    maxPoints,
  );
}

function validateForm(state: FormState): string | null {
  if (!state.name.trim()) return "Please provide the principal contact name.";
  if (!state.role.trim()) return "Please provide your role or decision-bearing position.";
  if (!state.email.trim()) return "Please provide an institutional email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
    return "Please enter a valid institutional email.";
  }
  if (!state.organisation.trim()) return "Please provide the organisation or entity name.";
  if (!state.jurisdiction.trim()) return "Please specify the operating jurisdiction.";
  if (state.strategicIntent.trim().length < 50) {
    return "Strategic intent is too thin. Give a serious description of the mandate, objective, or strategic move.";
  }
  if (state.presentingProblem.trim().length < 50) {
    return "Presenting problem is too thin. State the structural issue, not a cosmetic symptom.";
  }
  if (state.desiredOutcome.trim().length < 30) {
    return "Please define the desired outcome with more precision.";
  }
  if (state.primaryConstraint.trim().length < 20) {
    return "Please define the primary constraint with more substance.";
  }
  return null;
}

function deriveConstitutionalInput(state: FormState) {
  const authorityType = governanceAuthority(state.governanceModel);

  const identitySignal =
    (state.name.trim() ? 10 : 0) +
    (state.role.trim() ? 12 : 0) +
    (state.organisation.trim() ? 10 : 0) +
    (state.email.trim() ? 8 : 0);

  const contextSignal =
    (state.jurisdiction.trim() ? 10 : 0) +
    (state.entityType ? 8 : 0) +
    (state.annualRevenue ? 7 : 0) +
    (state.teamSize.trim() ? 5 : 0) +
    (state.website.trim() ? 3 : 0);

  const intentSignal =
    computeTextSignal(state.strategicIntent, 240, 18) +
    computeTextSignal(state.presentingProblem, 220, 14) +
    computeTextSignal(state.desiredOutcome, 140, 10) +
    computeTextSignal(state.primaryConstraint, 120, 8);

  const structureSignal =
    (state.timeHorizon ? 4 : 0) +
    (state.urgencyLevel ? 3 : 0) +
    (state.marketPressure ? 3 : 0) +
    (state.constraintLevel ? 2 : 0);

  const clarityScore = clamp(
    identitySignal + contextSignal + intentSignal + structureSignal,
    0,
    100,
  );

  const narrativeCoherence = clamp(
    Math.round(
      computeTextSignal(state.strategicIntent, 260, 35) +
        computeTextSignal(state.presentingProblem, 240, 30) +
        computeTextSignal(state.desiredOutcome, 160, 20) +
        computeTextSignal(state.primaryConstraint, 140, 15),
    ),
    0,
    100,
  );

  const interventionReadiness = clamp(
    Math.round(
      clarityScore * 0.38 +
        revenueScore(state.annualRevenue) * 0.16 +
        teamScore(state.teamSize) * 0.12 +
        (authorityType === "DIRECT" ? 90 : authorityType === "PROXY" ? 62 : 28) * 0.18 +
        (state.constraintLevel === "limited"
          ? 85
          : state.constraintLevel === "moderate"
            ? 65
            : state.constraintLevel === "severe"
              ? 42
              : 20) *
          0.16,
    ),
    0,
    100,
  );

  const readinessTier = inferReadinessTier(state);
  const posture = inferPosture(state, clarityScore, narrativeCoherence);

  let failureModeCount = 0;
  let failureModeSeverity = 0;

  if (authorityType === "UNCLEAR") {
    failureModeCount += 2;
    failureModeSeverity += 3;
  }
  if (state.governanceModel === "collective") {
    failureModeCount += 1;
    failureModeSeverity += 2;
  }
  if (state.constraintLevel === "severe") {
    failureModeCount += 1;
    failureModeSeverity += 2;
  }
  if (state.constraintLevel === "existential") {
    failureModeCount += 2;
    failureModeSeverity += 3;
  }
  if (state.marketPressure === "acute") {
    failureModeCount += 1;
    failureModeSeverity += 2;
  }
  if (state.strategicIntent.trim().length < 90) {
    failureModeCount += 1;
    failureModeSeverity += 1;
  }
  if (state.presentingProblem.trim().length < 90) {
    failureModeCount += 1;
    failureModeSeverity += 1;
  }
  if (!state.jurisdiction.trim()) {
    failureModeCount += 1;
    failureModeSeverity += 1;
  }

  failureModeSeverity = clamp(failureModeSeverity, 0, 10);

  const seriousnessScore = clamp(
    Math.round(
      clarityScore * 0.35 +
        narrativeCoherence * 0.35 +
        (state.role.trim() ? 8 : 0) +
        (state.website.trim() ? 4 : 0) +
        (state.desiredOutcome.trim().length >= 50 ? 10 : 0) +
        (state.primaryConstraint.trim().length >= 35 ? 8 : 0),
    ),
    0,
    100,
  );

  const governanceDiscipline = clamp(
    Math.round(
      (authorityType === "DIRECT" ? 88 : authorityType === "PROXY" ? 62 : 28) * 0.45 +
        (state.governanceModel === "hybrid" ? 55 : 0) * 0.1 +
        clarityScore * 0.2 +
        narrativeCoherence * 0.1 +
        (state.constraintLevel === "limited"
          ? 85
          : state.constraintLevel === "moderate"
            ? 65
            : state.constraintLevel === "severe"
              ? 42
              : 18) *
          0.15,
    ),
    0,
    100,
  );

  const trustCondition = clamp(
    Math.round(
      narrativeCoherence * 0.35 +
        clarityScore * 0.2 +
        (state.marketPressure === "low"
          ? 82
          : state.marketPressure === "rising"
            ? 68
            : state.marketPressure === "active"
              ? 52
              : 35) *
          0.2 +
        (state.constraintLevel === "limited"
          ? 85
          : state.constraintLevel === "moderate"
            ? 64
            : state.constraintLevel === "severe"
              ? 40
              : 18) *
          0.25,
    ),
    0,
    100,
  );

  return {
    clarityScore,
    authorityType,
    readinessTier,
    posture,
    failureModeCount,
    failureModeSeverity,
    narrativeCoherence,
    interventionReadiness,
    seriousnessScore,
    governanceDiscipline,
    trustCondition,
    mandateFit: true,
  };
}

function routeMeta(decision: ConstitutionalDecision | null) {
  if (!decision) {
    return {
      chip: "border-white/10 bg-white/5 text-white/50",
      label: "Evaluating",
      description: "The intake is being assessed against constitutional thresholds.",
      icon: ShieldCheck,
    };
  }

  switch (decision.route) {
    case "STRATEGY":
      return {
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        label: "Strategy path",
        description: "Signal quality is strong enough for premium strategic escalation.",
        icon: CheckCircle2,
      };
    case "DIAGNOSTIC":
      return {
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        label: "Diagnostic path",
        description: "The case is credible, but refinement is required before escalation.",
        icon: Compass,
      };
    case "REJECT":
    default:
      return {
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        label: "Foundational route",
        description: "The case lacks the constitutional conditions for premium escalation.",
        icon: AlertTriangle,
      };
  }
}

function metricTone(value: number): string {
  if (value >= 75) return "bg-emerald-400";
  if (value >= 55) return "bg-amber-300";
  if (value >= 35) return "bg-orange-300";
  return "bg-red-400";
}

function completionCount(state: FormState): number {
  const requiredFields = [
    state.name,
    state.role,
    state.email,
    state.organisation,
    state.jurisdiction,
    state.strategicIntent,
    state.presentingProblem,
    state.desiredOutcome,
    state.primaryConstraint,
  ];

  return requiredFields.filter((value) => value.trim().length > 0).length;
}

function strategyRoomPromise(decision: ConstitutionalDecision | null): string {
  if (!decision) {
    return "The room opens only after the signal is properly interpreted.";
  }

  switch (decision.route) {
    case "STRATEGY":
      return "The present signal suggests that private chamber work may already be justified.";
    case "DIAGNOSTIC":
      return "The matter is serious, but the system is signalling that refinement should happen before premium escalation.";
    case "REJECT":
    default:
      return "The matter has not yet reached mandate quality. The system is protecting the room from soft cases.";
  }
}

export default function StrategyRoomForm() {
  const [formState, setFormState] = React.useState<FormState>(DEFAULT_STATE);
  const [loading, setLoading] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [referenceId, setReferenceId] = React.useState("");
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [constitutionalDecision, setConstitutionalDecision] =
    React.useState<ConstitutionalDecision | null>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setFormState((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed draft
    }
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
        setSavingDraft(true);
        window.setTimeout(() => setSavingDraft(false), 550);
      } catch {
        // silent by design
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [formState]);

  React.useEffect(() => {
    setConstitutionalDecision(
      evaluateConstitutionalRoute(deriveConstitutionalInput(formState)),
    );
  }, [formState]);

  const derived = React.useMemo(() => deriveConstitutionalInput(formState), [formState]);
  const route = routeMeta(constitutionalDecision);
  const RouteIcon = route.icon;

  const completion = React.useMemo(() => {
    const count = completionCount(formState);
    return Math.round((count / 9) * 100);
  }, [formState]);

  const handleChange = React.useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      if (submitState !== "idle") {
        setSubmitState("idle");
        setErrorMessage("");
        setSuccessMessage("");
        setReferenceId("");
      }
    },
    [submitState],
  );

  const clearDraft = React.useCallback(() => {
    if (!window.confirm("Clear the intake and remove the saved local draft?")) return;
    setFormState(DEFAULT_STATE);
    setSubmitState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setReferenceId("");
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setSubmitState("idle");
      setErrorMessage("");
      setSuccessMessage("");
      setReferenceId("");

      const validationError = validateForm(formState);
      if (validationError) {
        setSubmitState("error");
        setErrorMessage(validationError);
        return;
      }

      setLoading(true);

      try {
        const token = await getSafeRecaptchaToken("strategy_room_intake");
        const liveDecision = evaluateConstitutionalRoute(deriveConstitutionalInput(formState));

        const payload = {
          ...formState,
          name: formState.name.trim(),
          role: formState.role.trim(),
          email: formState.email.trim(),
          organisation: formState.organisation.trim(),
          website: formState.website.trim() || undefined,
          jurisdiction: formState.jurisdiction.trim(),
          strategicIntent: formState.strategicIntent.trim(),
          presentingProblem: formState.presentingProblem.trim(),
          desiredOutcome: formState.desiredOutcome.trim(),
          primaryConstraint: formState.primaryConstraint.trim(),
          source: "strategy_room_form_v4",
          token,
          constitutionalDecision: liveDecision,
          constitutionalInput: deriveConstitutionalInput(formState),
          metadata: {
            surface: "strategy_room_form",
            entityType: formState.entityType,
            annualRevenue: formState.annualRevenue,
            governanceModel: formState.governanceModel,
            urgencyLevel: formState.urgencyLevel,
            timeHorizon: formState.timeHorizon,
            constraintLevel: formState.constraintLevel,
            marketPressure: formState.marketPressure,
            teamSize: formState.teamSize || undefined,
          },
        };

        const res = await fetch("/api/strategy-room/enrol", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = (await res.json()) as ApiSuccess | ApiFailure;

        if (!res.ok || !json.ok) {
          setSubmitState("error");
          setErrorMessage(json.error || "Submission failed. Please try again.");
          if (json.constitutionalDecision) setConstitutionalDecision(json.constitutionalDecision);
          return;
        }

        setSubmitState("success");
        setSuccessMessage(
          json.message ||
            "Your inquiry has been received and is now under constitutional review.",
        );
        setReferenceId(json.referenceId || "");
        window.localStorage.removeItem(STORAGE_KEY);
        setFormState(DEFAULT_STATE);
      } catch (err: any) {
        setSubmitState("error");
        setErrorMessage(err?.message || "Submission failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [formState],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
          className="space-y-8"
        >
          {/* HERO */}
          <section className="relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />
            <div className="relative z-10 px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
              <div className="flex flex-wrap items-center gap-3">
                <Pill className="border-[#C9A96A]/20 bg-[#C9A96A]/10 text-[#E6C27A]">
                  Strategy Room
                </Pill>
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Constitutional gate
                </Pill>
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Autosave enabled
                </Pill>
              </div>

              <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.3em] text-[#C9A96A]">
                Private chamber intake
              </div>

              <h2 className="mt-5 max-w-4xl font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
                Not a booking form.
                <span className="mt-2 block text-white/58">
                  A mandate qualification gate.
                </span>
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-7 text-white/65 sm:text-lg">
                This surface is designed to filter signal, not flatter curiosity.
                It tests mandate seriousness, authority posture, institutional
                condition, readiness, and intervention fit before private advisory
                time is ever opened.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <MetricCard
                  icon={LineChart}
                  label="Completion"
                  value={completion}
                  description="Required signal coverage"
                />
                <MetricCard
                  icon={Crown}
                  label="Clarity"
                  value={derived.clarityScore}
                  description="Decision-grade articulation"
                />
                <MetricCard
                  icon={ShieldCheck}
                  label="Readiness"
                  value={derived.interventionReadiness}
                  description="Mandate fitness"
                />
              </div>

              <div className="mt-8 rounded-3xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <Layers className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-amber-300/78">
                      Proper close of the loop
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      The diagnostics should create appetite for this room. This room should feel like the earned destination of the whole system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection
              eyebrow="Operator and institutional identity"
              title="Establish authority, identity, and operating context"
              description="Weak identity signal produces weak routing. Be precise."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  icon={Shield}
                  label="Principal / Contact Name"
                  name="name"
                  value={formState.name}
                  placeholder="Full name"
                  onChange={handleChange}
                />
                <FormField
                  icon={Crown}
                  label="Role / Decision Bearing Position"
                  name="role"
                  value={formState.role}
                  placeholder="Founder, CEO, Director, Principal..."
                  onChange={handleChange}
                />
                <FormField
                  icon={Mail}
                  label="Institutional Email"
                  name="email"
                  type="email"
                  value={formState.email}
                  placeholder="you@organisation.com"
                  onChange={handleChange}
                />
                <FormField
                  icon={Building2}
                  label="Organisation / Entity"
                  name="organisation"
                  value={formState.organisation}
                  placeholder="Entity name"
                  onChange={handleChange}
                />
                <FormField
                  icon={Globe2}
                  label="Website"
                  name="website"
                  required={false}
                  value={formState.website}
                  placeholder="https://..."
                  onChange={handleChange}
                />
                <FormField
                  icon={Landmark}
                  label="Primary Jurisdiction"
                  name="jurisdiction"
                  value={formState.jurisdiction}
                  placeholder="United Kingdom, Nigeria, UAE..."
                  onChange={handleChange}
                />
              </div>
            </FormSection>

            <FormSection
              eyebrow="Institutional structure"
              title="Define the operating shape of the entity"
              description="This helps the system estimate governance posture, scale, and escalation risk."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <SelectField
                  icon={Briefcase}
                  label="Entity Type"
                  name="entityType"
                  value={formState.entityType}
                  onChange={handleChange}
                  options={[
                    { value: "corporation", label: "Corporation" },
                    { value: "foundation", label: "Foundation / Trust" },
                    { value: "sovereign", label: "Sovereign Entity" },
                    { value: "partnership", label: "Partnership" },
                  ]}
                />
                <SelectField
                  icon={Scale}
                  label="Annual Revenue Band"
                  name="annualRevenue"
                  value={formState.annualRevenue}
                  onChange={handleChange}
                  options={[
                    { value: "under_1m", label: "Under £1M" },
                    { value: "1m_10m", label: "£1M – £10M" },
                    { value: "10m_50m", label: "£10M – £50M" },
                    { value: "50m_plus", label: "£50M+" },
                    { value: "classified", label: "Classified" },
                  ]}
                />
                <SelectField
                  icon={Gavel}
                  label="Governance Model"
                  name="governanceModel"
                  value={formState.governanceModel}
                  onChange={handleChange}
                  options={[
                    { value: "direct", label: "Direct Authority" },
                    { value: "proxy", label: "Proxy / Delegated" },
                    { value: "collective", label: "Collective / Council" },
                    { value: "hybrid", label: "Hybrid Structure" },
                    { value: "uncertain", label: "Uncertain / Transitional" },
                  ]}
                />
                <FormField
                  icon={Users2}
                  label="Approximate Team Size"
                  name="teamSize"
                  type="number"
                  required={false}
                  value={formState.teamSize}
                  placeholder="25"
                  onChange={handleChange}
                />
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  icon={Target}
                  label="Urgency"
                  name="urgencyLevel"
                  value={formState.urgencyLevel}
                  onChange={handleChange}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "material", label: "Material" },
                    { value: "high", label: "High" },
                    { value: "critical", label: "Critical" },
                  ]}
                />
                <SelectField
                  icon={Compass}
                  label="Time Horizon"
                  name="timeHorizon"
                  value={formState.timeHorizon}
                  onChange={handleChange}
                  options={[
                    { value: "0_90", label: "0–90 days" },
                    { value: "90_180", label: "90–180 days" },
                    { value: "180_365", label: "180–365 days" },
                    { value: "365_plus", label: "365+ days" },
                  ]}
                />
                <SelectField
                  icon={AlertTriangle}
                  label="Constraint Severity"
                  name="constraintLevel"
                  value={formState.constraintLevel}
                  onChange={handleChange}
                  options={[
                    { value: "limited", label: "Limited" },
                    { value: "moderate", label: "Moderate" },
                    { value: "severe", label: "Severe" },
                    { value: "existential", label: "Existential" },
                  ]}
                />
                <SelectField
                  icon={Eye}
                  label="Market Pressure"
                  name="marketPressure"
                  value={formState.marketPressure}
                  onChange={handleChange}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "rising", label: "Rising" },
                    { value: "active", label: "Active" },
                    { value: "acute", label: "Acute" },
                  ]}
                />
              </div>
            </FormSection>

            <FormSection
              eyebrow="Mandate articulation"
              title="Describe the strategic case clearly"
              description="This is where weak forms collapse. State architecture, not buzzwords."
            >
              <div className="space-y-6">
                <FormField
                  icon={Target}
                  label="Strategic Intent"
                  name="strategicIntent"
                  isTextarea
                  rows={5}
                  value={formState.strategicIntent}
                  placeholder="What strategic move, mandate, shift, or objective is under consideration?"
                  onChange={handleChange}
                />

                <FormField
                  icon={AlertTriangle}
                  label="Presenting Problem"
                  name="presentingProblem"
                  isTextarea
                  rows={5}
                  value={formState.presentingProblem}
                  placeholder="What structural problem, friction, or disorder is forcing attention now?"
                  onChange={handleChange}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    icon={BadgeCheck}
                    label="Desired Outcome"
                    name="desiredOutcome"
                    isTextarea
                    rows={4}
                    value={formState.desiredOutcome}
                    placeholder="What outcome must be secured if this engagement succeeds?"
                    onChange={handleChange}
                  />
                  <FormField
                    icon={Lock}
                    label="Primary Constraint"
                    name="primaryConstraint"
                    isTextarea
                    rows={4}
                    value={formState.primaryConstraint}
                    placeholder="What currently blocks movement: authority, capital, time, capability, politics, trust, or something else?"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </FormSection>

            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    Submit to constitutional review
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    The intake will be scored for route fitness, structural clarity, and escalation discipline.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <XCircle className="h-4 w-4" />
                    Clear
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C9A96A] px-6 py-3.5 text-sm font-medium text-black transition hover:bg-[#E6C27A] disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit for constitutional assessment
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {submitState === "error" && errorMessage ? (
                <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              {submitState === "success" && successMessage ? (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <div>{successMessage}</div>
                      {referenceId ? (
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                          Reference: {referenceId}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        </motion.div>

        {/* ASIDE */}
        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION, delay: 0.05 }}
          className="space-y-8 xl:sticky xl:top-6 xl:self-start"
        >
          <SidePanel
            eyebrow="Live constitutional read"
            title="Route preview"
            description="This preview uses the same constitutional engine that protects the room from weak cases."
          >
            <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className={route.chip}>
                  <RouteIcon className="mr-1 inline h-3.5 w-3.5" />
                  {route.label}
                </Pill>
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Confidence {constitutionalDecision ? Math.round(constitutionalDecision.confidence * 100) : 0}%
                </Pill>
              </div>

              <p className="mt-4 text-sm leading-6 text-white/65">{route.description}</p>

              <div className="mt-5 grid gap-4">
                <MetricBar label="Clarity" value={derived.clarityScore} />
                <MetricBar label="Narrative Coherence" value={derived.narrativeCoherence} />
                <MetricBar label="Intervention Readiness" value={derived.interventionReadiness} />
                <MetricBar label="Governance Discipline" value={derived.governanceDiscipline} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                Constitutional state
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Authority: {derived.authorityType}
                </Pill>
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Readiness: {derived.readinessTier.replaceAll("_", " ")}
                </Pill>
                <Pill className="border-white/10 bg-white/5 text-white/60">
                  Posture: {derived.posture}
                </Pill>
              </div>
            </div>

            {constitutionalDecision?.disqualifiersTriggered?.length ? (
              <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Disqualifiers triggered
                </div>
                <div className="mt-3 space-y-2">
                  {constitutionalDecision.disqualifiersTriggered.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {constitutionalDecision?.recommendedInterventions?.length ? (
              <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Required interventions
                </div>
                <div className="mt-3 space-y-2">
                  {constitutionalDecision.recommendedInterventions.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                      <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C9A96A]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </SidePanel>

          <SidePanel
            eyebrow="What this room does"
            title="System role"
            description="This is not merely lead capture. It is a constitutional gate."
          >
            <InfoCard
              icon={ShieldCheck}
              title="Signal discipline"
              text="It captures enough context to separate decision-grade mandate from shallow curiosity."
            />
            <InfoCard
              icon={Compass}
              title="Route governance"
              text="The route is shaped by authority, readiness, coherence, and failure pressure rather than mere completion."
            />
            <InfoCard
              icon={Crown}
              title="Premium posture"
              text="The buyer should feel the seriousness of the room before anyone on your side has to intervene."
            />
          </SidePanel>

          <SidePanel
            eyebrow="Why this closes the system"
            title="Inevitable destination"
            description="The room should feel like the rightful destination of the whole experience."
          >
            <div className="rounded-3xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-amber-300/78">
                    Promise of the room
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    {strategyRoomPromise(constitutionalDecision)}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/diagnostics/executive-reporting"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/72 transition-colors hover:text-amber-300"
            >
              <span>Review Executive Reporting</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </SidePanel>

          <SidePanel
            eyebrow="Draft status"
            title="Continuity"
            description="The intake is automatically preserved on this device while being completed."
          >
            <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5 text-sm text-white/65">
              {savingDraft ? "Saving local draft..." : "Local draft active."}
            </div>
          </SidePanel>
        </motion.aside>
      </div>
    </div>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5 sm:px-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#C9A96A]">
          {eyebrow}
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{description}</p>
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
    </section>
  );
}

function SidePanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="border-b border-white/[0.07] px-6 py-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#C9A96A]">
          {eyebrow}
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
      </div>
      <div className="space-y-4 px-6 py-6">{children}</div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <Icon className="h-4 w-4 text-white/80" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</div>
            <div className="mt-1 text-xs text-white/50">{description}</div>
          </div>
        </div>
        <div className="text-2xl font-light text-white">{value}%</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", metricTone(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="uppercase tracking-[0.16em] text-white/45">{label}</span>
        <span className="font-medium text-white/70">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", metricTone(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/30 p-5">
      <Icon className="h-5 w-5 text-[#C9A96A]" />
      <div className="mt-3 text-sm font-medium text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}

function FormField({
  icon: Icon,
  label,
  name,
  type = "text",
  required = true,
  placeholder,
  isTextarea = false,
  rows = 4,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder: string;
  isTextarea?: boolean;
  rows?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      <div className={cn("absolute inset-0 rounded-2xl transition-all", focused && "bg-[#C9A96A]/8")} />
      <div
        className={cn(
          "relative flex gap-4 rounded-2xl border p-5 transition-all",
          focused
            ? "border-[#C9A96A]/35 bg-black/80"
            : "border-white/10 bg-black/50 hover:border-white/20",
        )}
      >
        <div className={cn("rounded-xl p-3 transition-colors", focused ? "text-[#C9A96A]" : "text-zinc-500")}>
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-zinc-500">
            {label}
            {!required ? <span className="ml-2 normal-case tracking-normal text-zinc-600">optional</span> : null}
          </label>

          {isTextarea ? (
            <textarea
              name={name}
              required={required}
              rows={rows}
              value={value}
              placeholder={placeholder}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="min-h-[120px] w-full resize-y bg-transparent text-sm leading-7 text-white placeholder:text-zinc-600 focus:outline-none"
            />
          ) : (
            <input
              type={type}
              name={name}
              required={required}
              value={value}
              placeholder={placeholder}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SelectField({
  icon: Icon,
  label,
  name,
  options,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      <div className={cn("absolute inset-0 rounded-2xl transition-all", focused && "bg-[#C9A96A]/8")} />
      <div
        className={cn(
          "relative flex gap-4 rounded-2xl border p-5 transition-all",
          focused
            ? "border-[#C9A96A]/35 bg-black/80"
            : "border-white/10 bg-black/50 hover:border-white/20",
        )}
      >
        <div className={cn("rounded-xl p-3 transition-colors", focused ? "text-[#C9A96A]" : "text-zinc-500")}>
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-zinc-500">
            {label}
          </label>
          <select
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full cursor-pointer bg-transparent text-sm text-white focus:outline-none"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-black text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}