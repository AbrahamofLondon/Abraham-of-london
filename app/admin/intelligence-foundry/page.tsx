// app/admin/intelligence-foundry/page.tsx
import Link from "next/link";
import { MODULE_REGISTRY } from "@/lib/research/module-registry";
import { ModuleStatusBadge } from "@/components/research/ModuleStatusBadge";

export const dynamic = "force-dynamic";

const HUB_MODULES = [
  { id: "scenario-workbench",      label: "Scenario Workbench",      href: "/admin/intelligence-foundry/scenario",          desc: "Run callable engines, lock baselines, compare drift, save runs." },
  { id: "fast-diagnostic-sim",     label: "Fast Diagnostic Simulator", href: "/admin/intelligence-foundry/simulation/fast-diagnostic", desc: "Run the Fast Diagnostic engine with synthetic inputs. Real scoring, formula traces, ResearchRun capture." },
  { id: "strategy-room-sim",       label: "Strategy Room Simulator",   href: "/admin/intelligence-foundry/simulation/strategy-room",   desc: "Dry-run Strategy Room intake scoring: 8-component gate, authority check, decision directive. No intake archived." },
  { id: "boardroom-mode-sim",      label: "Boardroom Mode Simulator",  href: "/admin/intelligence-foundry/simulation/boardroom-mode",  desc: "Dry-run boardroom qualification gate and dossier generation. Calls qualifiesForBoardroom() + generateBoardroomDossier(). No PDF rendered." },
  { id: "research-run-vault",      label: "Research Run Vault",       href: "/admin/intelligence-foundry/runs",              desc: "Complete ledger of all ResearchRuns. Filter, review, export." },
  { id: "content-red-team",        label: "Content Red Team",         href: "/admin/intelligence-foundry/red-team/content",  desc: "Overclaim detection, guarantee language, evidence posture, IP leakage." },
  { id: "security-red-team",       label: "Security Red Team",        href: "/admin/intelligence-foundry/red-team/security", desc: "Route exposure, auth checks, rate-limit presence, manual checklist." },
  { id: "outbound-narrative-range",label: "Outbound Narrative Range", href: "/admin/intelligence-foundry/outbound",          desc: "Validate outbound posts for Facebook, X, and LinkedIn before publish." },
  { id: "content-category-lab",    label: "Content & Category Lab",   href: "/admin/intelligence-foundry/content",           desc: "House style, Contentlayer health, category vocabulary consistency." },
  { id: "market-response-lab",     label: "Market Response Lab",      href: "/admin/intelligence-foundry/market",            desc: "Deterministic copy checks. No invented scores." },
  { id: "engine-testing-range",    label: "Engine Testing Range",     href: "/admin/intelligence-foundry/engines",           desc: "Test engines, capture versions, request adapters for non-callable." },
  { id: "performance-range",       label: "Performance Range",        href: "/admin/intelligence-foundry/performance",       desc: "Safe performance benchmarking: min/avg/p95/max timing for callable engines." },
  { id: "chaos-range",             label: "Chaos Range",              href: "/admin/intelligence-foundry/chaos",             desc: "Fault injection and resilience testing." },
  { id: "data-poisoning-lab",      label: "Data Poisoning Lab",       href: "/admin/intelligence-foundry/data-poisoning",    desc: "Adversarial and corrupted input testing." },
  { id: "foundry-health",          label: "Foundry Health",           href: "/admin/intelligence-foundry/health",            desc: "Real run metrics: velocity, action conversion, dormant modules." },
  { id: "trash-day",               label: "Trash Day",                href: "/admin/intelligence-foundry/trash-day",         desc: "Stale ACTION_REQUIRED and CRITICAL unresolved findings." },
  { id: "reference-models",        label: "Reference Models",         href: "/admin/intelligence-foundry/reference",         desc: "DEMO — Illustrative reference model comparisons only." },
];

export default function IntelligenceFoundryHub() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1">
          Internal Enforcement System
        </p>
        <h1 className="text-xl font-semibold text-white/80">Intelligence Foundry</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          The Foundry surfaces real risks, runs production-representative logic, creates actionable ResearchRuns,
          and protects the brand before exposure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HUB_MODULES.map((mod) => {
          const registryEntry = MODULE_REGISTRY.find((m) => m.id === mod.id);
          const status = registryEntry?.status ?? "PLANNED";

          return (
            <Link
              key={mod.id}
              href={mod.href}
              className="group rounded-xl border border-white/8 bg-white/2 p-4 transition-all hover:border-white/15 hover:bg-white/4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-sm font-medium text-white/70 group-hover:text-white/85 transition-colors">
                  {mod.label}
                </h2>
                <ModuleStatusBadge status={status} />
              </div>
              <p className="text-xs text-white/35">{mod.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/intelligence-foundry/runs" className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">
            View all runs →
          </Link>
          <Link href="/admin/intelligence-foundry/trash-day" className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Trash Day →
          </Link>
          <Link href="/admin/intelligence-foundry/health" className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Health →
          </Link>
          <Link href="/admin/intelligence-foundry/red-team/content" className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Content Red Team →
          </Link>
        </div>
      </div>
    </div>
  );
}
