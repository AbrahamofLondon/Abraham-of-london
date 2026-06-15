/**
 * pages/admin/operator-command-centre/index.tsx
 *
 * Operator Command Centre — the governed operational surface for the entire
 * living-state estate.
 *
 * This surface aggregates living-state signals across the estate. It shows
 * where the system cannot safely infer fulfilment, publication, delivery,
 * verification, consent, access, authority, or readiness.
 *
 * A blocked object is not automatically a failure. It is a governed state
 * requiring evidence, action, repair, or owner review.
 *
 * This is NOT a decorative dashboard. It shows governed operational truth.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { loadLivingStateReports } from "@/lib/living-intelligence/living-state-report-loader";
import { buildOperatorCommandCentreModel } from "@/lib/living-intelligence/operator-command-centre-model";
import type { OperatorCommandCentreModel } from "@/lib/living-intelligence/operator-command-centre-model";

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterKey = "all" | "blocked" | "missing_repair_route" | "unsafe_automation" | "owner_decision" | "user_safe" | "operator_only" | "commercial" | "fulfilment" | "gmi" | "content" | "decision_centre" | "strategy_room" | "retainer_oversight" | "professional";

type Props = {
  model: OperatorCommandCentreModel | null;
  loadError: string | null;
};

// ─── Server-side props ───────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  try {
    const snapshot = loadLivingStateReports();
    if (!snapshot || !snapshot.loaded) {
      return {
        props: {
          model: null,
          loadError: "Living-state reports not found. Run `npx tsx scripts/run-living-state-objects.ts` first.",
        },
      };
    }
    const model = buildOperatorCommandCentreModel(snapshot);
    return { props: { model, loadError: null } };
  } catch (err) {
    console.error("[admin-operator-command-centre]", err);
    return {
      props: {
        model: null,
        loadError: "Failed to load living-state reports.",
      },
    };
  }
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.35)";
const RULE = "rgba(255,255,255,0.07)";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";
const ACCENT = "#C9A96E";

// ─── Filter definitions ──────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "blocked", label: "Blocked" },
  { key: "missing_repair_route", label: "Missing repair route" },
  { key: "unsafe_automation", label: "Unsafe to automate" },
  { key: "owner_decision", label: "Owner decision required" },
  { key: "user_safe", label: "User-safe" },
  { key: "operator_only", label: "Operator-only" },
  { key: "commercial", label: "Commercial" },
  { key: "fulfilment", label: "Fulfilment" },
  { key: "gmi", label: "GMI" },
  { key: "content", label: "Content" },
  { key: "decision_centre", label: "Decision Centre" },
  { key: "strategy_room", label: "Strategy Room" },
  { key: "retainer_oversight", label: "Retainer Oversight" },
  { key: "professional", label: "Professional" },
];

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color, detail }: { label: string; value: number; color?: string; detail?: string }) {
  return (
    <div className="p-4" style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: DIM }}>
        {label}
      </div>
      <div className="text-2xl font-medium mt-1" style={{ color: color ?? GOLD, ...MONO }}>
        {value}
      </div>
      {detail && <div className="text-[11px] mt-1" style={{ color: DIM }}>{detail}</div>}
    </div>
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

function FilterBar({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        const count = counts[f.key] ?? 0;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              border: `1px solid ${isActive ? GOLD : RULE}`,
              backgroundColor: isActive ? "rgba(201,169,110,0.1)" : "transparent",
              color: isActive ? GOLD : DIM,
              cursor: "pointer",
            }}
            className="px-3 py-1.5 text-xs font-mono tracking-[0.1em] uppercase transition-colors"
          >
            {f.label}
            <span className="ml-2" style={{ color: isActive ? GOLD : "rgba(242,241,238,0.5)" }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Domain heatmap row ──────────────────────────────────────────────────────

function DomainRow({
  domain,
  data,
}: {
  domain: string;
  data: { objects: number; blocked: number; governedTensions: number; warnings: number; missingRepairRoutes: number; unsafeToAutomate: number };
}) {
  const label = domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const hasBlockers = data.blocked > 0 || data.governedTensions > 0 || data.warnings > 0;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 text-xs font-mono"
      style={{ borderBottom: `1px solid ${RULE}`, color: DIM }}
    >
      <span className="w-36 shrink-0" style={{ color: hasBlockers ? GOLD : DIM }}>{label}</span>
      <span className="w-12 text-center">{data.objects}</span>
      <span className="w-12 text-center" style={{ color: data.blocked > 0 ? RED : DIM }}>{data.blocked}</span>
      <span className="w-12 text-center" style={{ color: data.governedTensions > 0 ? AMBER : DIM }}>{data.governedTensions}</span>
      <span className="w-12 text-center" style={{ color: data.warnings > 0 ? AMBER : DIM }}>{data.warnings}</span>
      <span className="w-20 text-center" style={{ color: data.missingRepairRoutes > 0 ? RED : DIM }}>{data.missingRepairRoutes}</span>
      <span className="w-20 text-center" style={{ color: data.unsafeToAutomate > 0 ? AMBER : DIM }}>{data.unsafeToAutomate}</span>
    </div>
  );
}

// ─── Priority queue item ─────────────────────────────────────────────────────

function PriorityItem({
  item,
  index,
}: {
  item: OperatorCommandCentreModel["priorityQueue"][number];
  index: number;
}) {
  const severityColor = item.severity === "blocker" ? RED : item.severity === "governed_tension" ? AMBER : item.severity === "warning" ? GOLD : DIM;
  return (
    <div
      className="mb-2"
      style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[9px]" style={{ color: DIM }}>#{index + 1}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
              {item.domain}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: severityColor }}>
              {item.severity}
            </span>
          </div>
          <span className="font-mono text-[9px]" style={{ color: DIM }}>{item.stage}</span>
        </div>
        <div className="text-sm font-medium mt-1" style={{ color: "#f2f1ee" }}>
          {item.title}
        </div>
        <p className="text-xs leading-5 mt-1" style={{ color: DIM }}>
          {item.reason}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: DIM }}>
            Action: {item.nextAction}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: DIM }}>
            Owner: {item.owner}
          </span>
          {item.repairRoute ? (
            <span className="font-mono text-[9px]" style={{ color: ACCENT }}>
              Repair: {item.repairRoute}
            </span>
          ) : item.severity === "blocker" ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: RED }}>
              No repair route
            </span>
          ) : null}
          {!item.safeToAutomate && (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>
              Requires human
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const OperatorCommandCentrePage: NextPage<Props> = ({ model, loadError }) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");

  // Compute filter counts from the model.
  const filterCounts = React.useMemo<Record<FilterKey, number>>(() => {
    if (!model) {
      return {
        all: 0, blocked: 0, missing_repair_route: 0, unsafe_automation: 0,
        owner_decision: 0, user_safe: 0, operator_only: 0,
        commercial: 0, fulfilment: 0, gmi: 0, content: 0,
        decision_centre: 0, strategy_room: 0, retainer_oversight: 0, professional: 0,
      };
    }
    return {
      all: model.totals.objects,
      blocked: model.totals.blocked,
      missing_repair_route: model.totals.missingRepairRoutes,
      unsafe_automation: model.totals.unsafeToAutomate,
      owner_decision: model.totals.ownerDecisions,
      user_safe: model.totals.userSafe,
      operator_only: model.totals.operatorOnly,
      commercial: model.byDomain.commercial?.objects ?? 0,
      fulfilment: model.byDomain.fulfilment?.objects ?? 0,
      gmi: model.byDomain.gmi?.objects ?? 0,
      content: model.byDomain.content?.objects ?? 0,
      decision_centre: model.byDomain.decision_centre?.objects ?? 0,
      strategy_room: model.byDomain.strategy_room?.objects ?? 0,
      retainer_oversight: model.byDomain.retainer_oversight?.objects ?? 0,
      professional: model.byDomain.professional?.objects ?? 0,
    };
  }, [model]);

  return (
    <AdminLayout>
      <Head>
        <title>Operator Command Centre — Living State</title>
      </Head>

      <BackToOperatorCommandCentre />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium" style={{ color: "#f2f1ee" }}>
            Operator Command Centre
          </h1>
          <p className="text-sm leading-6 mt-2" style={{ color: DIM }}>
            This surface aggregates living-state signals across the estate. It shows where the system
            cannot safely infer fulfilment, publication, delivery, verification, consent, access,
            authority, or readiness.
          </p>
          <p className="text-sm leading-6 mt-1" style={{ color: DIM }}>
            A blocked object is not automatically a failure. It is a governed state requiring evidence,
            action, repair, or owner review.
          </p>
          {model?.generatedAt && (
            <p className="text-xs mt-2 font-mono" style={{ color: DIM }}>
              Reports: {new Date(model.generatedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Error state */}
        {loadError && (
          <div className="p-4 mb-6" style={{ border: `1px solid ${RED}`, backgroundColor: "rgba(239,68,68,0.05)" }}>
            <p className="text-sm" style={{ color: RED }}>{loadError}</p>
          </div>
        )}

        {/* Empty state */}
        {!loadError && model && model.totals.objects === 0 && (
          <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
            <p className="text-sm" style={{ color: DIM }}>
              No living-state objects found. Run the living-state runner first.
            </p>
            <code className="inline-block mt-2 px-3 py-1.5 text-xs font-mono" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: GOLD }}>
              npx tsx scripts/run-living-state-objects.ts
            </code>
          </div>
        )}

        {model && model.totals.objects > 0 && (
          <>
            {/* ── 1. Estate Pulse ──────────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                Estate Pulse
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Total objects" value={model.totals.objects} />
                <StatCard label="Blocked" value={model.totals.blocked} color={RED} />
                <StatCard label="Governed tensions" value={model.totals.governedTensions} color={AMBER} />
                <StatCard label="Warnings" value={model.totals.warnings} color={AMBER} />
                <StatCard label="Unsafe to automate" value={model.totals.unsafeToAutomate} color={AMBER} />
                <StatCard label="Missing repair routes" value={model.totals.missingRepairRoutes} color={RED} />
                <StatCard label="Owner decisions" value={model.totals.ownerDecisions} color={AMBER} />
                <StatCard label="User-safe" value={model.totals.userSafe} color={EMERALD} />
                <StatCard label="Operator-only" value={model.totals.operatorOnly} color={DIM} />
              </div>
            </div>

            {/* ── 2. Domain Heatmap ────────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                Domain Heatmap
              </div>
              <div style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-3 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.14em]" style={{ color: DIM, borderBottom: `1px solid ${RULE}` }}>
                  <span className="w-36 shrink-0">Domain</span>
                  <span className="w-12 text-center">Total</span>
                  <span className="w-12 text-center">Blocked</span>
                  <span className="w-12 text-center">Tensions</span>
                  <span className="w-12 text-center">Warnings</span>
                  <span className="w-20 text-center">Missing route</span>
                  <span className="w-20 text-center">Unsafe auto</span>
                </div>
                {Object.entries(model.byDomain).map(([domain, data]) => (
                  <DomainRow key={domain} domain={domain} data={data} />
                ))}
              </div>
            </div>

            {/* ── 3. Memory Signal ─────────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                Memory Signal
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Repeated" value={model.memory.repeated} color={AMBER} />
                <StatCard label="Resolved" value={model.memory.resolved} color={EMERALD} />
                <StatCard label="Regressed" value={model.memory.regressed} color={RED} />
                <StatCard label="New issues" value={model.memory.newIssues} color={AMBER} />
              </div>
            </div>

            {/* ── 4. Domain Alerts ─────────────────────────────────────────────── */}
            {model.domainAlerts.length > 0 && (
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                  Domain Alerts
                </div>
                <div className="space-y-2">
                  {model.domainAlerts.map((alert) => (
                    <div
                      key={alert.domain}
                      className="p-3"
                      style={{
                        border: `1px solid ${alert.blocked > 0 ? RED : AMBER}`,
                        backgroundColor: alert.blocked > 0 ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)",
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium" style={{ color: "#f2f1ee" }}>
                          {alert.domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="font-mono text-[9px]" style={{ color: alert.blocked > 0 ? RED : AMBER }}>
                          {alert.blocked} blocked
                        </span>
                      </div>
                      <p className="text-xs leading-5 mt-1" style={{ color: DIM }}>
                        {alert.summary}
                      </p>
                      <p className="text-xs leading-5 mt-0.5" style={{ color: DIM }}>
                        <span style={{ color: ACCENT }}>Top risk: </span>{alert.topRisk}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. Filter bar ────────────────────────────────────────────────── */}
            <FilterBar active={activeFilter} onChange={setActiveFilter} counts={filterCounts} />

            {/* ── 6. Priority Queue ────────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                Priority Queue
                <span className="ml-2" style={{ color: DIM }}>
                  ({model.priorityQueue.length} items)
                </span>
              </div>

              {model.priorityQueue.length === 0 ? (
                <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
                  <p className="text-sm" style={{ color: DIM }}>No priority items. The estate is clear.</p>
                </div>
              ) : (
                <>
                  {/* Apply filter */}
                  {(() => {
                    const filtered = model.priorityQueue.filter((item) => {
                      if (activeFilter === "all") return true;
                      if (activeFilter === "blocked") return item.severity === "blocker";
                      if (activeFilter === "missing_repair_route") return !item.repairRoute && item.severity === "blocker";
                      if (activeFilter === "unsafe_automation") return !item.safeToAutomate;
                      if (activeFilter === "owner_decision") return item.owner.includes("founder");
                      if (activeFilter === "user_safe") return true; // filtered from model
                      if (activeFilter === "operator_only") return true;
                      // Domain filters
                      return item.domain === activeFilter;
                    });

                    return (
                      <>
                        <div className="mb-2 font-mono text-[10px]" style={{ color: DIM }}>
                          Showing {filtered.length} of {model.priorityQueue.length} items
                        </div>
                        {filtered.length === 0 ? (
                          <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
                            <p className="text-sm" style={{ color: DIM }}>No items match the current filter.</p>
                          </div>
                        ) : (
                          filtered.map((item, i) => (
                            <PriorityItem key={item.id} item={item} index={i} />
                          ))
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            {/* ── 7. "Do not infer" panel ──────────────────────────────────────── */}
            {model.refusedToInfer.length > 0 && (
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: ACCENT }}>
                  The system refused to infer
                </div>
                <div className="p-4" style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <ul className="space-y-1">
                    {model.refusedToInfer.map((r, i) => (
                      <li key={i} className="text-xs" style={{ color: DIM }}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default OperatorCommandCentrePage;
