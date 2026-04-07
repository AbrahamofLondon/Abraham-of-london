"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Loader2,
  Shield,
  XCircle,
  ChevronRight,
  FileText,
  Scale,
  AlertTriangle,
  Compass,
  Gavel,
  Zap,
  Lock,
} from "lucide-react";
import Link from "next/link";

import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

type FormState = {
  name: string;
  role: string;
  email: string;
  organisation: string;
  jurisdiction: string;
  mandateDescription: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";
type EvaluationPhase = "idle" | "reading" | "parsing" | "weighing" | "complete";

const DEFAULT_STATE: FormState = {
  name: "",
  role: "",
  email: "",
  organisation: "",
  jurisdiction: "",
  mandateDescription: "",
};

const STORAGE_KEY = "strategy-room-draft";
const MIN_MANDATE_LENGTH = 100;

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return null;

  try {
    const mod = await import("@/lib/recaptchaClient");
    return typeof mod.getRecaptchaTokenSafe === "function"
      ? await mod.getRecaptchaTokenSafe(action)
      : null;
  } catch {
    return null;
  }
}

function validateForm(state: FormState): string | null {
  if (!state.name.trim()) return "Please provide your name.";
  if (!state.role.trim()) return "Please provide your role or position.";
  if (!state.email.trim()) return "Please provide an institutional email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (!state.organisation.trim()) return "Please provide the organisation name.";
  if (!state.jurisdiction.trim()) return "Please specify your primary jurisdiction.";
  if (state.mandateDescription.trim().length < MIN_MANDATE_LENGTH) {
    return `Please provide more detail about the mandate, problem, or strategic move (minimum ${MIN_MANDATE_LENGTH} characters).`;
  }
  return null;
}

function getDecisionSignals(
  decision: ConstitutionalDecision | null,
): Record<string, unknown> {
  return asRecord(asRecord(decision).signals);
}

function getDecisionConfidence(decision: ConstitutionalDecision | null): number {
  const raw = asNumber(asRecord(decision).confidence, 0);
  return Math.max(0, Math.min(1, raw));
}

function useRitualEvaluation(
  mandateText: string,
  role: string,
  jurisdiction: string,
) {
  const [phase, setPhase] = React.useState<EvaluationPhase>("idle");
  const [decision, setDecision] = React.useState<ConstitutionalDecision | null>(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const hasSubstance = mandateText.trim().length > 50;

    if (!hasSubstance) {
      setPhase("idle");
      setDecision(null);
      setProgress(0);
      return;
    }

    setPhase("reading");
    setProgress(15);

    const timer1 = window.setTimeout(() => {
      setPhase("parsing");
      setProgress(40);
    }, 600);

    const timer2 = window.setTimeout(() => {
      setPhase("weighing");
      setProgress(70);
    }, 1400);

    const timer3 = window.setTimeout(() => {
      const input = {
        mandateText,
        role,
        jurisdiction,
        organisationType: "corporation",
        annualRevenueBand: "confidential",
      };

      const result = evaluateConstitutionalRoute(input);
      setDecision(result);
      setPhase("complete");
      setProgress(100);
    }, 2200);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [mandateText, role, jurisdiction]);

  return { phase, decision, progress };
}

