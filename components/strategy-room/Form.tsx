"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Shield,
  Scale,
  Target,
  Activity,
  Zap,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---- Types ---- */

type FormData = {
  problemStatement: string;
  costOfInaction: number;
  priorFailures: string;
  name: string;
  email: string;
  organisation: string;
  role: string;
  jurisdiction: string;
  sponsorCommitment: number;
  politicalConstraints: string;
  financialExposure: number;
  reputationalRisk: number;
  institutionalConsequence: number;
  timelinePressure: number;
  existingAssets: string;
  blockers: string;
  absorptionCapacity: number;
};

type MandateRoute = "QUALIFIED" | "BORDERLINE" | "NOT_QUALIFIED";

const INITIAL: FormData = {
  problemStatement: "", costOfInaction: 5, priorFailures: "",
  name: "", email: "", organisation: "", role: "", jurisdiction: "", sponsorCommitment: 5, politicalConstraints: "",
  financialExposure: 5, reputationalRisk: 5, institutionalConsequence: 5, timelinePressure: 5,
  existingAssets: "", blockers: "", absorptionCapacity: 5,
};

const STAGES = [
  { label: "Situation Gravity", icon: AlertTriangle },
  { label: "Authority & Mandate", icon: Shield },
  { label: "Consequence Mapping", icon: Scale },
  { label: "Intervention Readiness", icon: Activity },
  { label: "Fit Assessment", icon: Target },
];

/* ---- Helpers ---- */

function computeMandateScore(d: FormData): number {
  const gravity = ((d.problemStatement.length > 100 ? 8 : d.problemStatement.length > 40 ? 5 : 2) * 0.5 + d.costOfInaction * 0.5);
  const authority = d.sponsorCommitment;
  const consequence = (d.financialExposure + d.reputationalRisk + d.institutionalConsequence + d.timelinePressure) / 4;
  const readiness = d.absorptionCapacity;
  const fit = (gravity + authority + consequence + readiness) / 4;
  return Math.round(gravity / 10 * 25 + authority / 10 * 25 + consequence / 10 * 20 + readiness / 10 * 20 + fit / 10 * 10);
}

function getRoute(score: number): MandateRoute {
  if (score >= 70) return "QUALIFIED";
  if (score >= 45) return "BORDERLINE";
  return "NOT_QUALIFIED";
}

