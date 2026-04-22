// components/assessments/EnterpriseAssessmentSuite.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import SystemMemoryBlock from "@/components/diagnostics/results/SystemMemoryBlock";

type EnterpriseDomain = {
  label: string;
  authority: number;
  governance: number;
  clarity: number;
  execution: number;
  trust: number;
  exposure: number;
  /** Most expensive failure in this domain — binds to cascade risk and exposure reasoning */
  failureNote?: string;
};

const DOMAIN_METRICS: Array<{
  key: keyof EnterpriseDomain;
  label: string;
  short: string;
  inverse?: boolean;
}> = [
  { key: "authority", label: "Authority", short: "Auth" },
  { key: "governance", label: "Governance", short: "Gov" },
  { key: "clarity", label: "Clarity", short: "Clar" },
  { key: "execution", label: "Execution", short: "Exec" },
  { key: "trust", label: "Trust", short: "Trst" },
  { key: "exposure", label: "Exposure", short: "Exp", inverse: true },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-5 w-px bg-amber-500/40" />
      <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-amber-400/75">
        {children}
      </span>
    </div>
  );
}

/** Health score from a domain */
function domainHealth(d: EnterpriseDomain): number {
  return Math.round(
    (d.authority + d.governance + d.clarity + d.execution + d.trust + (100 - d.exposure)) / 6,
  );
}

function healthLabel(score: number) {
  if (score >= 65) return { label: "Ordered", color: "text-emerald-300/80", bg: "border-emerald-500/20 bg-emerald-500/[0.07]", bar: "bg-emerald-500/60" };
  if (score >= 45) return { label: "Drifting", color: "text-amber-300/80", bg: "border-amber-500/20 bg-amber-500/[0.07]", bar: "bg-amber-500/65" };
  return { label: "Misaligned", color: "text-red-300/80", bg: "border-red-400/20 bg-red-500/[0.07]", bar: "bg-red-500/60" };
}

/** Mini heat cell for the domain grid */
function HeatCell({ value, inverse }: { value: number; inverse?: boolean }) {
  const effective = inverse ? 100 - value : value;
  const bg =
    effective >= 65
      ? "bg-emerald-500/20 text-emerald-300/80"
      : effective >= 40
        ? "bg-amber-500/15 text-amber-300/80"
        : "bg-red-500/15 text-red-300/70";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[8px] py-1.5 font-mono text-[10px] tabular-nums",
        bg,
      )}
    >
      {value}
    </div>
  );
}

