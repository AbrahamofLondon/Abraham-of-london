// components/assessments/TeamAssessmentSuite.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

type TeamRow = {
  teamName: string;
  respondents: number;
  authorityClarity: number;
  executionTrust: number;
  operatingFriction: number;
  strategicCoherence: number;
};

const METRICS: Array<{ key: keyof TeamRow; label: string; inverse?: boolean }> = [
  { key: "authorityClarity", label: "Authority clarity" },
  { key: "executionTrust", label: "Execution trust" },
  { key: "operatingFriction", label: "Operating friction", inverse: true },
  { key: "strategicCoherence", label: "Strategic coherence" },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Rule() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
  );
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

/** Horizontal score bar with animated fill */
function ScoreBar({
  value,
  inverse = false,
  size = "sm",
}: {
  value: number;
  inverse?: boolean;
  size?: "sm" | "md";
}) {
  const health = inverse ? 100 - value : value;
  const color =
    health >= 65
      ? "bg-emerald-500/70"
      : health >= 40
        ? "bg-amber-500/70"
        : "bg-red-500/60";

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/[0.06]",
        size === "sm" ? "h-1" : "h-1.5",
      )}
    >
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

/** Single number input with label and score bar */
function MetricInput({
  label,
  value,
  inverse,
  onChange,
}: {
  label: string;
  value: number;
  inverse?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[7.5px] uppercase tracking-[0.22em] text-white/32">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-[9px] tabular-nums",
            (inverse ? 100 - value : value) >= 65
              ? "text-emerald-400/80"
              : (inverse ? 100 - value : value) >= 40
                ? "text-amber-400/80"
                : "text-red-400/80",
          )}
        >
          {value}
        </span>
      </div>
      <ScoreBar value={value} inverse={inverse} />
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-amber-500"
      />
    </div>
  );
}