export default function StrategyRoomForm() {
  const [formState, setFormState] = React.useState<FormState>(DEFAULT_STATE);
  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [referenceId, setReferenceId] = React.useState("");
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  const { phase, decision, progress } = useRitualEvaluation(
    formState.mandateDescription,
    formState.role,
    formState.jurisdiction,
  );

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<FormState>;
      setFormState((prev) => ({
        ...prev,
        name: asString(parsed.name) || prev.name,
        role: asString(parsed.role) || prev.role,
        email: asString(parsed.email) || prev.email,
        organisation: asString(parsed.organisation) || prev.organisation,
        jurisdiction: asString(parsed.jurisdiction) || prev.jurisdiction,
        mandateDescription:
          asString(parsed.mandateDescription) || prev.mandateDescription,
      }));
    } catch {
      // ignore bad draft
    }
  }, []);

  React.useEffect(() => {
    if (hasSubmitted) return;

    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
      } catch {
        // ignore storage failures
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [formState, hasSubmitted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitState !== "idle") {
      setSubmitState("idle");
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  const clearDraft = () => {
    if (!window.confirm("Clear this draft? It cannot be undone.")) return;

    setFormState(DEFAULT_STATE);
    setSubmitState("idle");
    setErrorMessage("");
    setSuccessMessage("");
    setReferenceId("");
    setHasSubmitted(false);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm(formState);
    if (validationError) {
      setSubmitState("error");
      setErrorMessage(validationError);
      return;
    }

    if (decision?.route !== "STRATEGY") {
      setSubmitState("error");
      setErrorMessage(
        "This mandate has not yet met Strategy Room thresholds. Refine the mandate or review the recommended route first.",
      );
      return;
    }

    setSubmitState("submitting");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = await getRecaptchaToken("strategy_room_intake");

      const payload = {
        ...formState,
        source: "strategy_room_form",
        token,
        constitutionalDecision: decision,
      };

      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          asString(asRecord(json).error) ||
            asString(asRecord(json).message) ||
            "Submission failed.",
        );
      }

      setSubmitState("success");
      setSuccessMessage(
        asString(asRecord(json).message) ||
          "Your mandate has been received. The room will respond within the stated review window.",
      );
      setReferenceId(asString(asRecord(json).referenceId));
      setHasSubmitted(true);

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    }
  };

  const route = asString(asRecord(decision).route);
  const confidence = getDecisionConfidence(decision);
  const signals = getDecisionSignals(decision);

  const isEligible = route === "STRATEGY";
  const isDiagnostic = route === "DIAGNOSTIC";
  const isRejected = route === "REJECT";

  const authoritySignal = asString(signals.authority);
  const coherenceSignal = asString(signals.coherence);
  const urgencySignal = asString(signals.urgency);
  const constraintSignal = asString(signals.constraint);
  const readinessSignal = asString(signals.readiness);

  const disqualifiers = Array.isArray(asRecord(decision).disqualifiersTriggered)
    ? (asRecord(decision).disqualifiersTriggered as unknown[])
        .map((item) => asString(item))
        .filter(Boolean)
    : [];

  const phaseText: Record<EvaluationPhase, string> = {
    idle: "Awaiting mandate...",
    reading: "Reading signal...",
    parsing: "Parsing structural logic...",
    weighing: "Weighing against constitutional thresholds...",
    complete: "Assessment complete",
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
              Strategy Room — Constitutional Gate
            </span>
          </div>

          <h1 className="mt-6 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
            Present your mandate
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/50">
            This is not a contact form. It is a qualification gate. The system
            evaluates in real time.
          </p>
        </div>

        {formState.mandateDescription.trim().length > 30 && phase !== "idle" ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    phase === "reading" && "bg-amber-400 animate-pulse",
                    phase === "parsing" && "bg-amber-400",
                    phase === "weighing" && "bg-amber-400",
                    phase === "complete" && "bg-emerald-400",
                    phase === "idle" && "bg-white/20",
                  )}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                  {phaseText[phase]}
                </span>
              </div>

              <span className="font-mono text-[10px] text-white/30">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {phase === "complete" && decision ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-5 rounded-xl border p-4",
                    isEligible && "border-emerald-500/30 bg-emerald-500/10",
                    isDiagnostic && "border-amber-500/30 bg-amber-500/10",
                    isRejected && "border-white/10 bg-white/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isEligible ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                    ) : isDiagnostic ? (
                      <Compass className="mt-0.5 h-5 w-5 text-amber-400" />
                    ) : (
                      <Shield className="mt-0.5 h-5 w-5 text-white/40" />
                    )}

                    <div className="flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Constitutional verdict
                      </div>

                      <p className="mt-1 text-sm text-white/80">
                        {isEligible
                          ? "The mandate meets Strategy Room thresholds. The signal is decision-grade. Completion will open the private channel."
                          : isDiagnostic
                            ? "The signal is credible but requires refinement before escalation. The system recommends diagnostic routing first."
                            : "The mandate signal is currently below threshold. The room is protected from weak cases. Provide more strategic substance to qualify."}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              isEligible && "bg-emerald-400",
                              isDiagnostic && "bg-amber-400",
                              isRejected && "bg-white/20",
                            )}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-white/30">
                          {Math.round(confidence * 100)}% confidence
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {authoritySignal === "STRONG" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                            <Gavel className="h-2.5 w-2.5" />
                            Authority clear
                          </span>
                        ) : null}

                        {coherenceSignal === "STRONG" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                            <Scale className="h-2.5 w-2.5" />
                            Coherent narrative
                          </span>
                        ) : null}

                        {urgencySignal === "HIGH" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono text-amber-300">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Material urgency
                          </span>
                        ) : null}

                        {constraintSignal === "SEVERE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-mono text-orange-300">
                            <Lock className="h-2.5 w-2.5" />
                            Binding constraint
                          </span>
                        ) : null}

                        {readinessSignal === "HIGH" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                            <Zap className="h-2.5 w-2.5" />
                            Intervention ready
                          </span>
                        ) : null}
                      </div>

                      {disqualifiers.length > 0 && !isEligible ? (
                        <div className="mt-3 space-y-1">
                          {disqualifiers.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2 text-[10px] text-white/40"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : null}
          </motion.div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Name of principal"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Role / Position
                </label>
                <input
                  type="text"
                  name="role"
                  value={formState.role}
                  onChange={handleChange}
                  placeholder="Founder, CEO, Director..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Institutional email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="you@organisation.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Organisation
                </label>
                <input
                  type="text"
                  name="organisation"
                  value={formState.organisation}
                  onChange={handleChange}
                  placeholder="Entity name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
                  Primary jurisdiction
                </label>
                <input
                  type="text"
                  name="jurisdiction"
                  value={formState.jurisdiction}
                  onChange={handleChange}
                  placeholder="United Kingdom, Singapore, UAE..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-[0.16em] text-white/40">
              Mandate description
              <span className="ml-2 normal-case text-white/30">
                (minimum {MIN_MANDATE_LENGTH} characters)
              </span>
            </label>

            <textarea
              name="mandateDescription"
              value={formState.mandateDescription}
              onChange={handleChange}
              rows={8}
              placeholder="Describe the strategic move, structural problem, or mandate under consideration. What is the friction? What is at stake? What outcome must be secured?"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              required
            />

            <div className="mt-2 flex justify-between text-xs text-white/30">
              <span>{formState.mandateDescription.trim().length} characters</span>
              {formState.mandateDescription.trim().length < MIN_MANDATE_LENGTH ? (
                <span>
                  {MIN_MANDATE_LENGTH - formState.mandateDescription.trim().length} more needed
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={clearDraft}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <XCircle className="h-4 w-4" />
              Clear draft
            </button>

            <button
              type="submit"
              disabled={submitState === "submitting" || !isEligible}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition",
                isEligible
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "cursor-not-allowed border border-white/10 bg-white/5 text-white/30",
              )}
            >
              {submitState === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {isEligible ? "Submit to Strategy Room" : "Not yet qualified"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {submitState === "error" && errorMessage ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {submitState === "success" && successMessage ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <div>
                  <div>{successMessage}</div>
                  {referenceId ? (
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-200/70">
                      Reference: {referenceId}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </form>

        <div className="border-t border-white/10 pt-8 text-center">
          <Link
            href="/diagnostics/executive-reporting"
            className="inline-flex items-center gap-2 text-sm text-amber-400/70 transition hover:text-amber-300"
          >
            <FileText className="h-4 w-4" />
            <span>Review Executive Reporting</span>
            <ChevronRight className="h-4 w-4" />
          </Link>

          <p className="mt-3 text-xs text-white/30">
            Not ready for Strategy Room? Begin with diagnostics to surface the
            signal first.
          </p>
        </div>
      </motion.div>
    </div>
  );
}