// components/assessments/TeamAssessmentSuite.tsx
// Design: Institutional Monumentalism
// Changes from v1:
// - "use client" removed (Pages Router)
// - All rounded-* → sharp panel system
// - amber-500 → #C9A96E softGold throughout
// - rounded-full badges → sharp pills
// - ScoreBar: rounded-full → sharp, amber → platform colours
// - TeamCard: rounded-[22px] → sharp border system
// - Submit button: amber-500 fill → platform sharp CTA
// - ResultPanel: rounded-[22px] → sharp, amber tints → softGold

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp,
  CheckCircle2, Loader2, Minus, ShieldCheck, Trash2,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import Link from "next/link";

const GOLD = "#C9A96E";
const LIFT = "rgb(10 14 20)";

type TeamRow = {
  teamName: string; respondents: number;
  authorityClarity: number; executionTrust: number;
  operatingFriction: number; strategicCoherence: number;
};

const METRICS: Array<{ key: keyof TeamRow; label: string; inverse?: boolean }> = [
  { key: "authorityClarity",   label: "Authority clarity" },
  { key: "executionTrust",     label: "Execution trust" },
  { key: "operatingFriction",  label: "Operating friction", inverse: true },
  { key: "strategicCoherence", label: "Strategic coherence" },
];

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
  const filled = rows.filter(r => r.teamName.trim());
  if (filled.length < 2) return null;
  const metricStddevs = METRICS.map(m => stddev(filled.map(r => r[m.key] as number)));
  const varianceIndex = Math.round(metricStddevs.reduce((a, b) => a + b, 0) / metricStddevs.length);
  const leadership = filled[0]!;
  const otherTeams = filled.slice(1);
  const meanTrust  = otherTeams.reduce((s, r) => s + r.executionTrust, 0) / otherTeams.length;
  const trustGap   = Math.round(Math.abs(leadership.executionTrust - meanTrust));
  const healths    = filled.map(r => Math.round((r.authorityClarity + r.executionTrust + (100 - r.operatingFriction) + r.strategicCoherence) / 4));
  const executionCoherence = Math.max(0, Math.round(100 - stddev(healths)));
  const metricAvgs = Object.fromEntries(METRICS.map(m => [m.key, Math.round(filled.reduce((s, r) => s + (r[m.key] as number), 0) / filled.length)]));
  return { varianceIndex, trustGap, executionCoherence, metricAvgs };
}

function generateNarrative(adv: NonNullable<ReturnType<typeof computeAdvancedMetrics>>): string {
  const parts: string[] = [];
  if (adv.varianceIndex > 30) parts.push(`Team alignment shows significant divergence (variance index ${adv.varianceIndex}), indicating systemic misalignment rather than localised drift.`);
  else if (adv.varianceIndex > 15) parts.push(`Moderate variance detected across teams (index ${adv.varianceIndex}). Attention is needed before it compounds.`);
  else parts.push(`Teams are operating with reasonable consistency (variance index ${adv.varianceIndex}).`);
  if (adv.trustGap > 25) parts.push(`A ${adv.trustGap}-point trust gap between leadership and teams signals a dangerous perception disconnect.`);
  else if (adv.trustGap > 10) parts.push(`The ${adv.trustGap}-point trust gap warrants monitoring.`);
  return parts.join(" ");
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.38em", textTransform: "uppercase", color: `${GOLD}BB` }}>{children}</span>
    </div>
  );
}

function ScoreBar({ value, inverse = false, size = "sm" }: { value: number; inverse?: boolean; size?: "sm" | "md" }) {
  const health = inverse ? 100 - value : value;
  const barColor = health >= 65 ? "rgba(110,231,183,0.65)" : health >= 40 ? `${GOLD}80` : "rgba(252,165,165,0.65)";
  return (
    <div style={{ width: "100%", overflow: "hidden", height: size === "sm" ? "2px" : "3px", backgroundColor: "rgba(255,255,255,0.06)" }}>
      <motion.div style={{ height: "100%", backgroundColor: barColor }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
    </div>
  );
}

function MetricInput({ label, value, inverse, onChange }: { label: string; value: number; inverse?: boolean; onChange: (v: number) => void }) {
  const health = inverse ? 100 - value : value;
  const valColor = health >= 65 ? "rgba(110,231,183,0.80)" : health >= 40 ? `${GOLD}BB` : "rgba(252,165,165,0.80)";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", color: valColor }}>{value}</span>
      </div>
      <ScoreBar value={value} inverse={inverse} />
      <input type="range" min={0} max={100} step={1} value={value} onChange={e => onChange(Number(e.target.value))} style={{ height: "2px", width: "100%", cursor: "pointer", accentColor: GOLD }} />
    </div>
  );
}

