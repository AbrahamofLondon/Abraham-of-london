// app/admin/intelligence-foundry/page.tsx
// Intelligence Foundry — Admin Command Centre.
// Server component: live CI gate status, health metrics, module summary.

import Link from "next/link";
import { MODULE_REGISTRY } from "@/lib/research/module-registry";
import { ModuleStatusBadge } from "@/components/research/ModuleStatusBadge";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { getProductHealthOverview } from "@/lib/research/product-health/product-health-service";

export const dynamic = "force-dynamic";

// ─── Module hub manifest ──────────────────────────────────────────────────────

const HUB_MODULES = [
  { id: "scenario-workbench",            label: "Scenario Workbench",              href: "/admin/intelligence-foundry/scenario",                                        desc: "Run callable engines, lock baselines, compare drift, save runs." },
  { id: "fast-diagnostic-sim",           label: "Fast Diagnostic Simulator",       href: "/admin/intelligence-foundry/simulation/fast-diagnostic",                     desc: "Run the Fast Diagnostic engine with synthetic inputs. Real scoring, formula traces, ResearchRun capture." },
  { id: "strategy-room-sim",             label: "Strategy Room Simulator",         href: "/admin/intelligence-foundry/simulation/strategy-room",                       desc: "Dry-run Strategy Room intake scoring: 8-component gate, authority check, decision directive. No intake archived." },
  { id: "boardroom-mode-sim",            label: "Boardroom Mode Simulator",        href: "/admin/intelligence-foundry/simulation/boardroom-mode",                      desc: "Dry-run boardroom qualification gate and dossier generation. Calls qualifiesForBoardroom() + generateBoardroomDossier(). No PDF rendered." },
  { id: "executive-reporting-sim",       label: "Executive Reporting Simulator",   href: "/admin/intelligence-foundry/simulation/executive-reporting",                 desc: "Dry-run executive intelligence brief generation. Calls buildExecutiveReport(): resonance, HCD delta, OGR manifest, state classification, financial exposure. No data persisted." },
  { id: "er-boardroom-bridge-sim",       label: "ER → Boardroom Bridge",           href: "/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge",   desc: "Proves governed escalation path: Executive Reporting → IntelligenceSpine → Boardroom qualification. Dry-run bridge. No PDF rendered." },
  { id: "report-lineage-sim",            label: "Report Lineage Simulation",       href: "/admin/intelligence-foundry/simulation/report-lineage",                      desc: "Runtime proof of governed product operating architecture. Simulates 7 governance event chains validated against Pass 1 registries." },
  { id: "constitutional-diagnostic-sim", label: "Constitutional Diagnostic",       href: "/admin/intelligence-foundry/simulation/constitutional-diagnostic",           desc: "Interactive 10-question diagnostic using real domain scoring. Returns constitutional route, authority score, coherence score, failure mode count." },
  { id: "research-run-vault",            label: "Research Run Vault",              href: "/admin/intelligence-foundry/runs",                                           desc: "Complete ledger of all ResearchRuns. Filter, review, export." },
  { id: "content-red-team",             label: "Content Red Team",                href: "/admin/intelligence-foundry/red-team/content",                               desc: "Overclaim detection, guarantee language, evidence posture, IP leakage." },
  { id: "security-red-team",            label: "Security Red Team",               href: "/admin/intelligence-foundry/red-team/security",                              desc: "Route exposure, auth checks, rate-limit presence, manual checklist." },
  { id: "outbound-narrative-range",     label: "Outbound Narrative Range",        href: "/admin/intelligence-foundry/outbound",                                       desc: "Validate outbound posts for Facebook, X, and LinkedIn before publish." },
  { id: "content-category-lab",         label: "Content & Category Lab",          href: "/admin/intelligence-foundry/content",                                        desc: "House style, Contentlayer health, category vocabulary consistency." },
  { id: "market-response-lab",          label: "Market Response Lab",             href: "/admin/intelligence-foundry/market",                                         desc: "Deterministic copy checks. Per-finding feedback intake. No invented scores." },
  { id: "engine-testing-range",         label: "Engine Testing Range",            href: "/admin/intelligence-foundry/engines",                                        desc: "Test engines, capture versions, request adapters for non-callable." },
  { id: "performance-range",            label: "Performance Range",               href: "/admin/intelligence-foundry/performance",                                    desc: "Safe performance benchmarking: min/avg/p95/max timing, baseline comparison." },
  { id: "chaos-range",                  label: "Chaos Range",                     href: "/admin/intelligence-foundry/chaos",                                          desc: "Fault injection and resilience testing." },
  { id: "data-poisoning-lab",           label: "Data Poisoning Lab",              href: "/admin/intelligence-foundry/data-poisoning",                                 desc: "Adversarial and corrupted input testing." },
  { id: "boardroom-delivery",           label: "Boardroom Delivery Console",      href: "/admin/boardroom-delivery",                                                  desc: "Generate, approve, deliver, and manage client-facing Boardroom Dossiers. Real delivery pipeline — not simulation." },
  { id: "product-health",              label: "Product Health Dashboard",         href: "/admin/intelligence-foundry/product-health",                                 desc: "Live integration status for the product ladder, admin ownership, canonical records, lineage, governance events, Foundry coverage, and release blockers." },
  { id: "foundry-health",              label: "Foundry Health",                   href: "/admin/intelligence-foundry/health",                                         desc: "Real run metrics: velocity, action conversion, dormant modules." },
  { id: "trash-day",                   label: "Trash Day",                        href: "/admin/intelligence-foundry/trash-day",                                      desc: "Stale ACTION_REQUIRED and CRITICAL unresolved findings." },
  { id: "promotion-workflow",          label: "Promotion Workflow",               href: "/admin/intelligence-foundry/promotion",                                      desc: "Record evidenced maturity stage promotions. Append-only ledger. One step at a time: RESERVED_CONCEPT → SIMULATION_ONLY → PILOT_READY → LIVE_GOVERNED." },
  { id: "reference-models",            label: "Reference Models",                 href: "/admin/intelligence-foundry/reference",                                      desc: "DOCUMENTATION_ONLY — Illustrative reference model comparisons. Not a production decision engine." },
];

