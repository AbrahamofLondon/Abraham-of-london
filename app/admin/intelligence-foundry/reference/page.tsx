// app/admin/intelligence-foundry/reference/page.tsx
// Reference Models — honest display of what exists: illustrative reference
// OGR engine (DOCUMENTATION_ONLY). Not a production decision engine.
// No redirect. No simulation claimed as live.

import Link from "next/link";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";

export const dynamic = "force-dynamic";

const REFERENCE_ENGINE = ENGINE_REGISTRY.find((e) => e.id === "reference-ogr-engine");

const REFERENCE_COLUMNS = [
  {
    key: "RESERVED_CONCEPT",
    label: "Reserved Concept",
    color: "text-white/30",
    border: "border-white/8",
    bg: "bg-white/[0.02]",
    description: "Architecture documented. No callable logic. Illustrative schema only.",
  },
  {
    key: "SIMULATION_ONLY",
    label: "Simulation",
    color: "text-purple-400/60",
    border: "border-purple-500/15",
    bg: "bg-purple-500/[0.04]",
    description: "Logic callable in simulation context. Evidence created. Does not claim live delivery.",
  },
  {
    key: "PILOT_READY",
    label: "Pilot Ready",
    color: "text-violet-400/70",
    border: "border-violet-500/15",
    bg: "bg-violet-500/[0.04]",
    description: "Callable under controlled conditions. Pilot evidence satisfactory. Promotion criteria defined.",
  },
  {
    key: "LIVE_GOVERNED",
    label: "Live Governed",
    color: "text-emerald-400/80",
    border: "border-emerald-500/15",
    bg: "bg-emerald-500/[0.04]",
    description: "Full production. Governed evidence. Admin-owned. Foundry-covered. Only this counts as GREEN.",
  },
];

const ILLUSTRATIVE_COMPARISON = [
  {
    dimension: "Authority Clarity",
    description: "Degree to which decision rights are formally defined and respected",
    reference: "≥ 85 — role-scoped authority matrix in place",
    simulation: "40–60 — partial authority map, informal escalation",
    pilot: "65–79 — authority map formalised, 80% adoption",
    live: "≥ 85 with quarterly review cycle",
  },
  {
    dimension: "Narrative Coherence",
    description: "Consistency of stated purpose, decisions, and observable behaviour",
    reference: "≥ 80 — external narrative matches internal priority signals",
    simulation: "35–55 — surface coherence, internal contradictions unresolved",
    pilot: "60–74 — contradiction delta ≤ 15%",
    live: "≥ 80 with contradiction scan every 30 days",
  },
  {
    dimension: "Intervention Readiness",
    description: "Speed and reliability of escalation-to-action cycle",
    reference: "≥ 75 — decisions convert within 14 days at ≥ 70% rate",
    simulation: "25–45 — escalation path documented but untested",
    pilot: "55–69 — tested escalation, p50 ≤ 21 days",
    live: "≥ 75, p95 ≤ 30 days",
  },
  {
    dimension: "Execution Readiness",
    description: "Resource, authority, and cultural alignment for governed execution",
    reference: "≥ 70 — retainer contract in place, capacity allocated",
    simulation: "20–40 — feasibility assessed, no formal allocation",
    pilot: "50–65 — limited allocation, trial delivery completed",
    live: "≥ 70 with monthly capacity review",
  },
];

