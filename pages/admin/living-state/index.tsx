/**
 * pages/admin/living-state/index.tsx
 *
 * Operator intelligence surface for commercial and fulfilment living-state
 * objects. Reads the committed living-state reports and surfaces blockers,
 * next actions, repair routes, and safety flags.
 *
 * This is NOT a product-specific dashboard. It is a generic operator surface
 * that renders whatever the living-state engine produced.
 *
 * Principle:
 *   Blocked does not mean system failure.
 *   Blocked means the system refused to pretend the case is fulfilled,
 *   delivered, approved, verified, or safe.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { loadLivingStateReports } from "@/lib/living-intelligence/living-state-report-loader";
import type { LivingStateReportSnapshot } from "@/lib/living-intelligence/living-state-report-loader";
import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";
import LivingStatePanel from "@/components/living/LivingStatePanel";

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterKey = "all" | "commercial" | "fulfilment" | "gmi" | "content" | "decision_centre" | "strategy_room" | "blocked" | "missing_repair_route" | "unsafe_automation" | "artifact_incomplete" | "publication" | "route_issue" | "lifecycle_tension" | "public_exposure" | "user_safe" | "needs_review" | "missing_evidence" | "execution_gap" | "component_underwired";

type Props = {
  snapshot: LivingStateReportSnapshot | null;
  loadError: string | null;
};

// ─── Server-side props ───────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  try {
    const snapshot = loadLivingStateReports();
    return { props: { snapshot, loadError: null } };
  } catch (err) {
    console.error("[admin-living-state] Failed to load reports:", err);
    return {
      props: {
        snapshot: null,
        loadError: "Failed to load living-state reports. Run `node scripts/run-living-state-objects.ts` first.",
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
  { key: "commercial", label: "Commercial" },
  { key: "fulfilment", label: "Fulfilment" },
  { key: "gmi", label: "GMI" },
  { key: "content", label: "Content" },
  { key: "decision_centre", label: "Decision Centre" },
  { key: "strategy_room", label: "Strategy Room" },
  { key: "blocked", label: "Blocked" },
  { key: "user_safe", label: "User-safe" },
  { key: "needs_review", label: "Needs review" },
  { key: "missing_evidence", label: "Missing evidence" },
  { key: "execution_gap", label: "Execution gap" },
  { key: "component_underwired", label: "Component underwired" },
  { key: "publication", label: "Publication" },
  { key: "route_issue", label: "Route issue" },
  { key: "lifecycle_tension", label: "Lifecycle tension" },
  { key: "public_exposure", label: "Public exposure" },
  { key: "missing_repair_route", label: "Missing repair route" },
  { key: "unsafe_automation", label: "Unsafe to automate" },
  { key: "artifact_incomplete", label: "Artifact incomplete" },
];

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      className="p-4"
      style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: DIM }}>
        {label}
      </div>
      <div className="text-2xl font-medium mt-1" style={{ color: color ?? GOLD, ...MONO }}>
        {value}
      </div>
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

// ─── Object card (compact operator view) ─────────────────────────────────────

function ObjectCard({ object }: { object: LivingStateObject }) {
  const hasBlocker = object.blockers.some((b) => b.severity === "blocker");
  const hasWarning = object.blockers.some((b) => b.severity === "warning");
  const hasMissingRoute = object.blockers.some(
    (b) => b.code === "missing_repair_path" || b.code === "route_missing",
  );

  const borderColor = hasBlocker ? RED : hasWarning ? AMBER : RULE;

  return (
    <div
      className="mb-4"
      style={{ border: `1px solid ${borderColor}`, backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      {/* Header row */}
      <div className="p-4 pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              {object.domain}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: DIM }}>
              {object.subjectType}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[9px]" style={{ color: DIM }}>
              {object.currentStage}
            </span>
            {object.productCode && (
              <span className="font-mono text-[9px]" style={{ color: DIM }}>
                {object.productCode}
              </span>
            )}
          </div>
        </div>
        <h3 className="text-sm font-medium mt-1" style={{ color: "#f2f1ee" }}>
          {object.title}
        </h3>
        <p className="text-xs leading-5 mt-1" style={{ color: DIM }}>
          {object.operatorSummary}
        </p>
      </div>

      {/* Safety flags row */}
      <div className="px-4 pb-2 flex flex-wrap gap-x-4 gap-y-1">
        {!object.safeToAutomate && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>
            ⚠ Requires human
          </span>
        )}
        {!object.safeToShowUser && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: RED }}>
            🚫 Not user-safe
          </span>
        )}
        {hasMissingRoute && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: RED }}>
            🛑 Missing repair route
          </span>
        )}
        {object.artifact.status === "missing" && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>
            📄 Artifact missing
          </span>
        )}
        {object.artifact.status === "stub_only" && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>
            📄 Stub only
          </span>
        )}
      </div>

      {/* Blockers */}
      {object.blockers.length > 0 && (
        <div className="px-4 pb-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: AMBER }}>
            Blockers ({object.blockers.length})
          </div>
          <div className="space-y-1">
            {object.blockers.map((b, i) => (
              <div
                key={`${b.code}-${i}`}
                className="pl-2 py-1"
                style={{
                  borderLeft: `2px solid ${
                    b.severity === "blocker" ? RED : b.severity === "warning" ? AMBER : DIM
                  }`,
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs" style={{ color: "#f2f1ee" }}>
                    {b.label}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em]" style={{ color: DIM }}>
                    {b.severity}
                  </span>
                </div>
                <p className="text-[11px] leading-4 mt-0.5" style={{ color: DIM }}>
                  {b.requiredAction}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: DIM }}>
                    Owner: {b.actionOwner}
                  </span>
                  {b.repairRoute ? (
                    <span className="font-mono text-[8px]" style={{ color: ACCENT }}>
                      Repair: {b.repairRoute}
                    </span>
                  ) : (
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: RED }}>
                      No repair route
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next actions */}
      {object.nextActions.length > 0 && (
        <div className="px-4 pb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>
            Next governed actions
          </div>
          <div className="space-y-1">
            {object.nextActions.map((a, i) => (
              <div key={`${a.actionType}-${i}`} className="text-xs" style={{ color: DIM }}>
                <span style={{ color: a.actionType === "do_not_proceed" ? RED : "#f2f1ee" }}>
                  {a.label}
                </span>
                {a.route && (
                  <span className="ml-2 font-mono text-[9px]" style={{ color: ACCENT }}>
                    {a.route}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const LivingStatePage: NextPage<Props> = ({ snapshot, loadError }) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");

  // Compute filter counts
  const filterCounts = React.useMemo<Record<FilterKey, number>>(() => {
    if (!snapshot) {
      return {
        all: 0, commercial: 0, fulfilment: 0, gmi: 0, content: 0,
        decision_centre: 0, strategy_room: 0,
        blocked: 0, user_safe: 0, needs_review: 0, missing_evidence: 0,
        execution_gap: 0, component_underwired: 0,
        publication: 0, route_issue: 0, lifecycle_tension: 0,
        public_exposure: 0, missing_repair_route: 0, unsafe_automation: 0,
        artifact_incomplete: 0,
      };
    }
    const gmiObjs = snapshot.objects.filter((o) => o.domain === "gmi");
    const contentObjs = snapshot.objects.filter((o) => o.domain === "content");
    const dcObjs = snapshot.objects.filter((o) => o.domain === "decision_centre");
    const srObjs = snapshot.objects.filter((o) => o.domain === "strategy_room");
    const publicationObjs = snapshot.objects.filter((o) => o.publication.relevant);
    const routeIssueObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "route_missing"),
    );
    const lifecycleTensionObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "lifecycle_conflict" || b.code === "source_of_truth_conflict"),
    );
    const publicExposureObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "publication_not_allowed"),
    );
    const userSafeObjs = snapshot.objects.filter((o) => o.safeToShowUser);
    const needsReviewObjs = snapshot.objects.filter((o) =>
      o.currentStage === "awaiting_review" || o.currentStage === "ready_for_review",
    );
    const missingEvidenceObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "missing_evidence"),
    );
    const executionGapObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "missing_operator_action"),
    );
    const componentUnderwiredObjs = snapshot.objects.filter((o) =>
      o.blockers.some((b) => b.code === "component_without_live_state"),
    );
    return {
      all: snapshot.objects.length,
      commercial: snapshot.commercialObjects.length,
      fulfilment: snapshot.fulfilmentObjects.length,
      gmi: gmiObjs.length,
      content: contentObjs.length,
      decision_centre: dcObjs.length,
      strategy_room: srObjs.length,
      blocked: snapshot.blockedObjects.length,
      user_safe: userSafeObjs.length,
      needs_review: needsReviewObjs.length,
      missing_evidence: missingEvidenceObjs.length,
      execution_gap: executionGapObjs.length,
      component_underwired: componentUnderwiredObjs.length,
      publication: publicationObjs.length,
      route_issue: routeIssueObjs.length,
      lifecycle_tension: lifecycleTensionObjs.length,
      public_exposure: publicExposureObjs.length,
      missing_repair_route: snapshot.objectsWithMissingRepairRoutes.length,
      unsafe_automation: snapshot.unsafeAutomationObjects.length,
      artifact_incomplete: snapshot.artifactIncompleteObjects.length,
    };
  }, [snapshot]);

  // Apply filter
  const filteredObjects = React.useMemo<LivingStateObject[]>(() => {
    if (!snapshot) return [];
    switch (activeFilter) {
      case "commercial":
        return snapshot.commercialObjects;
      case "fulfilment":
        return snapshot.fulfilmentObjects;
      case "gmi":
        return snapshot.objects.filter((o) => o.domain === "gmi");
      case "content":
        return snapshot.objects.filter((o) => o.domain === "content");
      case "blocked":
        return snapshot.blockedObjects;
      case "publication":
        return snapshot.objects.filter((o) => o.publication.relevant);
      case "route_issue":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "route_missing"),
        );
      case "lifecycle_tension":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "lifecycle_conflict" || b.code === "source_of_truth_conflict"),
        );
      case "decision_centre":
        return snapshot.objects.filter((o) => o.domain === "decision_centre");
      case "strategy_room":
        return snapshot.objects.filter((o) => o.domain === "strategy_room");
      case "user_safe":
        return snapshot.objects.filter((o) => o.safeToShowUser);
      case "needs_review":
        return snapshot.objects.filter((o) =>
          o.currentStage === "awaiting_review" || o.currentStage === "ready_for_review",
        );
      case "missing_evidence":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "missing_evidence"),
        );
      case "execution_gap":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "missing_operator_action"),
        );
      case "component_underwired":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "component_without_live_state"),
        );
      case "public_exposure":
        return snapshot.objects.filter((o) =>
          o.blockers.some((b) => b.code === "publication_not_allowed"),
        );
      case "missing_repair_route":
        return snapshot.objectsWithMissingRepairRoutes;
      case "unsafe_automation":
        return snapshot.unsafeAutomationObjects;
      case "artifact_incomplete":
        return snapshot.artifactIncompleteObjects;
      default:
        return snapshot.objects;
    }
  }, [snapshot, activeFilter]);

  return (
    <AdminLayout>
      <Head>
        <title>Living Commercial & Fulfilment State — Admin</title>
      </Head>

      <BackToOperatorCommandCentre />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-medium" style={{ color: "#f2f1ee" }}>
            Living Commercial & Fulfilment State
          </h1>
          <p className="text-sm leading-6 mt-2" style={{ color: DIM }}>
            This surface shows where the estate cannot safely infer checkout permission, fulfilment,
            delivery, artifact generation, verification, or operator completion.
          </p>
          <p className="text-sm leading-6 mt-1" style={{ color: DIM }}>
            A blocked object is not necessarily an error. It is a governed state requiring action,
            evidence, or a repair path.
          </p>
          {snapshot?.generatedAt && (
            <p className="text-xs mt-2 font-mono" style={{ color: DIM }}>
              Reports generated: {new Date(snapshot.generatedAt).toLocaleString()}
              {snapshot.engineVersion && ` · Engine: ${snapshot.engineVersion}`}
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
        {!loadError && snapshot && snapshot.objects.length === 0 && (
          <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
            <p className="text-sm" style={{ color: DIM }}>
              No living-state objects found. Run the living-state runner first:
            </p>
            <code className="inline-block mt-2 px-3 py-1.5 text-xs font-mono" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: GOLD }}>
              npx tsx scripts/run-living-state-objects.ts
            </code>
          </div>
        )}

        {/* Stats */}
        {snapshot && snapshot.objects.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total objects" value={snapshot.estate?.totalObjects ?? snapshot.objects.length} />
              <StatCard label="Commercial" value={snapshot.commercialObjects.length} />
              <StatCard label="Fulfilment" value={snapshot.fulfilmentObjects.length} />
              <StatCard label="Blocked" value={snapshot.estate?.blocked ?? snapshot.blockedObjects.length} color={RED} />
              <StatCard label="Warnings" value={snapshot.estate?.warnings ?? 0} color={AMBER} />
              <StatCard label="Missing repair routes" value={snapshot.objectsWithMissingRepairRoutes.length} color={RED} />
              <StatCard label="Unsafe to automate" value={snapshot.unsafeAutomationObjects.length} color={AMBER} />
              <StatCard label="Artifact incomplete" value={snapshot.artifactIncompleteObjects.length} color={AMBER} />
            </div>

            {/* Refused to infer */}
            {snapshot.refusedToInfer.length > 0 && (
              <div className="p-4 mb-6" style={{ border: `1px solid ${RULE}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: ACCENT }}>
                  The system refused to infer
                </div>
                <ul className="space-y-1">
                  {snapshot.refusedToInfer.map((r, i) => (
                    <li key={i} className="text-xs" style={{ color: DIM }}>
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Memory summary */}
            {snapshot.memory && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard label="New issues" value={snapshot.memory.newIssues} color={AMBER} />
                <StatCard label="Repeated" value={snapshot.memory.repeatedIssues} color={AMBER} />
                <StatCard label="Resolved" value={snapshot.memory.resolvedIssues} color={EMERALD} />
                <StatCard label="Regressions" value={snapshot.memory.regressions} color={RED} />
                <StatCard label="Remembered" value={snapshot.memory.rememberedObjects} />
              </div>
            )}

            {/* Filter bar */}
            <FilterBar active={activeFilter} onChange={setActiveFilter} counts={filterCounts} />

            {/* Object list */}
            <div className="space-y-1">
              {filteredObjects.length === 0 ? (
                <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
                  <p className="text-sm" style={{ color: DIM }}>
                    No objects match the current filter.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: DIM }}>
                    Showing {filteredObjects.length} of {snapshot.objects.length} objects
                  </div>
                  {filteredObjects.map((object) => (
                    <ObjectCard key={object.id} object={object} />
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* No reports state */}
        {!loadError && !snapshot && (
          <div className="p-8 text-center" style={{ border: `1px solid ${RULE}` }}>
            <p className="text-sm" style={{ color: DIM }}>
              Living-state reports have not been generated yet.
            </p>
            <code className="inline-block mt-2 px-3 py-1.5 text-xs font-mono" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: GOLD }}>
              npx tsx scripts/run-living-state-objects.ts
            </code>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LivingStatePage;