function TeamCard({ row, index, onUpdate, onRemove, canRemove }: { row: TeamRow; index: number; onUpdate: (key: keyof TeamRow, value: string | number) => void; onRemove: () => void; canRemove: boolean }) {
  const health = Math.round((row.authorityClarity + row.executionTrust + (100 - row.operatingFriction) + row.strategicCoherence) / 4);
  const healthLabel = health >= 65 ? "Ordered" : health >= 40 ? "Drifting" : "Misaligned";
  const hc = health >= 65 ? { border: "rgba(110,231,183,0.22)", bg: "rgba(110,231,183,0.05)", text: "rgba(110,231,183,0.80)" } : health >= 40 ? { border: `${GOLD}28`, bg: `${GOLD}07`, text: `${GOLD}CC` } : { border: "rgba(252,165,165,0.22)", bg: "rgba(252,165,165,0.05)", text: "rgba(252,165,165,0.80)" };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35 }} style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
      <div style={{ padding: "1.25rem 1.5rem" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div style={{ flexShrink: 0, width: "28px", height: "28px", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.25)" }}>{String(index + 1).padStart(2, "0")}</div>
            <input value={row.teamName} onChange={e => onUpdate("teamName", e.target.value)} placeholder="Team name" style={{ flex: 1, minWidth: 0, background: "transparent", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.10rem", color: "rgba(255,255,255,0.85)", outline: "none", border: "none" }} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span style={{ padding: "2px 10px", border: `1px solid ${hc.border}`, backgroundColor: hc.bg, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: hc.text }}>{healthLabel}</span>
            {canRemove && (
              <button type="button" onClick={onRemove} style={{ width: "28px", height: "28px", flexShrink: 0, border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.22)", transition: "all 200ms ease" }} onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(252,165,165,0.22)"; el.style.color = "rgba(252,165,165,0.70)"; }} onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.color = "rgba(255,255,255,0.22)"; }}>
                <Trash2 style={{ width: "12px", height: "12px" }} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>Respondents</span>
          <div className="flex items-center gap-2">
            {(["−", "+"] as const).map(sym => (
              <button key={sym} type="button" onClick={() => onUpdate("respondents", sym === "−" ? Math.max(1, row.respondents - 1) : row.respondents + 1)} style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", transition: "all 180ms ease" }} onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}30`; el.style.color = `${GOLD}AA`; }} onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.40)"; }}>{sym}</button>
            ))}
            <span style={{ width: "28px", textAlign: "center", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", color: "rgba(255,255,255,0.70)" }}>{row.respondents}</span>
          </div>
        </div>
        <div className="grid gap-4 mt-5 sm:grid-cols-2">
          {METRICS.map(m => <MetricInput key={m.key} label={m.label} value={row[m.key] as number} inverse={m.inverse} onChange={v => onUpdate(m.key, v)} />)}
        </div>
      </div>
    </motion.div>
  );
}

function VariancePanel({ rows }: { rows: TeamRow[] }) {
  const filled = rows.filter(r => r.teamName.trim());
  if (filled.length < 2) return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
      <Eyebrow>Variance readout</Eyebrow>
      <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Add at least two named teams to see live variance.</p>
    </div>
  );
  const metric = (key: keyof TeamRow) => { const vals = filled.map(r => r[key] as number); return { avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), variance: Math.round(Math.max(...vals) - Math.min(...vals)) }; };
  const metrics = METRICS.map(m => ({ ...m, ...metric(m.key) }));
  const maxV = Math.max(...metrics.map(m => m.variance));
  const critical = metrics.find(m => m.variance === maxV);
  return (
    <div className="space-y-3">
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
        <Eyebrow>Live variance readout</Eyebrow>
        <div className="mt-4 space-y-4">
          {metrics.map(m => (
            <div key={String(m.key)}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>{m.label}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.40)" }}>avg {m.avg}</span>
                  <span style={{ padding: "1px 6px", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: m.variance >= 25 ? "rgba(252,165,165,0.80)" : "rgba(255,255,255,0.28)", border: `1px solid ${m.variance >= 25 ? "rgba(252,165,165,0.20)" : "rgba(255,255,255,0.06)"}` }}>Δ {m.variance}</span>
                </div>
              </div>
              <ScoreBar value={m.avg} inverse={m.inverse} size="md" />
            </div>
          ))}
        </div>
      </div>
      {critical && critical.variance >= 20 && (
        <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <AlertTriangle style={{ width: "12px", height: "12px", color: `${GOLD}90`, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.40rem" }}>High variance detected</div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60, color: "rgba(255,255,255,0.50)" }}>{critical.label} shows a {critical.variance}-point spread — a signal of misalignment rather than consistent drift.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RadarPanel({ rows }: { rows: TeamRow[] }) {
  const filled = rows.filter(r => r.teamName.trim());
  if (filled.length < 1) return null;
  const data = METRICS.map(m => { const e: Record<string, string | number> = { metric: m.label }; filled.forEach((r, i) => { e[`team${i}`] = r[m.key] as number; }); return e; });
  const strokes = [`${GOLD}`, "rgba(148,163,184,0.80)", "rgba(110,231,183,0.70)", "rgba(252,165,165,0.70)", "rgba(255,255,255,0.50)"];
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
      <Eyebrow>Team profile overlay</Eyebrow>
      <div style={{ marginTop: "1rem" }}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 7, fill: "rgba(255,255,255,0.30)", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }} />
            {filled.map((_, i) => <Radar key={i} dataKey={`team${i}`} stroke={strokes[i] ?? "rgba(255,255,255,0.40)"} fill={strokes[i] ?? "rgba(255,255,255,0.40)"} fillOpacity={[0.18, 0.10, 0.08, 0.06, 0.04][i] ?? 0.04} strokeWidth={1.5} />)}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BenchmarkPanel({ rows }: { rows: TeamRow[] }) {
  const adv = computeAdvancedMetrics(rows);
  if (!adv) return null;
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
      <Eyebrow>vs Platform average</Eyebrow>
      <div className="mt-4 space-y-3">
        {METRICS.map(m => {
          const avg = adv.metricAvgs[m.key as string] ?? 50; const bench = BENCHMARKS[m.key as string] ?? 50; const delta = avg - bench;
          const D = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
          const dc = delta > 0 ? "rgba(110,231,183,0.70)" : delta < 0 ? "rgba(252,165,165,0.70)" : "rgba(255,255,255,0.20)";
          return (
            <div key={String(m.key)} className="flex items-center justify-between">
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{m.label}</span>
              <div className="flex items-center gap-1.5">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: "rgba(255,255,255,0.45)" }}>{avg}</span>
                <D style={{ width: "10px", height: "10px", color: dc }} />
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: dc }}>{delta > 0 ? "+" : ""}{delta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdvancedMetricsPanel({ rows }: { rows: TeamRow[] }) {
  const adv = computeAdvancedMetrics(rows);
  if (!adv) return null;
  return (
    <div className="space-y-3">
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
        <Eyebrow>Advanced metrics</Eyebrow>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[{ label: "Variance index", value: adv.varianceIndex, warn: adv.varianceIndex > 30 }, { label: "Trust gap", value: adv.trustGap, warn: adv.trustGap > 25 }, { label: "Exec. coherence", value: adv.executionCoherence, warn: adv.executionCoherence < 60 }].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.8rem", lineHeight: 1, color: m.warn ? "rgba(252,165,165,0.85)" : "rgba(255,255,255,0.70)" }}>{m.value}</div>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginTop: "4px" }}>{m.label}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "1rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.38)" }}>{generateNarrative(adv)}</p>
      </div>
      {(adv.varianceIndex > 30 || adv.trustGap > 25) && (
        <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <AlertTriangle style={{ width: "12px", height: "12px", color: `${GOLD}90`, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.40rem" }}>Escalation recommended</div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60, color: "rgba(255,255,255,0.50)", marginBottom: "0.65rem" }}>Signal divergence exceeds safe thresholds. Enterprise Assessment is the appropriate next layer.</p>
            <Link href="/diagnostics/enterprise-assessment" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Enterprise Assessment <ArrowRight style={{ width: "10px", height: "10px" }} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function deriveTeamCondition(vi: number, tg: number): { label: string; color: string; reading: string } {
  if (vi > 30 || tg > 25) return { label: "MISALIGNED", color: "rgba(252,165,165,0.80)", reading: "Significant structural divergence across teams. This is not a communication issue — it is a systemic misalignment that will compound under pressure." };
  if (vi > 15 || tg > 10) return { label: "DRIFTING", color: `${GOLD}CC`, reading: "Moderate variance detected. Teams are not yet in crisis, but the gap between leadership perception and operational reality is widening." };
  return { label: "ALIGNED", color: "rgba(110,231,183,0.75)", reading: "Teams are operating with reasonable consistency. Monitor for early drift signals before they become structural." };
}

function deriveTeamNextAction(vi: number, tg: number, af: number): string {
  if (tg > 25) return "Conduct a trust calibration exercise between leadership and operational teams within 14 days. The perception gap is large enough to cause execution failure under pressure.";
  if (vi > 30) return "Map the specific points of divergence across teams. Identify whether the root is authority confusion, resource asymmetry, or conflicting mandates.";
  if (af > 65) return "Reduce operating friction before attempting alignment work. High friction makes every other intervention slower and less effective.";
  if (vi > 15) return "Schedule a structured cross-team alignment session focused on where perceptions differ — not whether they should.";
  return "Continue monitoring. Current alignment is within acceptable bounds. Reassess if conditions change.";
}

function ResultPanel({ result, rows }: { result: Record<string, unknown>; rows: TeamRow[] }) {
  const vi = Number(result.varianceIndex ?? 0);
  const tg = Number(result.trustGap ?? 0);
  const af = Number(result.avgFriction ?? 0);
  const condition = deriveTeamCondition(vi, tg);
  const adv = computeAdvancedMetrics(rows);
  const narrative = adv ? generateNarrative(adv) : "";
  const nextAction = deriveTeamNextAction(vi, tg, af);
  const nextLayer = String(result.nextLayer === "EXECUTIVE_REPORTING" ? "Executive Reporting" : result.nextLayer === "CONSTITUTIONAL" ? "Constitutional Diagnostic" : result.nextLayer ?? "Enterprise Assessment");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.50 }} className="space-y-4">
      {/* Condition */}
      <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}08`, padding: "1.5rem" }}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}BB` }}>Team assessment complete</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, color: condition.color }}>
              {condition.label}
            </div>
            <div style={{ marginTop: "0.4rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              {String(result.organisation ?? "—")}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: "Variance", value: `${vi}%` }, { label: "Trust gap", value: `${tg}%` }, { label: "Friction", value: `${af}%` }].map(item => (
              <div key={item.label} style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{item.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.75)", marginTop: "2px" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}>
          <Eyebrow>Structural reading</Eyebrow>
        </div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.72, color: "rgba(255,255,255,0.65)" }}>
            {condition.reading}
          </p>
          {narrative && (
            <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.72, color: "rgba(255,255,255,0.50)" }}>
              {narrative}
            </p>
          )}
        </div>
      </div>

      {/* Next action */}
      <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1.25rem 1.5rem" }}>
        <Eyebrow>Recommended action</Eyebrow>
        <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.72, color: "rgba(255,255,255,0.70)" }}>
          {nextAction}
        </p>
      </div>

      {/* Escalation */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem 1.5rem" }}>
        <Eyebrow>Next layer</Eyebrow>
        <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic", marginBottom: "1rem" }}>
          {nextLayer === "Executive Reporting"
            ? "The team signal warrants deeper interpretation. Executive Reporting translates this into financial exposure and a governed priority stack."
            : "Team alignment is within bounds. The Constitutional Diagnostic can test whether the institutional structure matches."}
        </p>
        <Link
          href={nextLayer === "Executive Reporting" ? "/diagnostics/executive-reporting" : "/diagnostics/constitutional-diagnostic"}
          className="group inline-flex items-center gap-2 transition-all duration-300"
          style={{ padding: "10px 20px", border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}0D`, color: `${GOLD}BB`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          Continue to {nextLayer} <ArrowRight style={{ width: "11px", height: "11px" }} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function TeamAssessmentSuite() {
  const [email, setEmail] = React.useState("");
  const [organisation, setOrganisation] = React.useState("");
  const [rows, setRows] = React.useState<TeamRow[]>([
    { teamName: "Leadership", respondents: 6, authorityClarity: 72, executionTrust: 61, operatingFriction: 44, strategicCoherence: 68 },
    { teamName: "Operations", respondents: 12, authorityClarity: 48, executionTrust: 42, operatingFriction: 70, strategicCoherence: 51 },
  ]);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Record<string, unknown> | null>(null);
  const [error, setError] = React.useState("");

  // Diagnostic reflection fields — each has a bound downstream consumer
  const [teamReflections, setTeamReflections] = React.useState({
    /** Pre-assessment: baseline confidence. Consumer: contradiction severity = confidence - measuredGap */
    confidenceBaseline: 70,
    /** Post-data: what leadership assumes wrong. Consumer: explains WHAT the gap is about */
    falseAssumption: "",
    /** Post-data: political sensitivity. Consumer: determines if gap is structural or political */
    showScoresReaction: "",
  });

  function updateRow(index: number, key: keyof TeamRow, value: string | number) { setRows(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row)); }
  function addRow() { setRows(prev => [...prev, { teamName: "", respondents: 5, authorityClarity: 50, executionTrust: 50, operatingFriction: 50, strategicCoherence: 50 }]); }
  function removeRow(index: number) { setRows(prev => prev.filter((_, i) => i !== index)); }

  async function run() {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/assessments/team/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, organisation, rows, reflections: teamReflections }) });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to run team assessment.");
      setResult(json);
      try { sessionStorage.setItem("team-assessment-result", JSON.stringify(json)); } catch {}
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to run."); }
    finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.025)", outline: "none", padding: "10px 13px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.80)", transition: "border-color 250ms ease" };

  return (
    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
      <div className="space-y-5">
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(5 5 7)", padding: "1.5rem" }}>
          <Eyebrow>Submission details</Eyebrow>
          <div className="grid gap-3 mt-5 sm:grid-cols-2">
            {[{ label: "Email", value: email, set: setEmail, placeholder: "you@institution.com", type: "email" }, { label: "Organisation", value: organisation, set: setOrganisation, placeholder: "Firm or institution", type: "text" }].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", marginBottom: "0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.26)" }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }} onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between"><Eyebrow>Team data</Eyebrow><span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{rows.length} {rows.length === 1 ? "team" : "teams"}</span></div>
          <AnimatePresence mode="popLayout">{rows.map((row, i) => <TeamCard key={i} row={row} index={i} onUpdate={(key, value) => updateRow(i, key, value)} onRemove={() => removeRow(i)} canRemove={rows.length > 1} />)}</AnimatePresence>
          <button type="button" onClick={addRow} className="w-full flex items-center justify-center gap-2 transition-all duration-300" style={{ padding: "12px", border: "1px dashed rgba(255,255,255,0.09)", backgroundColor: "transparent", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", cursor: "pointer" }} onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}28`; el.style.color = `${GOLD}80`; }} onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.25)"; }}>+ Add team</button>
        </div>

        {/* Diagnostic reflection — bound to gap interpretation */}
        <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
          <Eyebrow>Diagnostic reflection</Eyebrow>
          <p style={{ marginTop: "0.4rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
            These answers determine what the gap means — not just how large it is.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                Confidence: How confident are you that your team would agree with your data above? (0–100)
              </label>
              <input
                type="range" min={0} max={100}
                value={teamReflections.confidenceBaseline}
                onChange={(e) => setTeamReflections((r) => ({ ...r, confidenceBaseline: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: GOLD }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", color: "rgba(255,255,255,0.22)" }}>
                <span>They would strongly disagree</span>
                <span style={{ color: `${GOLD}80` }}>{teamReflections.confidenceBaseline}%</span>
                <span>They would fully agree</span>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                What is one thing your team would say you don&apos;t understand about their experience?
              </label>
              <textarea
                value={teamReflections.falseAssumption}
                onChange={(e) => setTeamReflections((r) => ({ ...r, falseAssumption: e.target.value }))}
                rows={2} placeholder="Name the assumption. Not the symptom."
                style={{ ...inputStyle, resize: "none" as const }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.4rem" }}>
                What would happen if you showed your team these scores?
              </label>
              <textarea
                value={teamReflections.showScoresReaction}
                onChange={(e) => setTeamReflections((r) => ({ ...r, showScoresReaction: e.target.value }))}
                rows={2} placeholder="Relief? Anger? Surprise? Indifference?"
                style={{ ...inputStyle, resize: "none" as const }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence>{error && (<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ border: "1px solid rgba(252,165,165,0.20)", backgroundColor: "rgba(252,165,165,0.04)", padding: "0.85rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}><AlertTriangle style={{ width: "13px", height: "13px", color: "rgba(252,165,165,0.80)", flexShrink: 0, marginTop: "2px" }} /><span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", color: "rgba(252,165,165,0.85)" }}>{error}</span></motion.div>)}</AnimatePresence>

        <button type="button" onClick={run} disabled={loading} className="w-full inline-flex items-center justify-center gap-3 transition-all duration-300" style={{ padding: "14px 24px", border: `1px solid ${loading ? "rgba(255,255,255,0.06)" : `${GOLD}42`}`, backgroundColor: loading ? "rgba(255,255,255,0.02)" : `${GOLD}10`, color: loading ? "rgba(255,255,255,0.22)" : `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer" }} onMouseEnter={e => { if (!loading) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }} onMouseLeave={e => { if (!loading) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}>
          {loading ? (<><Loader2 style={{ width: "14px", height: "14px" }} /> Processing team data…</>) : (<><ShieldCheck style={{ width: "14px", height: "14px" }} /> Run team assessment <ArrowRight style={{ width: "13px", height: "13px" }} /></>)}
        </button>

        <AnimatePresence>{result && <ResultPanel result={result} rows={rows} />}</AnimatePresence>
      </div>

      <div className="space-y-4 xl:sticky xl:top-24">
        <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
          <Eyebrow>Why this layer exists</Eyebrow>
          <div style={{ marginTop: "0.85rem" }}>
            {["One leader's perception is not evidence. Team assessment exists because institutional misalignment is almost never visible from a single vantage point.", "The question is not whether things feel aligned at the top. The question is whether different parts of the institution are reading the same reality."].map((text, i) => (
              <p key={i} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.75, color: "rgba(255,255,255,0.42)", marginBottom: "0.75rem" }}>{text}</p>
            ))}
          </div>
        </div>
        <RadarPanel rows={rows} />
        <VariancePanel rows={rows} />
        <AdvancedMetricsPanel rows={rows} />
        <BenchmarkPanel rows={rows} />
        <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1.25rem" }}>
          <Eyebrow>Metric guide</Eyebrow>
          <div className="mt-4 space-y-3">
            {METRICS.map(m => (
              <div key={String(m.key)} className="flex items-start gap-3">
                <div style={{ flexShrink: 0, marginTop: "5px", width: "4px", height: "4px", borderRadius: "50%", backgroundColor: `${GOLD}60` }} />
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", color: "rgba(255,255,255,0.55)" }}>{m.label}</div>
                  {m.inverse && <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Lower is better</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}