/* components/foundry/InterestForm.tsx — REVIEW INTEREST CAPTURE
 *
 * Structured intent capture. Shown after a public test result.
 * Captures decision type, deadline, professional help status, and
 * constraints — not just a free-text box.
 *
 * Not a newsletter form. Not a sales form. A review-intent signal.
 * Free-text content is never passed to analytics.
 *
 * "use client" required: uses React hooks; safe to ignore in Pages Router.
 */

"use client";

import * as React from "react";
import { track } from "@/lib/foundry/track";
import type { DecisionDomain } from "@/lib/decision/constraint-reality-layer";

const GOLD = "#C9A96E";

type SourceTest = "decision" | "market-signal" | "release-risk" | "general";

interface InterestFormProps {
  sourceTest?: SourceTest;
  initialDecisionType?: DecisionDomain;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

const URGENCY_OPTIONS = ["Low", "Medium", "High", "Board-sensitive"] as const;

const DECISION_TYPE_OPTIONS = [
  { value: "compliance_statutory", label: "Compliance / Statutory filing" },
  { value: "legal_regulatory", label: "Legal / Regulatory" },
  { value: "financial_exposure", label: "Financial commitment or exposure" },
  { value: "product_release", label: "Product release or launch" },
  { value: "market_claim", label: "Market claim or positioning" },
  { value: "board_sensitive", label: "Board / Governance approval" },
  { value: "family_legal_admin", label: "Personal / Legal admin" },
  { value: "operational_dependency", label: "Operational risk" },
  { value: "other", label: "Other" },
] as const;

const PROFESSIONAL_HELP_OPTIONS = [
  { value: "can_access", label: "Can access professional help" },
  { value: "seeking", label: "Actively seeking but not yet found" },
  { value: "cannot_afford", label: "Cannot afford professional help" },
  { value: "not_applicable", label: "Not applicable to this decision" },
] as const;

function domainToFormType(d?: DecisionDomain): string {
  if (!d || d === "unclear" || d === "deadline_bound" || d === "personal_low_stakes") return "";
  if (d === "operational_dependency") return "operational_dependency";
  return d;
}

export function InterestForm({ sourceTest = "general", initialDecisionType }: InterestFormProps) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    organisation: "",
    role: "",
    decisionType: domainToFormType(initialDecisionType),
    deadline: "",
    professionalHelpStatus: "",
    hasFinancialConstraint: false,
    alreadyTried: "",
    minimumOutcome: "",
    urgency: "Medium" as (typeof URGENCY_OPTIONS)[number],
    consentGiven: false,
    _hp: "",
  });

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consentGiven || !form.name.trim() || !form.email.trim()) return;

    setState("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/foundry/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          organisation: form.organisation.trim() || undefined,
          role: form.role.trim() || undefined,
          decisionType: form.decisionType || undefined,
          deadline: form.deadline.trim() || undefined,
          professionalHelpStatus: form.professionalHelpStatus || undefined,
          hasFinancialConstraint: form.hasFinancialConstraint,
          alreadyTried: form.alreadyTried.trim() || undefined,
          minimumOutcome: form.minimumOutcome.trim() || undefined,
          urgency: form.urgency,
          sourceTest,
          consentGiven: form.consentGiven,
          _hp: form._hp,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setState("success");
        track("foundry_interest_submit", {
          sourceTest,
          urgency: form.urgency,
          hasDecisionType: Boolean(form.decisionType),
          hasDeadline: Boolean(form.deadline),
          hasConstraint: form.hasFinancialConstraint,
        });
      } else {
        setState("error");
        setErrorMsg(
          res.status === 429
            ? "Too many submissions from this location. Please try again later."
            : "Could not record your interest. Please try again."
        );
      }
    } catch {
      setState("error");
      setErrorMsg("Could not reach the server. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="border border-emerald-500/20 bg-emerald-500/5 p-6">
        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-emerald-400/70 mb-2">
          Interest Recorded
        </p>
        <p className="text-sm text-white/70">
          Your interest in a full review has been noted. A member of the Foundry team will be in touch.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/8 bg-white/2">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40 mb-1">Next step</p>
          <p className="font-serif text-base font-light italic text-white/80">
            Want this reviewed as a governed case?
          </p>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] transition-colors shrink-0 ml-4" style={{ color: `${GOLD}99` }}>
          {open ? "Close" : "Express interest →"}
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-5 border-t border-white/5">
          {/* Honeypot */}
          <input type="text" name="_hp" value={form._hp} onChange={e => set("_hp", e.target.value)}
            tabIndex={-1} aria-hidden="true" style={{ display: "none" }} />

          <p className="pt-4 text-xs text-white/45 leading-relaxed max-w-xl">
            A review is not a sales call. A Foundry team member will review your submission and
            determine whether a full governed assessment is appropriate.
          </p>

          {/* Name + Email */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
                Name <span className="text-red-400/60">*</span>
              </label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Your name"
                className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
                Email <span className="text-red-400/60">*</span>
              </label>
              <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="you@organisation.com"
                className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          {/* Organisation + Role */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Organisation</label>
              <input value={form.organisation} onChange={e => set("organisation", e.target.value)}
                placeholder="Company or institution"
                className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Role</label>
              <input value={form.role} onChange={e => set("role", e.target.value)}
                placeholder="Your title or function"
                className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
                style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          {/* Decision type */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Decision type</label>
            <select value={form.decisionType} onChange={e => set("decisionType", e.target.value)}
              className="w-full border bg-black/50 px-3 py-2 text-sm text-white/60 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <option value="">Select type...</option>
              {DECISION_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
              When must this be resolved?
            </label>
            <input value={form.deadline} onChange={e => set("deadline", e.target.value)}
              placeholder="e.g. 30 June 2026, within 2 weeks, no hard deadline..."
              className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Professional help status */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
              Access to professional help
            </label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_HELP_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => set("professionalHelpStatus", opt.value)}
                  className="border px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.15em] transition-colors text-left"
                  style={form.professionalHelpStatus === opt.value
                    ? { borderColor: `${GOLD}60`, color: GOLD, backgroundColor: `${GOLD}15` }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Financial constraint */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.hasFinancialConstraint}
              onChange={e => set("hasFinancialConstraint", e.target.checked)} className="mt-0.5 shrink-0" />
            <span className="text-xs text-white/50 leading-relaxed">
              Financial constraint is a factor in this decision (budget limits, cash flow, no funds for professional help)
            </span>
          </label>

          {/* What has already been tried */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
              What have you already tried?
            </label>
            <textarea value={form.alreadyTried} onChange={e => set("alreadyTried", e.target.value)}
              rows={2}
              placeholder="e.g. contacted HMRC, spoke to one accountant, tried to file online..."
              className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none resize-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Minimum outcome */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">
              Minimum viable outcome
            </label>
            <input value={form.minimumOutcome} onChange={e => set("minimumOutcome", e.target.value)}
              placeholder="e.g. file on time, avoid the penalty, get a defensible position..."
              className="w-full border bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Urgency */}
          <div className="space-y-1">
            <label className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/30">Urgency</label>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => set("urgency", opt)}
                  className="border px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] transition-colors"
                  style={form.urgency === opt
                    ? { borderColor: `${GOLD}60`, color: GOLD, backgroundColor: `${GOLD}15` }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={form.consentGiven}
              onChange={e => set("consentGiven", e.target.checked)} className="mt-0.5 shrink-0" />
            <span className="text-xs text-white/40 leading-relaxed">
              I consent to Abraham of London recording this submission for the purpose of assessing
              review interest. This information will not be shared with third parties or used for marketing.
            </span>
          </label>

          {errorMsg && <p className="text-xs text-red-400/80">{errorMsg}</p>}

          <button
            type="submit"
            disabled={state === "submitting" || !form.consentGiven || !form.name.trim() || !form.email.trim()}
            className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
            style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
          >
            {state === "submitting" ? "Submitting..." : "Submit Review Interest"}
          </button>
        </form>
      )}
    </div>
  );
}
