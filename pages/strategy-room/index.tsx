"use client";

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
  Landmark,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";

import {
  STRATEGY_ROOM_FORM_SPEC,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";
import {
  trackConversion,
  trackFollowup,
} from "@/lib/strategy-room/client-trackers";
import type { CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";
import { hasCanonicalSections } from "@/lib/decision/canonical-sections";

type SessionInitResponse = {
  success: boolean;
  sessionKey?: string;
  constitution?: {
    route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
    priority: string;
    temperature: string;
    orgState: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
  };
  error?: string;
};

type RecommendationItem = {
  id?: string;
  title?: string;
  href?: string | null;
  kind?: string;
  score?: number;
  reasons?: string[];
};

const INITIAL_FORM: ConstitutionalIntake = {
  fullName: "",
  email: "",
  organisation: "",
  sector: "",
  revenueBand: "",
  authorityRole: "",
  authorityScope: "",
  urgencyWindow: "",
  problemStatement: "",
  symptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  marketExposure: "",
  boardInvolved: "",
};

const STORAGE_KEY = "aol_strategy_room_intake_v1";
const AUTOSAVE_MS = 700;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function MonoEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "font-mono text-[10px] uppercase tracking-[0.32em] text-[#C9A96A]/88",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionCard({
  children,
  className,
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-[30px] border border-white/[0.09]",
        "bg-[linear-gradient(180deg,rgba(14,14,15,0.96)_0%,rgba(7,7,8,0.98)_100%)]",
        "shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl",
        elevated && "border-[#C9A96A]/15 shadow-[0_32px_80px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.07),transparent_52%)]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function InsightPill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] text-white/55 transition-all duration-200 hover:border-[#C9A96A]/22 hover:bg-[#C9A96A]/5 hover:text-white/80">
      {icon}
      {children}
    </span>
  );
}

function StatusBadge({
  children,
  variant = "gold",
}: {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red";
}) {
  return (
    <div
      className={cx(
        "rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]",
        variant === "gold" &&
          "border-[#C9A96A]/22 bg-[#C9A96A]/8 text-[#E6D1A1]",
        variant === "green" &&
          "border-emerald-400/28 bg-emerald-500/10 text-emerald-300",
        variant === "red" && "border-red-400/28 bg-red-500/10 text-red-300",
      )}
    >
      {children}
    </div>
  );
}

function validateForm(form: ConstitutionalIntake): string | null {
  for (const field of STRATEGY_ROOM_FORM_SPEC) {
    const value = form[field.name];
    if (field.required && !String(value || "").trim()) {
      return `${field.label} is required.`;
    }
  }

  if (form.problemStatement.trim().length < 100) {
    return "Problem Statement is too thin. State the structural problem with more seriousness.";
  }
  if (form.symptoms.trim().length < 80) {
    return "Observed Symptoms is too thin. Describe the operating reality in fuller detail.";
  }
  if (form.desiredOutcome.trim().length < 50) {
    return "Desired Outcome is too vague. Name the decision-grade outcome you want.";
  }
  if (form.currentConstraint.trim().length < 30) {
    return "Current Constraint is too thin. Name the pressure that is materially obstructing movement.";
  }

  return null;
}

function routeMeta(route?: string | null) {
  switch (route) {
    case "STRATEGY":
      return {
        chip: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        label: "Strategy route",
        description:
          "The signal is strong enough for private strategic escalation.",
        ctaHref: "/contact?intent=strategy-room-mandate",
        ctaLabel: "Request private mandate review",
      };
    case "REJECT":
      return {
        chip: "border-red-400/25 bg-red-500/10 text-red-300",
        label: "Foundational route",
        description:
          "The matter is not yet ready for premium escalation. Foundational work should come first.",
        ctaHref:
          "/diagnostics/directional-integrity?source=strategy-room&entry=redirect&intent=foundational-correction",
        ctaLabel: "Start foundational diagnostic",
      };
    case "DIAGNOSTIC":
    default:
      return {
        chip: "border-amber-400/25 bg-amber-500/10 text-amber-300",
        label: "Diagnostic route",
        description:
          "The matter is serious, but a sharper reading is required before private chamber escalation.",
        ctaHref:
          "/diagnostics?source=strategy-room&entry=redirect&intent=diagnostic-escalation",
        ctaLabel: "Continue into diagnostics",
      };
  }
}

function recommendationList(
  canonical: CanonicalSectionsEnvelope | null,
): RecommendationItem[] {
  if (!canonical) return [];
  const raw =
    canonical.sections?.governedRecommendations?.recommendations ?? [];
  return Array.isArray(raw) ? (raw as RecommendationItem[]) : [];
}

function constitutionalPosture(canonical: CanonicalSectionsEnvelope | null) {
  return canonical?.sections?.constitutionalPosture ?? null;
}

function localSummary(canonical: CanonicalSectionsEnvelope | null) {
  const posture = constitutionalPosture(canonical);
  const route = safeText(posture?.route, "DIAGNOSTIC");
  const confidence = Number(posture?.routeConfidence ?? posture?.confidence ?? 0);
  const priority = safeText(posture?.priority, "QUALIFIED");
  const readinessTier = safeText(posture?.readinessTier, "EMERGING");
  const authorityType = safeText(posture?.authorityType, "UNCLEAR");
  const temperature = safeText(posture?.temperature, "WARM");
  return {
    route,
    confidence: Number.isFinite(confidence) ? Math.round(confidence * 100 || confidence) : 0,
    priority,
    readinessTier,
    authorityType,
    temperature,
  };
}

function guidanceNarrative(canonical: CanonicalSectionsEnvelope | null): string[] {
  const raw =
    canonical?.sections?.narrative?.bullets ??
    canonical?.sections?.narrative?.keyPoints ??
    canonical?.sections?.executiveSummary?.bullets ??
    [];
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

function principalRisks(canonical: CanonicalSectionsEnvelope | null): string[] {
  const raw =
    canonical?.sections?.riskRegister?.items ??
    canonical?.sections?.riskSignals?.items ??
    canonical?.sections?.principalRisks?.items ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return safeText((item as { title?: string }).title) || safeText((item as { label?: string }).label);
      }
      return "";
    })
    .filter(Boolean);
}