// ─── Server component ─────────────────────────────────────────────────────────

export default async function IntelligenceFoundryHub() {
  // Live gate data — fetched server-side on each request
  let criticalUnresolved = 0;
  let totalRuns = 0;
  let productRed = 0;
  let productAmber = 0;
  let productGreen = 0;
  let productGrey = 0;

  try {
    const [metrics, overview] = await Promise.all([
      ResearchRunRepository.getHealthMetrics(),
      Promise.resolve(getProductHealthOverview()),
    ]);
    criticalUnresolved = metrics.criticalUnresolved;
    totalRuns          = metrics.total;
    productRed         = overview.summary.red;
    productAmber       = overview.summary.amber;
    productGreen       = overview.summary.green;
    productGrey        = overview.summary.grey;
  } catch {
    // Non-fatal — gate shows UNKNOWN
  }

  const gateBlocked = criticalUnresolved > 0 || productRed > 0;

  // Module registry stats
  const wired   = MODULE_REGISTRY.filter((m) => m.status === "WIRED").length;
  const partial = MODULE_REGISTRY.filter((m) => m.status === "PARTIAL").length;
  const demo    = MODULE_REGISTRY.filter((m) => m.status === "DEMO").length;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
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

      {/* ── CI Gate Status Banner ──────────────────────────────────────────────── */}
      <div
        className={`rounded-xl border p-4 flex items-start gap-4 ${
          gateBlocked
            ? "border-red-500/25 bg-red-500/[0.06]"
            : "border-emerald-500/20 bg-emerald-500/[0.04]"
        }`}
      >
        <div
          className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${
            gateBlocked ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-mono font-semibold uppercase tracking-wide ${
              gateBlocked ? "text-red-400" : "text-emerald-400"
            }`}
          >
            CI Gate — {gateBlocked ? "BLOCKED" : "CLEAR"}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5">
            {gateBlocked
              ? `${criticalUnresolved} unresolved CRITICAL/HIGH run(s)${productRed > 0 ? ` · ${productRed} RED product surface(s)` : ""}`
              : "No blocking runs or RED product surfaces."}
          </p>
        </div>
        <Link
          href="/api/admin/intelligence-foundry/ci-gate"
          className="shrink-0 text-[10px] font-mono text-white/25 hover:text-white/45 transition-colors"
        >
          POST /ci-gate →
        </Link>
      </div>

      {/* ── Health summary ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Run vault */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Total Runs</p>
          <p className="text-2xl font-mono font-semibold text-white/70">{totalRuns}</p>
        </div>
        <div className={`rounded-xl border p-4 ${criticalUnresolved > 0 ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Unresolved Critical</p>
          <p className={`text-2xl font-mono font-semibold ${criticalUnresolved > 0 ? "text-red-400" : "text-white/70"}`}>
            {criticalUnresolved}
          </p>
        </div>
        {/* Product health */}
        <div className={`rounded-xl border p-4 ${productRed > 0 ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Product Health</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-mono font-semibold ${productGreen > 0 ? "text-emerald-400" : "text-white/30"}`}>{productGreen}G</span>
            <span className={`text-lg font-mono ${productAmber > 0 ? "text-amber-400" : "text-white/20"}`}>{productAmber}A</span>
            <span className={`text-lg font-mono ${productRed > 0 ? "text-red-400" : "text-white/20"}`}>{productRed}R</span>
            <span className="text-lg font-mono text-white/20">{productGrey}?</span>
          </div>
        </div>
        {/* Module status */}
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Modules</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-semibold text-emerald-400/80">{wired}</span>
            <span className="text-[10px] text-white/30 font-mono">wired</span>
            <span className="text-lg font-mono text-amber-400/60 ml-1">{partial}</span>
            <span className="text-[10px] text-white/30 font-mono">partial</span>
            {demo > 0 && (
              <>
                <span className="text-lg font-mono text-white/25 ml-1">{demo}</span>
                <span className="text-[10px] text-white/20 font-mono">demo</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Module grid ───────────────────────────────────────────────────────── */}
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

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Quick Actions</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/admin/intelligence-foundry/runs"             className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors">View all runs →</Link>
          <Link href="/admin/intelligence-foundry/promotion"        className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors">Promotion workflow →</Link>
          <Link href="/admin/intelligence-foundry/product-health"   className="text-xs text-white/40 hover:text-white/60 transition-colors">Product health →</Link>
          <Link href="/admin/intelligence-foundry/trash-day"        className="text-xs text-white/40 hover:text-white/60 transition-colors">Trash Day →</Link>
          <Link href="/admin/intelligence-foundry/health"           className="text-xs text-white/40 hover:text-white/60 transition-colors">Foundry health →</Link>
          <Link href="/admin/intelligence-foundry/red-team/content" className="text-xs text-white/40 hover:text-white/60 transition-colors">Content Red Team →</Link>
          <Link href="/admin/intelligence-foundry/scenario"         className="text-xs text-white/40 hover:text-white/60 transition-colors">Scenario workbench →</Link>
        </div>
      </div>
    </div>
  );
}