const ROUTE_CONFIG: Record<MandateRoute, { color: string; border: string; bg: string; label: string }> = {
  QUALIFIED: { color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", label: "Qualified for Strategy Room" },
  BORDERLINE: { color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", label: "Borderline — Executive Reporting recommended" },
  NOT_QUALIFIED: { color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", label: "Not yet qualified — Diagnostics recommended" },
};

/* ---- Sub-components ---- */

function RatingRail({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">{label}</span>
        <span className="font-mono text-[10px] text-white/60">{value}/10</span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-amber-500"
      />
    </div>
  );
}

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="font-mono text-[7px] uppercase tracking-[0.24em] text-white/35">{label}</span>
        <span className="font-mono text-[8px] text-white/45">{value}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className={cn("h-full rounded-full", pct >= 70 ? "bg-emerald-500/60" : pct >= 40 ? "bg-amber-500/60" : "bg-red-500/50")}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

const INPUT_CLS = "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white outline-none focus:border-amber-500/30 transition-colors placeholder:text-white/20";
const TEXTAREA_CLS = cn(INPUT_CLS, "min-h-[120px] resize-none");

/* ---- Main Component ---- */

export default function StrategyRoomForm() {
  const [stage, setStage] = React.useState(0);
  const [form, setForm] = React.useState<FormData>(INITIAL);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [inheritedSignal, setInheritedSignal] = React.useState<any>(null);
  const [direction, setDirection] = React.useState(1);

  React.useEffect(() => {
    try {
      const pa = sessionStorage.getItem("purpose-alignment-result");
      if (pa) setInheritedSignal(JSON.parse(pa));
    } catch { /* SSR */ }
  }, []);

  const mandateScore = computeMandateScore(form);
  const route = getRoute(mandateScore);

  const set = (field: keyof FormData, value: string | number) =>
    setForm((p) => ({ ...p, [field]: value }));

  function canAdvance(): boolean {
    if (stage === 0) return form.problemStatement.length >= 20;
    if (stage === 1) return form.name.length > 0 && form.email.length > 0 && form.organisation.length > 0;
    if (stage === 2) return true;
    if (stage === 3) return true;
    return true;
  }

  const advance = () => { if (stage < 4) { setDirection(1); setStage(s => s + 1); } };
  const retreat = () => { if (stage > 0) { setDirection(-1); setStage(s => s - 1); } };

  const handleSubmit = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/strategy-room/session/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: form, mandateScore, route }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      sessionStorage.setItem("strategy-room-result", JSON.stringify({ ...data, mandateScore, route }));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  /* ---- Stage renderers ---- */

  const stages: React.ReactNode[] = [
    // Stage 0: Situation Gravity
    <div key="s0" className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-white/90">Situation Gravity</h2>
        <p className="mt-2 text-sm text-white/40">What is happening, what is the cost of inaction, and what has already been tried.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Problem Statement</label>
          <textarea value={form.problemStatement} onChange={e => set("problemStatement", e.target.value)}
            placeholder="Describe the core issue requiring strategic intervention..." className={TEXTAREA_CLS} />
          {form.problemStatement.length > 0 && form.problemStatement.length < 20 && (
            <p className="mt-1 font-mono text-[9px] text-red-400/60">Minimum 20 characters required</p>
          )}
        </div>
        <RatingRail label="Cost of Inaction" value={form.costOfInaction} onChange={v => set("costOfInaction", v)} />
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Prior Attempts</label>
          <textarea value={form.priorFailures} onChange={e => set("priorFailures", e.target.value)}
            placeholder="What has already been tried and why it failed..." className={TEXTAREA_CLS} />
        </div>
      </div>
    </div>,

    // Stage 1: Authority & Mandate
    <div key="s1" className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-white/90">Authority & Mandate</h2>
        <p className="mt-2 text-sm text-white/40">Who holds decision authority and what is the sponsor's actual commitment level.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Full Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Decision sponsor" className={INPUT_CLS} />
          </div>
          <div>
            <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@org.com" className={INPUT_CLS} />
          </div>
          <div>
            <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Organisation</label>
            <input value={form.organisation} onChange={e => set("organisation", e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Role</label>
            <input value={form.role} onChange={e => set("role", e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Jurisdiction</label>
          <input value={form.jurisdiction} onChange={e => set("jurisdiction", e.target.value)} placeholder="UK, US, EMEA..." className={INPUT_CLS} />
        </div>
        <RatingRail label="Sponsor Commitment Level" value={form.sponsorCommitment} onChange={v => set("sponsorCommitment", v)} />
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Political Constraints</label>
          <textarea value={form.politicalConstraints} onChange={e => set("politicalConstraints", e.target.value)}
            placeholder="Board dynamics, internal resistance, compliance constraints..." className={TEXTAREA_CLS} />
        </div>
      </div>
    </div>,

    // Stage 2: Consequence Mapping
    <div key="s2" className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-white/90">Consequence Mapping</h2>
        <p className="mt-2 text-sm text-white/40">Rate the severity of consequences across four dimensions.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-6">
        <RatingRail label="Financial Exposure" value={form.financialExposure} onChange={v => set("financialExposure", v)} />
        <RatingRail label="Reputational Risk" value={form.reputationalRisk} onChange={v => set("reputationalRisk", v)} />
        <RatingRail label="Institutional Consequence" value={form.institutionalConsequence} onChange={v => set("institutionalConsequence", v)} />
        <RatingRail label="Timeline Pressure" value={form.timelinePressure} onChange={v => set("timelinePressure", v)} />
      </div>
    </div>,

    // Stage 3: Intervention Readiness
    <div key="s3" className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-white/90">Intervention Readiness</h2>
        <p className="mt-2 text-sm text-white/40">What assets and blockers exist, and whether the organisation can absorb structured intervention.</p>
      </div>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5">
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Existing Assets</label>
          <textarea value={form.existingAssets} onChange={e => set("existingAssets", e.target.value)}
            placeholder="Prior diagnostics, internal data, advisory relationships, board reports..." className={TEXTAREA_CLS} />
        </div>
        <div>
          <label className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-2">Known Blockers</label>
          <textarea value={form.blockers} onChange={e => set("blockers", e.target.value)}
            placeholder="Budget constraints, timeline, internal resistance, talent gaps..." className={TEXTAREA_CLS} />
        </div>
        <RatingRail label="Absorption Capacity" value={form.absorptionCapacity} onChange={v => set("absorptionCapacity", v)} />
      </div>
    </div>,

    // Stage 4: Fit Assessment
    <div key="s4" className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-white/90">Fit Assessment</h2>
        <p className="mt-2 text-sm text-white/40">Your mandate has been evaluated against constitutional thresholds.</p>
      </div>
      <div className={cn("rounded-2xl border p-8", ROUTE_CONFIG[route].border, ROUTE_CONFIG[route].bg)}>
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40 block mb-3">Mandate Score</span>
        <div className="flex items-baseline gap-3">
          <span className={cn("font-serif text-5xl font-light", ROUTE_CONFIG[route].color)}>{mandateScore}</span>
          <span className="font-mono text-[9px] text-white/40">/ 100</span>
        </div>
        <p className={cn("mt-3 font-mono text-xs uppercase tracking-wider", ROUTE_CONFIG[route].color)}>
          {ROUTE_CONFIG[route].label}
        </p>
      </div>

      {route === "QUALIFIED" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6">
          <p className="text-sm text-white/60 mb-4">Your situation meets the constitutional thresholds for direct strategic engagement.</p>
          <button onClick={handleSubmit} disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300 hover:bg-emerald-500/[0.15] transition-colors">
            {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Zap className="h-3.5 w-3.5" /> Proceed to Strategy Room</>}
          </button>
        </motion.div>
      )}

      {route === "BORDERLINE" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
          <p className="text-sm text-white/60 mb-4">Your mandate shows promise but needs further diagnostic clarity before strategic engagement.</p>
          <Link href="/diagnostics/executive-reporting" className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200 transition-colors">
            Proceed to Executive Reporting <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {route === "NOT_QUALIFIED" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-6">
          <p className="text-sm text-white/60 mb-4">The current signal does not meet thresholds for strategic engagement. Start with foundational diagnostics to build clarity.</p>
          <Link href="/diagnostics" className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 hover:text-white/80 transition-colors">
            Start Diagnostics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-400/70">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-mono text-[9px] uppercase tracking-widest">Mandate submitted successfully</span>
        </motion.div>
      )}
      {status === "error" && (
        <p className="font-mono text-[9px] text-red-400/60">Submission failed. Please try again.</p>
      )}
    </div>,
  ];

  return (
    <div className="relative min-h-[600px]">
      {/* Inherited signal */}
      {inheritedSignal && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 flex items-center gap-3">
          <Shield className="h-4 w-4 text-amber-500/50 shrink-0" />
          <span className="font-mono text-[9px] text-white/45">
            Inherited signal: Purpose Alignment {inheritedSignal.coherenceBand} ({inheritedSignal.percent}%)
          </span>
        </motion.div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Strategy Room Intake</span>
          <span className="font-mono text-[9px] text-white/40">Stage {stage + 1} of 5</span>
        </div>
        <div className="flex gap-1.5">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => { if (i <= stage) { setDirection(i > stage ? 1 : -1); setStage(i); } }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border font-mono text-[7px] uppercase tracking-[0.2em] transition-all duration-300",
                  i === stage ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-300/80"
                    : i < stage ? "border-white/[0.08] bg-white/[0.02] text-white/40 cursor-pointer"
                    : "border-white/[0.05] text-white/15",
                )}>
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`stage-${stage}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.35 }}
          >
            {stages[stage]}

            {stage < 4 && (
              <div className="flex items-center justify-between pt-6">
                <button onClick={retreat} disabled={stage === 0}
                  className={cn("flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors",
                    stage === 0 ? "text-white/15 cursor-not-allowed" : "text-white/50 hover:text-white/80")}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <button onClick={advance} disabled={!canAdvance()}
                  className={cn("flex items-center gap-2 rounded-xl px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] transition-all",
                    canAdvance() ? "border border-amber-500/30 bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/[0.15]"
                      : "border border-white/[0.06] text-white/20 cursor-not-allowed")}>
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sidebar: Mandate Score */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-4">Live Mandate Score</span>
              <div className="text-center mb-4">
                <span className={cn("font-serif text-3xl", mandateScore >= 70 ? "text-emerald-400" : mandateScore >= 45 ? "text-amber-400" : "text-red-400")}>
                  {mandateScore}
                </span>
                <span className="font-mono text-[9px] text-white/30 ml-1">/ 100</span>
              </div>
              <div className="space-y-3">
                <ScoreBar label="Gravity" value={Math.round(((form.problemStatement.length > 100 ? 8 : 5) * 0.5 + form.costOfInaction * 0.5) / 10 * 25)} />
                <ScoreBar label="Authority" value={Math.round(form.sponsorCommitment / 10 * 25)} />
                <ScoreBar label="Consequence" value={Math.round(((form.financialExposure + form.reputationalRisk + form.institutionalConsequence + form.timelinePressure) / 4) / 10 * 20)} max={20} />
                <ScoreBar label="Readiness" value={Math.round(form.absorptionCapacity / 10 * 20)} max={20} />
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <span className={cn("font-mono text-[8px] uppercase tracking-[0.2em]",
                  ROUTE_CONFIG[route].color)}>{route.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