/** Team row card */
function TeamCard({
  row,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  row: TeamRow;
  index: number;
  onUpdate: (key: keyof TeamRow, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const health = Math.round(
    (row.authorityClarity +
      row.executionTrust +
      (100 - row.operatingFriction) +
      row.strategicCoherence) /
      4,
  );

  const healthLabel =
    health >= 65 ? "Ordered" : health >= 40 ? "Drifting" : "Misaligned";
  const healthColor =
    health >= 65
      ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300/80"
      : health >= 40
        ? "border-amber-500/20 bg-amber-500/[0.07] text-amber-300/80"
        : "border-red-400/20 bg-red-500/[0.07] text-red-300/80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-black/40 backdrop-blur-sm"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] font-mono text-[9px] text-white/30">
              {String(index + 1).padStart(2, "0")}
            </div>
            <input
              value={row.teamName}
              onChange={(e) => onUpdate("teamName", e.target.value)}
              placeholder="Team name"
              className="min-w-0 flex-1 bg-transparent font-serif text-lg text-white/90 outline-none placeholder:text-white/20 focus:text-white"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.20em]",
                healthColor,
              )}
            >
              {healthLabel}
            </div>

            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.06] text-white/25 transition hover:border-red-400/20 hover:bg-red-500/[0.07] hover:text-red-300/70"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Respondents */}
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[7.5px] uppercase tracking-[0.22em] text-white/28">
            Respondents
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdate("respondents", Math.max(1, row.respondents - 1))}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-sm text-white/80">
              {row.respondents}
            </span>
            <button
              type="button"
              onClick={() => onUpdate("respondents", row.respondents + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
            >
              +
            </button>
          </div>
        </div>

        {/* Metric sliders */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {METRICS.map((m) => (
            <MetricInput
              key={m.key}
              label={m.label}
              value={row[m.key] as number}
              inverse={m.inverse}
              onChange={(v) => onUpdate(m.key, v)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Live variance readout panel */
function VariancePanel({ rows }: { rows: TeamRow[] }) {
  const filled = rows.filter((r) => r.teamName.trim());

  if (filled.length < 2) {
    return (
      <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 text-center">
        <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/22">
          Variance readout
        </div>
        <p className="mt-3 text-xs text-white/28">
          Add at least two named teams to see live variance.
        </p>
      </div>
    );
  }

  const metric = (key: keyof TeamRow) => {
    const vals = filled.map((r) => r[key] as number);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = Math.round(Math.max(...vals) - Math.min(...vals));
    return { avg: Math.round(avg), variance };
  };

  const metrics = METRICS.map((m) => ({
    ...m,
    ...metric(m.key),
  }));

  const maxVariance = Math.max(...metrics.map((m) => m.variance));
  const criticalMetric = metrics.find((m) => m.variance === maxVariance);

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30">
          Live variance readout
        </div>

        <div className="mt-4 space-y-3.5">
          {metrics.map((m) => {
            const isHigh = m.variance >= 25;
            return (
              <div key={String(m.key)}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.20em] text-white/35">
                    {m.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-white/45">avg {m.avg}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em]",
                        isHigh
                          ? "bg-red-500/[0.10] text-red-300/80"
                          : "bg-white/[0.04] text-white/30",
                      )}
                    >
                      Δ {m.variance}
                    </span>
                  </div>
                </div>
                <ScoreBar value={m.avg} inverse={m.inverse} size="md" />
              </div>
            );
          })}
        </div>
      </div>

      {criticalMetric && criticalMetric.variance >= 20 && (
        <div className="flex items-start gap-3 rounded-[16px] border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
          <div>
            <div className="font-mono text-[7.5px] uppercase tracking-[0.22em] text-amber-400/70">
              High variance detected
            </div>
            <div className="mt-1 text-xs leading-relaxed text-white/50">
              {criticalMetric.label} shows a {criticalMetric.variance}-point spread across
              teams — a signal of misalignment rather than consistent drift.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Statistical helpers ---- */

const BENCHMARKS: Record<string, number> = {
  authorityClarity: 62, executionTrust: 58, operatingFriction: 45, strategicCoherence: 55,
};

function stddev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
}

function computeAdvancedMetrics(rows: TeamRow[]) {
  const filled = rows.filter((r) => r.teamName.trim());
  if (filled.length < 2) return null;

  const metricStddevs = METRICS.map((m) => {
    const vals = filled.map((r) => r[m.key] as number);
    return stddev(vals);
  });
  const varianceIndex = Math.round(metricStddevs.reduce((a, b) => a + b, 0) / metricStddevs.length);

  const leadership = filled[0]!;
  const otherTeams = filled.slice(1);
  const meanTrust = otherTeams.reduce((s, r) => s + r.executionTrust, 0) / otherTeams.length;
  const trustGap = Math.round(Math.abs(leadership.executionTrust - meanTrust));

  const healths = filled.map((r) =>
    Math.round((r.authorityClarity + r.executionTrust + (100 - r.operatingFriction) + r.strategicCoherence) / 4),
  );
  const executionCoherence = Math.max(0, Math.round(100 - stddev(healths)));

  const metricAvgs = Object.fromEntries(
    METRICS.map((m) => [m.key, Math.round(filled.reduce((s, r) => s + (r[m.key] as number), 0) / filled.length)]),
  );

  return { varianceIndex, trustGap, executionCoherence, metricAvgs };
}

function generateNarrative(adv: NonNullable<ReturnType<typeof computeAdvancedMetrics>>): string {
  const parts: string[] = [];
  if (adv.varianceIndex > 30) {
    parts.push(`Team alignment shows significant divergence (variance index ${adv.varianceIndex}), indicating systemic misalignment rather than localised drift.`);
  } else if (adv.varianceIndex > 15) {
    parts.push(`Moderate variance detected across teams (index ${adv.varianceIndex}). Some divergence is expected, but attention is needed before it compounds.`);
  } else {
    parts.push(`Teams are operating with reasonable consistency (variance index ${adv.varianceIndex}).`);
  }
  if (adv.trustGap > 25) {
    parts.push(`A ${adv.trustGap}-point trust gap between leadership and teams signals a dangerous perception disconnect.`);
  } else if (adv.trustGap > 10) {
    parts.push(`The ${adv.trustGap}-point trust gap warrants monitoring.`);
  }
  return parts.join(" ");
}

/* ---- Radar chart panel ---- */

function RadarPanel({ rows }: { rows: TeamRow[] }) {
  const filled = rows.filter((r) => r.teamName.trim());
  if (filled.length < 1) return null;

  const data = METRICS.map((m) => {
    const entry: Record<string, string | number> = { metric: m.label };
    filled.forEach((r, i) => { entry[`team${i}`] = r[m.key] as number; });
    return entry;
  });

  const fills = ["#f59e0b", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];
  const opacities = [0.4, 0.25, 0.18, 0.12, 0.08];

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">Team Profile Overlay</div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.35)" }} />
          {filled.map((_, i) => (
            <Radar key={i} dataKey={`team${i}`} stroke={fills[i] ?? "#fff"} fill={fills[i] ?? "#fff"}
              fillOpacity={opacities[i] ?? 0.05} strokeWidth={1} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---- Benchmark panel ---- */

function BenchmarkPanel({ rows }: { rows: TeamRow[] }) {
  const adv = computeAdvancedMetrics(rows);
  if (!adv) return null;

  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">vs Platform Average</div>
      <div className="space-y-2.5">
        {METRICS.map((m) => {
          const avg = adv.metricAvgs[m.key as string] ?? 50;
          const bench = BENCHMARKS[m.key as string] ?? 50;
          const delta = avg - bench;
          return (
            <div key={String(m.key)} className="flex items-center justify-between">
              <span className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-white/35">{m.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] text-white/50">{avg}</span>
                {delta > 0 ? <ArrowUp className="h-3 w-3 text-emerald-400/60" /> :
                  delta < 0 ? <ArrowDown className="h-3 w-3 text-red-400/60" /> :
                  <Minus className="h-3 w-3 text-white/20" />}
                <span className={cn("font-mono text-[8px]",
                  delta > 0 ? "text-emerald-400/60" : delta < 0 ? "text-red-400/60" : "text-white/25")}>
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Advanced metrics summary ---- */

function AdvancedMetricsPanel({ rows }: { rows: TeamRow[] }) {
  const adv = computeAdvancedMetrics(rows);
  if (!adv) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/30 mb-3">Advanced Metrics</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Variance Index", value: adv.varianceIndex, warn: adv.varianceIndex > 30 },
            { label: "Trust Gap", value: adv.trustGap, warn: adv.trustGap > 25 },
            { label: "Exec. Coherence", value: adv.executionCoherence, warn: adv.executionCoherence < 60 },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <span className={cn("font-serif text-xl", m.warn ? "text-red-400" : "text-white/70")}>{m.value}</span>
              <div className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/25 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-white/40">{generateNarrative(adv)}</p>
      </div>

      {(adv.varianceIndex > 30 || adv.trustGap > 25) && (
        <div className="flex items-start gap-3 rounded-[16px] border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
          <div>
            <div className="font-mono text-[7.5px] uppercase tracking-[0.22em] text-amber-400/70">Escalation recommended</div>
            <p className="mt-1 text-xs text-white/50">Signal divergence exceeds safe thresholds. Enterprise Assessment is recommended.</p>
            <Link href="/diagnostics/enterprise-assessment"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/80 hover:text-amber-200 transition-colors">
              Proceed to Enterprise Assessment <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Result output panel */
function ResultPanel({ result }: { result: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-[22px] border border-amber-500/20 bg-amber-500/[0.04]"
    >
      <div className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-amber-400/80" />
          <div className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber-300/80">
            Assessment complete
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Organisation", value: result.organisation },
            { label: "Variance index", value: `${result.varianceIndex}%` },
            { label: "Trust gap", value: `${result.trustGap}%` },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[14px] border border-white/[0.06] bg-black/30 p-3.5"
            >
              <div className="font-mono text-[7px] uppercase tracking-[0.22em] text-white/28">
                {item.label}
              </div>
              <div className="mt-2 font-serif text-xl text-white/90">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[14px] border border-amber-500/15 bg-amber-500/[0.06] p-4">
          <div className="font-mono text-[7px] uppercase tracking-[0.22em] text-amber-400/60">
            Recommended next layer
          </div>
          <div className="mt-2 font-serif text-lg text-white/85">
            {result.nextLayer}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function TeamAssessmentSuite() {
  const [email, setEmail] = React.useState("");
  const [organisation, setOrganisation] = React.useState("");
  const [rows, setRows] = React.useState<TeamRow[]>([
    {
      teamName: "Leadership",
      respondents: 6,
      authorityClarity: 72,
      executionTrust: 61,
      operatingFriction: 44,
      strategicCoherence: 68,
    },
    {
      teamName: "Operations",
      respondents: 12,
      authorityClarity: 48,
      executionTrust: 42,
      operatingFriction: 70,
      strategicCoherence: 51,
    },
  ]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  function updateRow(index: number, key: keyof TeamRow, value: string | number) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        teamName: "",
        respondents: 5,
        authorityClarity: 50,
        executionTrust: 50,
        operatingFriction: 50,
        strategicCoherence: 50,
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/assessments/team/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organisation, rows }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || "Failed to run team assessment.");
      setResult(json);
      try { sessionStorage.setItem("team-assessment-result", JSON.stringify(json)); } catch { /* SSR */ }
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
        {/* Identity inputs */}
        <div className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="p-6">
            <Eyebrow>Submission details</Eyebrow>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/30">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.com"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/30">
                  Organisation
                </label>
                <input
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="Firm or institution"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>Team data</Eyebrow>
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/22">
              {rows.length} {rows.length === 1 ? "team" : "teams"}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {rows.map((row, i) => (
              <TeamCard
                key={i}
                row={row}
                index={i}
                onUpdate={(key, value) => updateRow(i, key, value)}
                onRemove={() => removeRow(i)}
                canRemove={rows.length > 1}
              />
            ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={addRow}
            className="group flex w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-white/[0.09] py-3.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/28 transition hover:border-white/[0.16] hover:text-white/50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add team
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
            loading
              ? "cursor-not-allowed bg-amber-500/40 text-black/60"
              : "bg-amber-500 text-black hover:bg-amber-400",
          )}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing team data…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Run team assessment
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {/* Result */}
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
                One leader's perception is not evidence. Team assessment exists
                because institutional misalignment is almost never visible from
                a single vantage point.
              </p>
              <p>
                The question is not whether things feel aligned at the top. The
                question is whether different parts of the institution are reading
                the same reality.
              </p>
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <RadarPanel rows={rows} />

        {/* Live variance */}
        <VariancePanel rows={rows} />

        {/* Advanced metrics (variance index, trust gap, coherence, narrative, escalation) */}
        <AdvancedMetricsPanel rows={rows} />

        {/* Benchmark comparison */}
        <BenchmarkPanel rows={rows} />

        {/* Metric legend */}
        <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.015] p-5">
          <div className="font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/25">
            Metric guide
          </div>
          <div className="mt-4 space-y-3">
            {METRICS.map((m) => (
              <div key={String(m.key)} className="flex items-start gap-3">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/40" />
                <div>
                  <div className="text-[11px] font-medium text-white/55">{m.label}</div>
                  {m.inverse && (
                    <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-white/25">
                      Lower is better
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}