export default function StrategyRoomIndexPage() {
  const [form, setForm] = React.useState<ConstitutionalIntake>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [canonical, setCanonical] = React.useState<CanonicalSectionsEnvelope | null>(null);
  const [sessionKey, setSessionKey] = React.useState<string | null>(null);
  const [organisationId, setOrganisationId] = React.useState<string | undefined>(undefined);
  const [draftSaved, setDraftSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConstitutionalIntake;
      setForm({ ...INITIAL_FORM, ...parsed });
    } catch {
      // ignore malformed local draft
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setDraftSaved(true);
        window.setTimeout(() => setDraftSaved(false), 900);
      } catch {
        // ignore storage errors
      }
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [form]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function clearDraft() {
    setForm(INITIAL_FORM);
    setCanonical(null);
    setSessionKey(null);
    setError("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  async function initDecisionSession(intake: ConstitutionalIntake) {
    const response = await fetch("/api/strategy-room/session/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake }),
    });

    const data: SessionInitResponse = await response.json();

    if (!response.ok || !data.success || !data.sessionKey) {
      throw new Error(data.error || "Failed to initialize decision session.");
    }

    if (data.constitution?.orgState) {
      setOrganisationId(undefined);
    }

    return data.sessionKey;
  }

  async function logRecommendationImpressions(
    nextSessionKey: string,
    envelope: CanonicalSectionsEnvelope,
  ) {
    const recommendations =
      envelope.sections?.governedRecommendations?.recommendations || [];

    if (!Array.isArray(recommendations) || !recommendations.length) return;

    await fetch("/api/strategy-room/session/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionKey: nextSessionKey,
        recommendations: recommendations.map((item: any, idx: number) => ({
          assetId: item?.id,
          assetTitle: item?.title,
          assetHref: item?.href ?? null,
          assetKind: item?.kind,
          rank: idx + 1,
          matchScore: item?.score,
          metadataConfidence: null,
          reasons: Array.isArray(item?.reasons) ? item.reasons : [],
        })),
        canonicalSnapshot: envelope,
      }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);
    setCanonical(null);
    setSessionKey(null);

    try {
      const nextSessionKey = await initDecisionSession(form);
      setSessionKey(nextSessionKey);

      const guidanceRes = await fetch("/api/decision/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: form,
          options: {
            assetLimit: 6,
            minAssetScore: 18,
            source: "strategy-room",
          },
        }),
      });

      const raw = await guidanceRes.json();

      if (!guidanceRes.ok) {
        throw new Error(raw?.error || "Decision guidance generation failed.");
      }

      const nextCanonical = raw?.canonical ?? raw?.jsonPayload ?? raw;

      if (!hasCanonicalSections(nextCanonical)) {
        throw new Error("Canonical sections payload missing from guidance API.");
      }

      setCanonical(nextCanonical);
      await logRecommendationImpressions(nextSessionKey, nextCanonical);

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResubmit() {
    if (!sessionKey || !canonical) return;

    const posture = canonical.sections.constitutionalPosture;

    await trackFollowup({
      sessionKey,
      routeAfter: "DIAGNOSTIC",
      readinessTierAfter: "EMERGING",
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.35,
      authorityDelta: 0.15,
      convertedAfterGuidance: false,
      metadata: {
        action: "resubmit_requested",
        previousConstitution: posture,
      },
      canonical,
    });

    setCanonical(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMarkDiagnosticStarted() {
    if (!sessionKey || !canonical) return;

    const posture = canonical.sections.constitutionalPosture;

    await trackConversion({
      sessionKey,
      conversionType: "diagnostic_started",
      metadata: {
        source: "strategy_room_result",
        constitution: posture,
      },
      canonical,
    });

    await trackFollowup({
      sessionKey,
      routeAfter: "DIAGNOSTIC",
      readinessTierAfter: "EMERGING",
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.4,
      authorityDelta: 0.2,
      convertedAfterGuidance: true,
      metadata: {
        action: "diagnostic_started",
        constitutionalSource: true,
      },
      canonical,
    });
  }

  async function handleMarkStrategyAccepted() {
    if (!sessionKey || !canonical) return;

    const posture = canonical.sections.constitutionalPosture;

    await trackConversion({
      sessionKey,
      conversionType: "strategy_path_accepted",
      metadata: {
        source: "strategy_room_result",
        constitution: posture,
      },
      canonical,
    });

    await trackFollowup({
      sessionKey,
      routeAfter: "STRATEGY",
      readinessTierAfter: posture.readinessTier,
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.2,
      authorityDelta: 0.1,
      convertedAfterGuidance: true,
      metadata: {
        action: "strategy_path_accepted",
        constitutionalSource: true,
      },
      canonical,
    });
  }

  const featurePillars = [
    {
      icon: ShieldCheck,
      title: "Qualified Access",
      desc: "Strong signals escalate immediately. Weak signals receive governed correction before any escalation.",
    },
    {
      icon: Target,
      title: "Matched Guidance",
      desc: "Recommendations are surfaced by constitutional fit — not generic noise or content wandering.",
    },
    {
      icon: Lock,
      title: "Advisory Discipline",
      desc: "Strategy access is earned, not casually claimed. Bandwidth is protected by design.",
    },
  ];

  const inputClass =
    "w-full rounded-[16px] border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/24 focus:border-[#C9A96A]/35 focus:bg-white/[0.06] focus:ring-0";

  const posture = localSummary(canonical);
  const recommendations = recommendationList(canonical);
  const narrative = guidanceNarrative(canonical);
  const risks = principalRisks(canonical);
  const route = routeMeta(posture.route);

  return (
    <>
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta
          name="description"
          content="Governed constitutional intelligence for founders, executives, and boards. Not a booking form — a qualified advisory gate."
        />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.08),transparent_30%),linear-gradient(180deg,rgba(8,8,9,1)_0%,rgba(4,4,5,1)_100%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-14">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              href="/diagnostics/enterprise"
              className="group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/44 transition-colors duration-200 hover:text-white/78"
            >
              <ChevronRight className="h-3 w-3 rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to enterprise
            </Link>

            <div className="flex items-center gap-2">
              <StatusBadge variant="green">Live</StatusBadge>
              <StatusBadge variant="gold">Governed Intelligence</StatusBadge>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard elevated className="p-8 md:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A96A]/18" />
                <MonoEyebrow className="text-[#E6D1A1]">
                  ⚖ Constitutional Gate
                </MonoEyebrow>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A96A]/18" />
              </div>

              <h1 className="max-w-[28rem] text-[2.85rem] font-serif leading-[1.04] tracking-tight text-white md:text-5xl xl:text-[3.1rem]">
                Not a booking form.
                <br />
                <span className="bg-gradient-to-r from-[#C9A96A] via-[#E6D1A1] to-[#C9A96A] bg-clip-text text-transparent">
                  A governed advisory chamber.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-[1.85] text-white/65">
                This is where serious operators stop browsing and start declaring
                the real problem. The room exists to test mandate fit,
                consequence weight, authority, readiness, and whether private
                work is justified now.
              </p>

              <div className="mt-9 grid gap-4 md:grid-cols-3">
                {featurePillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="group rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5 transition-all duration-300 hover:border-[#C9A96A]/20 hover:bg-white/[0.045]"
                  >
                    <pillar.icon className="h-5 w-5 text-[#C9A96A] transition-transform duration-300 group-hover:scale-110" />
                    <div className="mt-4 text-[13px] font-semibold text-white">
                      {pillar.title}
                    </div>
                    <p className="mt-2 text-[11.5px] leading-[1.7] text-white/46">
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-2">
                <InsightPill icon={<Crown className="h-3 w-3 text-[#C9A96A]" />}>
                  Controlled entry
                </InsightPill>
                <InsightPill icon={<Scale className="h-3 w-3 text-[#C9A96A]" />}>
                  Constitutional routing
                </InsightPill>
                <InsightPill icon={<Eye className="h-3 w-3 text-[#C9A96A]" />}>
                  Decision-grade posture
                </InsightPill>
                <InsightPill icon={<Building2 className="h-3.5 w-3.5 text-[#C9A96A]" />}>
                  Founder, executive & board use cases
                </InsightPill>
                <InsightPill icon={<Landmark className="h-3.5 w-3.5 text-[#C9A96A]" />}>
                  Institutional consequence
                </InsightPill>
                <InsightPill icon={<TimerReset className="h-3.5 w-3.5 text-[#C9A96A]" />}>
                  Diagnostic before escalation where readiness is weak
                </InsightPill>
                <InsightPill icon={<Sparkles className="h-3.5 w-3.5 text-[#C9A96A]" />}>
                  Private chamber, not public theatre
                </InsightPill>
              </div>

              <div className="mt-8 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5">
                <div className="flex items-start gap-3">
                  <BadgeAlert className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      What closes the deal here
                    </div>
                    <p className="mt-2 text-[13px] leading-7 text-white/70">
                      The buyer should feel: “These people understand consequence,
                      they do not rush weak cases into advisory, and if they
                      accept my matter, it will be because the signal warrants
                      real attention.”
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard className="p-8 md:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <MonoEyebrow>Mandate Qualification</MonoEyebrow>
                  <h2 className="mt-4 text-2xl font-serif leading-tight text-white">
                    Present the matter clearly
                  </h2>
                  <p className="mt-2 text-[12px] leading-[1.75] text-white/42">
                    Thin answers weaken the reading. Serious buyers speak plainly
                    about consequence.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                {STRATEGY_ROOM_FORM_SPEC.map((field) => {
                  const value = form[field.name] || "";

                  return (
                    <div key={String(field.name)}>
                      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {field.label}
                        {field.required ? (
                          <span className="ml-1 text-[#C9A96A]/60">*</span>
                        ) : null}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          name={String(field.name)}
                          value={value}
                          onChange={handleChange}
                          rows={5}
                          placeholder={field.placeholder}
                          className={cx(inputClass, "resize-none leading-7")}
                        />
                      ) : field.type === "select" ? (
                        <select
                          name={String(field.name)}
                          value={value}
                          onChange={handleChange}
                          className={inputClass}
                        >
                          <option value="" className="bg-black text-white">
                            Select option
                          </option>
                          {(field.options || []).map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-black text-white"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={String(field.name)}
                          type={field.type}
                          value={value}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      )}

                      {field.helpText ? (
                        <p className="mt-1.5 text-[11px] leading-[1.65] text-white/36">
                          {field.helpText}
                        </p>
                      ) : null}
                    </div>
                  );
                })}

                {error ? (
                  <div className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                      <p className="text-[13px] leading-6 text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cx(
                    "inline-flex w-full items-center justify-center gap-3 rounded-[18px] border px-5 py-4",
                    "font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-300",
                    isSubmitting
                      ? "cursor-not-allowed border-white/[0.08] bg-white/[0.04] text-white/28"
                      : "border-[#C9A96A]/28 bg-[#C9A96A]/[0.11] text-[#E7D2A4] hover:bg-[#C9A96A]/[0.18] hover:shadow-lg hover:shadow-[#C9A96A]/5 active:scale-[0.99]",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
                      Assessing constitutional signal…
                    </>
                  ) : (
                    <>
                      Submit for constitutional diagnosis
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-4 text-[11px] leading-6 text-white/34">
                  <p className="max-w-xl">
                    Submitting here does not guarantee acceptance. It guarantees
                    a more serious reading than a contact form ever will.
                  </p>
                  <span>{draftSaved ? "Draft saved" : "Autosave active"}</span>
                </div>
              </form>
            </SectionCard>
          </div>

          {canonical ? (
            <div className="mt-10 space-y-8">
              <SectionCard elevated className="p-8 md:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <MonoEyebrow>Constitutional outcome</MonoEyebrow>
                    <h2 className="mt-4 font-serif text-4xl text-white">
                      The system has read the signal.
                    </h2>
                    <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/64">
                      This is the disciplined bridge between declared concern and
                      justified next move. It is the point where weak cases are
                      redirected and strong cases begin to earn chamber access.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      variant={
                        posture.route === "STRATEGY"
                          ? "green"
                          : posture.route === "REJECT"
                            ? "red"
                            : "gold"
                      }
                    >
                      {route.label}
                    </StatusBadge>
                    <StatusBadge variant="gold">
                      Confidence {posture.confidence}%
                    </StatusBadge>
                    <StatusBadge variant="gold">{posture.priority}</StatusBadge>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                        Route reading
                      </div>
                      <p className="mt-4 text-[15px] leading-8 text-white/72">
                        {route.description}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href={route.ctaHref}
                          onClick={() => {
                            if (posture.route === "STRATEGY") {
                              void handleMarkStrategyAccepted();
                            } else {
                              void handleMarkDiagnosticStarted();
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/28 bg-[#C9A96A]/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#E7D2A4] transition-colors hover:bg-[#C9A96A]/18"
                        >
                          {route.ctaLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => void handleResubmit()}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.24em] text-white/72 transition-colors hover:bg-white/[0.04]"
                        >
                          Refine and resubmit
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {narrative.length > 0 ? (
                      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                          Executive reading
                        </div>
                        <div className="mt-4 space-y-3">
                          {narrative.slice(0, 5).map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-3 text-sm leading-7 text-white/72"
                            >
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {risks.length > 0 ? (
                      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                          Principal risks
                        </div>
                        <div className="mt-4 space-y-3">
                          {risks.slice(0, 5).map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-3 text-sm leading-7 text-white/72"
                            >
                              <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                        Constitutional posture
                      </div>
                      <div className="mt-5 grid gap-4">
                        <ResultMetric label="Route" value={posture.route} />
                        <ResultMetric
                          label="Authority type"
                          value={posture.authorityType}
                        />
                        <ResultMetric
                          label="Readiness tier"
                          value={posture.readinessTier}
                        />
                        <ResultMetric
                          label="Temperature"
                          value={posture.temperature}
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]/80">
                        Recommendations
                      </div>
                      {recommendations.length ? (
                        <div className="mt-4 space-y-4">
                          {recommendations.slice(0, 4).map((item, idx) => (
                            <div
                              key={`${item.id ?? item.title ?? "rec"}-${idx}`}
                              className="rounded-[18px] border border-white/[0.08] bg-black/20 p-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {safeText(item.title, "Governed recommendation")}
                                  </div>
                                  <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
                                    {safeText(item.kind, "asset")}
                                  </div>
                                </div>
                                <div className="text-[11px] font-mono text-[#C9A96A]">
                                  {typeof item.score === "number"
                                    ? `${Math.round(item.score)}`
                                    : ""}
                                </div>
                              </div>

                              {Array.isArray(item.reasons) && item.reasons.length ? (
                                <div className="mt-3 space-y-2">
                                  {item.reasons.slice(0, 2).map((reason) => (
                                    <div
                                      key={reason}
                                      className="text-[12px] leading-6 text-white/60"
                                    >
                                      • {reason}
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {item.href ? (
                                <Link
                                  href={item.href}
                                  className="mt-4 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D1A1] hover:text-white"
                                >
                                  Open asset
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 text-sm leading-7 text-white/52">
                          No recommendation set was returned. The route logic is
                          still valid, but the governed asset layer returned
                          empty.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-white/[0.08] bg-black/20 px-4 py-3">
      <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <span className="text-sm text-white/78">{value}</span>
    </div>
  );
}