/** Full domain row card */
function DomainCard({
  domain,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  domain: EnterpriseDomain;
  index: number;
  onUpdate: (key: keyof EnterpriseDomain, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const health = domainHealth(domain);
  const hl = healthLabel(health);
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] font-mono text-[9px] text-white/28">
          {String(index + 1).padStart(2, "0")}
        </div>

        <span className="flex-1 font-serif text-base text-white/85">
          {domain.label || "Unnamed domain"}
        </span>

        {/* Mini heat strip */}
        <div className="hidden items-center gap-1 sm:flex">
          {DOMAIN_METRICS.map((m) => (
            <div
              key={String(m.key)}
              className={cn(
                "h-5 w-5 rounded-[5px] font-mono text-[7px] flex items-center justify-center",
                (m.inverse ? 100 - (domain[m.key] as number) : (domain[m.key] as number)) >= 65
                  ? "bg-emerald-500/20 text-emerald-300/70"
                  : (m.inverse ? 100 - (domain[m.key] as number) : (domain[m.key] as number)) >= 40
                    ? "bg-amber-500/15 text-amber-300/70"
                    : "bg-red-500/15 text-red-300/70",
              )}
              title={m.label}
            >
              {m.short[0]}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "rounded-full border px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.18em]",
            hl.bg, hl.color,
          )}
        >
          {hl.label}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.06] text-white/22 transition hover:border-red-400/20 hover:bg-red-500/[0.07] hover:text-red-300/70"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        <div className={cn("font-mono text-[9px] text-white/22 transition-transform duration-200", expanded && "rotate-180")}>
          ↓
        </div>
      </button>

      {/* Health bar */}
      <div className="mx-5 h-0.5 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          className={cn("h-full rounded-full", hl.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${health}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Expanded sliders */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-4">
              {/* Domain name input */}
              <div className="mb-5 space-y-1.5">
                <label className="block font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/28">
                  Domain name
                </label>
                <input
                  value={domain.label}
                  onChange={(e) => onUpdate("label", e.target.value)}
                  placeholder="Strategy, Operations, Governance…"
                  className="w-full rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-amber-500/25"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {DOMAIN_METRICS.map((m) => {
                  const val = domain[m.key] as number;
                  const effective = m.inverse ? 100 - val : val;
                  const color =
                    effective >= 65
                      ? "text-emerald-400/80"
                      : effective >= 40
                        ? "text-amber-400/80"
                        : "text-red-400/80";

                  return (
                    <div key={String(m.key)} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[7.5px] uppercase tracking-[0.20em] text-white/30">
                          {m.label}
                          {m.inverse && (
                            <span className="ml-1 text-white/18">↓ lower = better</span>
                          )}
                        </span>
                        <span className={cn("font-mono text-[9px] tabular-nums", color)}>
                          {val}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            effective >= 65
                              ? "bg-emerald-500/60"
                              : effective >= 40
                                ? "bg-amber-500/65"
                                : "bg-red-500/55",
                          )}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={val}
                        onChange={(e) => onUpdate(m.key, Number(e.target.value))}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-amber-500"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Failure grounding — binds to cascade risk and exposure */}
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)", marginBottom: "0.35rem" }}>
                  Most expensive failure in this domain (last 12 months)
                </label>
                <textarea
                  value={domain.failureNote ?? ""}
                  onChange={(e) => onUpdate("failureNote", e.target.value)}
                  rows={2}
                  placeholder="What went wrong, what it cost, and whether it was resolved."
                  style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.07)", padding: "8px 10px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(255,255,255,0.65)", resize: "none" as const, outline: "none" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Enterprise heat map — the institutional overview grid */
function EnterpriseHeatMap({ domains }: { domains: EnterpriseDomain[] }) {
  const filled = domains.filter((d) => d.label.trim());
  if (!filled.length) return null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.02]">
      <div className="p-5">
        <Eyebrow>Institutional heat map</Eyebrow>
        <p className="mt-2 text-xs text-white/30">
          Live view across all domains and dimensions.
        </p>
      </div>

      <div className="px-5 pb-5">
        {/* Header row */}
        <div
          className="grid gap-1 mb-2"
          style={{ gridTemplateColumns: `1fr repeat(${DOMAIN_METRICS.length}, minmax(0,1fr))` }}
        >
          <div />
          {DOMAIN_METRICS.map((m) => (
            <div
              key={String(m.key)}
              className="text-center font-mono text-[7px] uppercase tracking-[0.16em] text-white/22"
            >
              {m.short}
            </div>
          ))}
        </div>

        {/* Domain rows */}
        <div className="space-y-1">
          {filled.map((d, i) => {
            const health = domainHealth(d);
            const hl = healthLabel(health);
            return (
              <div
                key={i}
                className="grid gap-1 items-center"
                style={{ gridTemplateColumns: `1fr repeat(${DOMAIN_METRICS.length}, minmax(0,1fr))` }}
              >
                <div className="flex items-center gap-2 pr-2">
                  <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", hl.bar)} />
                  <span className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">
                    {d.label}
                  </span>
                </div>
                {DOMAIN_METRICS.map((m) => (
                  <HeatCell
                    key={String(m.key)}
                    value={d[m.key] as number}
                    inverse={m.inverse}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** System-wide analysis panel */
function SystemReadout({ domains }: { domains: EnterpriseDomain[] }) {
  const filled = domains.filter((d) => d.label.trim());
  if (filled.length < 2) {
    return (
      <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.015] p-5">
        <Eyebrow>System readout</Eyebrow>
        <p className="mt-3 text-xs text-white/28">
          Add at least two named domains to see system-wide analysis.
        </p>
      </div>
    );
  }

  const overallHealth = Math.round(
    filled.reduce((sum, d) => sum + domainHealth(d), 0) / filled.length,
  );

  const weakest = ([...filled].sort((a, b) => domainHealth(a) - domainHealth(b))[0] ?? filled[0])!;
  const hl = healthLabel(overallHealth);

  const highExposure = filled.filter((d) => d.exposure >= 70);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
        <Eyebrow>System readout</Eyebrow>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[14px] border border-white/[0.06] bg-black/30 p-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.22em] text-white/25">
              System posture
            </div>
            <div className={cn("mt-2 font-serif text-2xl", hl.color)}>
              {hl.label}
            </div>
            <div className="mt-1 font-mono text-[9px] text-white/28">{overallHealth}/100</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.06] bg-black/30 p-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.22em] text-white/25">
              Weakest domain
            </div>
            <div className="mt-2 font-serif text-2xl text-white/80">
              {weakest.label || "—"}
            </div>
            <div className="mt-1 font-mono text-[9px] text-white/28">
              {domainHealth(weakest)}/100
            </div>
          </div>
        </div>

        {highExposure.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-amber-500/15 bg-amber-500/[0.05] px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
            <div>
              <div className="font-mono text-[7px] uppercase tracking-[0.20em] text-amber-400/65">
                High exposure
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/45">
                {highExposure.map((d) => d.label).join(", ")} —{" "}
                {highExposure.length === 1 ? "this domain carries" : "these domains carry"} material
                institutional risk.
              </div>
            </div>
          </div>
        )}
      </div>

      <EnterpriseHeatMap domains={filled} />
    </div>
  );
}

function deriveEnterpriseReading(posture: string, heatDomains: string[]): string {
  const heat = heatDomains.length;
  if (posture === "DISORDERED") return `The institution is structurally disordered. ${heat} domain${heat === 1 ? "" : "s"} under active stress. Governance and execution are both below the threshold needed for coherent decision-making. This is not drift — it is structural failure requiring immediate attention.`;
  if (posture === "MISALIGNED") return `Significant misalignment detected across ${heat} domain${heat === 1 ? "" : "s"}. The institution is operating under internal contradiction — governance says one thing, execution does another. This gap will widen under pressure.`;
  return `The enterprise is drifting but not yet in crisis. ${heat > 0 ? `${heat} domain${heat === 1 ? " shows" : "s show"} early stress signals.` : "No acute heat domains detected."} Intervention now is preventive, not reactive.`;
}

function deriveEnterpriseAction(posture: string, heatDomains: string[]): string {
  if (posture === "DISORDERED") return "Do not attempt broad reform. Stabilise the single highest-exposure domain first. Identify who has actual decision authority in that domain and whether it matches the formal structure.";
  if (posture === "MISALIGNED") return "Map the gap between governance intention and execution reality in the top heat domain. The misalignment is likely known informally but not surfaced formally. Making it visible is the first structural move.";
  if (heatDomains.length > 0) return "Monitor the flagged heat domains. If any of them intersect with an upcoming decision of consequence, escalate to Executive Reporting before the decision is taken.";
  return "No immediate structural intervention required. Reassess quarterly or when conditions change materially.";
}

/** Result panel */
function ResultPanel({ result }: { result: any }) {
  const posture = String(result.enterprisePosture ?? "DRIFTING");
  const heatDomains: string[] = Array.isArray(result.heatDomains) ? result.heatDomains : [];
  const postureColor = posture === "DISORDERED" ? "text-red-300/80" : posture === "MISALIGNED" ? "text-red-300/70" : "text-amber-300/80";
  const reading = deriveEnterpriseReading(posture, heatDomains);
  const nextAction = deriveEnterpriseAction(posture, heatDomains);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Cross-stage memory */}
      <SystemMemoryBlock currentStage="enterprise" />
      {/* Condition */}
      <div className="border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-amber-400/80" />
          <div className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber-300/80">
            Enterprise assessment complete
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className={cn("font-serif text-[clamp(2rem,4vw,3rem)] font-light leading-none", postureColor)}>
              {posture}
            </div>
            <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.20em] text-white/35">
              {String(result.organisation ?? "—")}
            </div>
          </div>
        </div>
      </div>

      {/* Heat domains */}
      {heatDomains.length > 0 && (
        <div className="border border-red-400/15 bg-red-500/[0.04] p-5">
          <div className="font-mono text-[7.5px] uppercase tracking-[0.26em] text-red-300/60 mb-3">
            Heat domains — active stress
          </div>
          <div className="flex flex-wrap gap-2">
            {heatDomains.map((d: string) => (
              <span
                key={d}
                className="border border-red-400/15 bg-red-500/10 px-2.5 py-1 font-mono text-[8px] text-red-300/75"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Structural reading */}
      <div className="border border-white/[0.07] bg-white/[0.015] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05]" style={{ background: "linear-gradient(to right, rgba(201,169,110,0.05), transparent)" }}>
          <Eyebrow>Structural reading</Eyebrow>
        </div>
        <div className="p-5">
          <p className="font-serif text-[1rem] font-light leading-[1.72] text-white/65">
            {reading}
          </p>
        </div>
      </div>

      {/* Next action */}
      <div className="border border-amber-500/15 bg-amber-500/[0.04] p-5">
        <Eyebrow>Recommended action</Eyebrow>
        <p className="mt-3 font-serif text-[1rem] font-light leading-[1.72] text-white/70">
          {nextAction}
        </p>
      </div>

      {/* Escalation */}
      <div className="border border-white/[0.06] bg-white/[0.01] p-5">
        <Eyebrow>Next layer</Eyebrow>
        <p className="mt-2 font-serif text-[0.95rem] font-light italic leading-[1.65] text-white/50 mb-4">
          The enterprise signal warrants deeper interpretation. Executive Reporting translates structural strain into financial exposure and a governed priority stack.
        </p>
        <Link
          href="/diagnostics/executive-reporting"
          className="group inline-flex items-center gap-2 border border-amber-500/25 bg-amber-500/[0.06] px-5 py-2.5 font-mono text-[8px] uppercase tracking-[0.24em] text-amber-300/80 transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
        >
          Continue to Executive Reporting <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  );
}

/* ---- Posture Matrix ---- */

type InstitutionalPosture = "ORDERED" | "DRIFTING" | "CONTESTED" | "DISORDERED";

function computePosture(domains: EnterpriseDomain[]): { posture: InstitutionalPosture; govAvg: number; execAvg: number } {
  if (domains.length === 0) return { posture: "DISORDERED", govAvg: 0, execAvg: 0 };
  const govAvg = Math.round(domains.reduce((s, d) => s + d.governance, 0) / domains.length);
  const execAvg = Math.round(domains.reduce((s, d) => s + d.execution, 0) / domains.length);
  const posture: InstitutionalPosture =
    govAvg >= 60 && execAvg >= 60 ? "ORDERED" :
    govAvg >= 60 && execAvg < 60 ? "DRIFTING" :
    govAvg < 60 && execAvg >= 60 ? "CONTESTED" : "DISORDERED";
  return { posture, govAvg, execAvg };
}

function PostureMatrix({ domains }: { domains: EnterpriseDomain[] }) {
  const { posture, govAvg, execAvg } = computePosture(domains);
  const cells: Array<{ id: InstitutionalPosture; label: string; row: number; col: number }> = [
    { id: "ORDERED", label: "Ordered", row: 0, col: 1 },
    { id: "DRIFTING", label: "Drifting", row: 0, col: 0 },
    { id: "CONTESTED", label: "Contested", row: 1, col: 1 },
    { id: "DISORDERED", label: "Disordered", row: 1, col: 0 },
  ];

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">Institutional Posture</div>
      <div className="grid grid-cols-2 gap-2">
        {cells.map((c) => (
          <div key={c.id} className={cn(
            "rounded-xl border p-3 text-center transition-all",
            posture === c.id
              ? "border-amber-500/30 bg-amber-500/[0.08]"
              : "border-white/[0.06] bg-white/[0.02]",
          )}>
            <span className={cn("font-mono text-[8px] uppercase tracking-[0.2em]",
              posture === c.id ? "text-amber-300" : "text-white/25")}>{c.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[7px] text-white/30">
        <span>Gov: {govAvg}</span>
        <span>Exec: {execAvg}</span>
      </div>
      {posture === "DISORDERED" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400/80" />
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-red-300/80">Mandatory escalation</span>
          </div>
          <p className="mt-1 text-[10px] text-white/40">Institutional disorder detected. Executive Reporting is required.</p>
          <a href="/diagnostics/executive-reporting" className="mt-2 inline-flex items-center gap-1 font-mono text-[7px] uppercase tracking-[0.2em] text-red-300/70 hover:text-red-200">
            Escalate <ArrowRight className="h-3 w-3" />
          </a>
        </motion.div>
      )}
    </div>
  );
}

/* ---- Critical Path ---- */

function CriticalPath({ domains }: { domains: EnterpriseDomain[] }) {
  if (domains.length === 0) return null;
  const ranked = domains.map((d) => {
    const composite = domainHealth(d);
    const cascadeRisk = Math.round((100 - composite) * 1.4);
    return { label: d.label || "Unnamed", composite, cascadeRisk };
  }).sort((a, b) => b.cascadeRisk - a.cascadeRisk);

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">Critical Path Analysis</div>
      <div className="space-y-2">
        {ranked.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-white/20">{i + 1}.</span>
              <span className="text-[11px] text-white/55">{d.label}</span>
            </div>
            <span className={cn("font-mono text-[9px]",
              d.cascadeRisk >= 60 ? "text-red-400/70" : d.cascadeRisk >= 35 ? "text-amber-400/70" : "text-white/35")}>
              {d.cascadeRisk} risk
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Board Summary ---- */

function BoardSummary({ domains }: { domains: EnterpriseDomain[] }) {
  if (domains.length === 0) return null;
  const { posture } = computePosture(domains);
  const weakest = [...domains].sort((a, b) => domainHealth(a) - domainHealth(b))[0]!;
  const avgExposure = Math.round(domains.reduce((s, d) => s + d.exposure, 0) / domains.length);

  const lines = [
    `The institution is currently classified as ${posture}${posture === "ORDERED" ? ", indicating structural coherence across governance and execution." : ", indicating structural misalignment that requires attention."}`,
    `The weakest domain is ${weakest.label || "unnamed"} (health ${domainHealth(weakest)}%), where intervention priority is highest.`,
    `Average exposure across domains is ${avgExposure}%${avgExposure >= 70 ? " — this represents material institutional risk." : "."}`,
  ];

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">Board-Ready Summary</div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-[11px] leading-relaxed text-white/45">{line}</p>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function EnterpriseAssessmentSuite() {
  const [email, setEmail] = React.useState("");
  const [organisation, setOrganisation] = React.useState("");
  const [domains, setDomains] = React.useState<EnterpriseDomain[]>([
    { label: "Strategy", authority: 68, governance: 61, clarity: 72, execution: 54, trust: 63, exposure: 70 },
    { label: "Operations", authority: 49, governance: 52, clarity: 50, execution: 41, trust: 46, exposure: 78 },
    { label: "Governance", authority: 58, governance: 44, clarity: 59, execution: 52, trust: 48, exposure: 69 },
  ]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  function updateDomain(index: number, key: keyof EnterpriseDomain, value: string | number) {
    setDomains((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function addDomain() {
    setDomains((prev) => [
      ...prev,
      { label: "", authority: 50, governance: 50, clarity: 50, execution: 50, trust: 50, exposure: 50 },
    ]);
  }

  function removeDomain(index: number) {
    setDomains((prev) => prev.filter((_, i) => i !== index));
  }

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/assessments/enterprise/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organisation, domains }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || "Failed to run enterprise assessment.");
      setResult(json);
      try {
        const prior = sessionStorage.getItem("enterprise-assessment-result");
        if (prior) sessionStorage.setItem("enterprise-assessment-prior", prior);
        sessionStorage.setItem("enterprise-assessment-result", JSON.stringify(json));
      } catch { /* SSR */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] text-white/90 outline-none placeholder:text-white/20 transition focus:border-amber-500/30 focus:bg-white/[0.05]";

  return (
    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">

      {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Identity */}
        <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-black/40 backdrop-blur-sm">
          <div className="p-6">
            <Eyebrow>Submission details</Eyebrow>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/30">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institution.com" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/30">Organisation</label>
                <input value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Firm or institution" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Domain cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Domain mapping</Eyebrow>
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/22">
              {domains.length} {domains.length === 1 ? "domain" : "domains"} — click to expand
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {domains.map((domain, i) => (
              <DomainCard
                key={i}
                domain={domain}
                index={i}
                onUpdate={(key, value) => updateDomain(i, key, value)}
                onRemove={() => removeDomain(i)}
                canRemove={domains.length > 1}
              />
            ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={addDomain}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/[0.09] py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 transition hover:border-white/[0.16] hover:text-white/50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add domain
          </button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-[14px] border border-red-400/20 bg-red-500/[0.07] px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400/80" />
              <span className="text-sm text-red-300/80">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className={cn(
            "group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-[14px] px-6 py-4",
            "font-mono text-[10px] uppercase tracking-[0.24em] transition-all duration-300",
            loading ? "cursor-not-allowed bg-amber-500/40 text-black/60" : "bg-amber-500 text-black hover:bg-amber-400",
          )}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Processing enterprise data…</>
          ) : (
            <><ShieldCheck className="h-4 w-4" />Run enterprise assessment<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </button>

        <AnimatePresence>
          {result && <ResultPanel result={result} />}
        </AnimatePresence>
      </div>

      {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
      <div className="space-y-5 xl:sticky xl:top-24">
        {/* Why this layer */}
        <div className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.02]">
          <div className="p-5">
            <Eyebrow>Why this layer exists</Eyebrow>
            <div className="mt-4 space-y-3 text-sm leading-[1.8] text-white/45">
              <p>
                Some problems are not team-sized. Enterprise assessment exists for
                system-wide disorder, portfolio-level friction, and cross-domain
                escalation logic.
              </p>
              <p>
                The map shows where authority, trust, governance, and execution
                are failing across the wider institution — not just in one function
                or one reporting line.
              </p>
            </div>
          </div>
        </div>

        {/* Live system readout */}
        <SystemReadout domains={domains} />

        {/* Posture Matrix */}
        <PostureMatrix domains={domains} />

        {/* Critical Path */}
        <CriticalPath domains={domains} />

        {/* Board Summary */}
        <BoardSummary domains={domains} />
      </div>
    </div>
  );
}