export default function ReferenceModelsPage() {
  return (
    <div className="space-y-8 p-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/intelligence-foundry"
          className="text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
        >
          ← Intelligence Foundry
        </Link>
        <div className="flex items-center gap-3 mt-3 mb-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Reference Models · DOCUMENTATION_ONLY
          </p>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase bg-white/5 text-white/30 border border-white/8">
            Not Production
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white/80">Reference Models</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Illustrative benchmarks for organisational maturity comparison.
          These are reference thresholds — not live scoring outputs, not production decisions.
          No callable engine exists behind this page.
        </p>
      </div>

      {/* Engine status card */}
      {REFERENCE_ENGINE && (
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase bg-amber-400/10 text-amber-400/60 border border-amber-400/20 shrink-0 mt-0.5">
              DOCUMENTATION_ONLY
            </span>
            <div>
              <p className="text-sm font-medium text-white/65">{REFERENCE_ENGINE.name}</p>
              <p className="text-xs text-white/30 mt-0.5">v{REFERENCE_ENGINE.version}</p>
            </div>
          </div>
          <p className="text-xs text-white/40 leading-relaxed mb-3">{REFERENCE_ENGINE.description}</p>
          {REFERENCE_ENGINE.limitationReason && (
            <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
              <p className="text-[10px] font-mono uppercase text-white/20 mb-0.5">Engine Status</p>
              <p className="text-xs text-white/30">{REFERENCE_ENGINE.limitationReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Maturity stage overview */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">
          Maturity Stage Reference
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {REFERENCE_COLUMNS.map((col) => (
            <div
              key={col.key}
              className={`rounded-xl border ${col.border} ${col.bg} p-4`}
            >
              <p className={`text-xs font-mono font-semibold mb-1 ${col.color}`}>{col.label}</p>
              <p className="text-[10px] text-white/25 leading-relaxed">{col.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Illustrative comparison table */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">
          Illustrative Thresholds — Not Live Scores
        </p>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-px bg-white/5 text-[10px] font-mono uppercase tracking-wide">
            <div className="px-3 py-2 text-white/30 bg-white/[0.02]">Dimension</div>
            <div className="px-3 py-2 text-white/25 bg-white/[0.02]">Reserved</div>
            <div className="px-3 py-2 text-purple-400/50 bg-white/[0.02]">Simulation</div>
            <div className="px-3 py-2 text-violet-400/60 bg-white/[0.02]">Pilot</div>
            <div className="px-3 py-2 text-emerald-400/70 bg-white/[0.02]">Live Governed</div>
          </div>
          {/* Rows */}
          {ILLUSTRATIVE_COMPARISON.map((row, i) => (
            <div
              key={row.dimension}
              className={`grid grid-cols-5 gap-px text-xs ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}
            >
              <div className="px-3 py-3 border-t border-white/5">
                <p className="text-white/55 font-medium mb-0.5">{row.dimension}</p>
                <p className="text-[10px] text-white/20 leading-relaxed">{row.description}</p>
              </div>
              <div className="px-3 py-3 border-t border-white/5">
                <p className="text-white/25 text-[10px] leading-relaxed">{row.reference}</p>
              </div>
              <div className="px-3 py-3 border-t border-white/5">
                <p className="text-purple-300/40 text-[10px] leading-relaxed">{row.simulation}</p>
              </div>
              <div className="px-3 py-3 border-t border-white/5">
                <p className="text-violet-300/50 text-[10px] leading-relaxed">{row.pilot}</p>
              </div>
              <div className="px-3 py-3 border-t border-white/5">
                <p className="text-emerald-300/60 text-[10px] leading-relaxed">{row.live}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">
          What This Page Is Not
        </p>
        <ul className="space-y-1.5">
          {[
            "Not a callable engine — no scoring logic runs on this page.",
            "Not a live diagnostic — these thresholds are illustrative benchmarks, not outputs from real client data.",
            "Not a product health assessment — use the Product Health Dashboard for real integration status.",
            "Not a governance event audit — use the governance event registry for real EventMaturity classifications.",
            "Not a promotion decision — use the Promotion Workflow for real maturity stage transitions.",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-white/30">
              <span className="text-red-400/40 shrink-0">✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-4">
          <Link href="/admin/intelligence-foundry/product-health" className="text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors">
            Product Health Dashboard →
          </Link>
          <Link href="/admin/intelligence-foundry/promotion" className="text-xs text-white/35 hover:text-white/55 transition-colors">
            Promotion Workflow →
          </Link>
          <Link href="/admin/intelligence-foundry" className="text-xs text-white/25 hover:text-white/45 transition-colors">
            Foundry Hub →
          </Link>
        </div>
      </div>
    </div>
  );
}
