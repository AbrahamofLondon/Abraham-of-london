/**
 * pages/admin/fulfilment/index.tsx
 *
 * Estate-wide product fulfilment queue.
 * Admin-guarded. Shows all products requiring action across the estate.
 */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import type { FulfilmentItem, FulfilmentPriority } from "@/lib/fulfilment/estate-fulfilment-service";

type Counts = {
  total: number;
  needsReview: number;
  needsGeneration: number;
  needsDelivery: number;
  overdue: number;
  failed: number;
};

type Props = {
  items: FulfilmentItem[];
  counts: Counts;
  fetchError: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  try {
    const { getEstateFulfilmentItems } = await import("@/lib/fulfilment/estate-fulfilment-service");
    const items = await getEstateFulfilmentItems({ includeArchive: false });

    const counts: Counts = {
      total: items.length,
      needsReview: items.filter((i) => i.nextAction.toLowerCase().includes("review") || i.nextAction.toLowerCase().includes("start")).length,
      needsGeneration: items.filter((i) => i.generationStatus === "GENERATING" || i.nextAction.toLowerCase().includes("generat")).length,
      needsDelivery: items.filter((i) => i.nextAction.toLowerCase().includes("deliver")).length,
      overdue: items.filter((i) => i.isOverdue).length,
      failed: items.filter((i) => i.deliveryStatus === "FAILED" || i.deliveryStatus === "failed").length,
    };

    return { props: { items, counts, fetchError: null } };
  } catch (err) {
    console.error("[admin-fulfilment-page]", err);
    return { props: { items: [], counts: { total: 0, needsReview: 0, needsGeneration: 0, needsDelivery: 0, overdue: 0, failed: 0 }, fetchError: "Failed to load fulfilment items" } };
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.35)";
const RULE = "rgba(255,255,255,0.07)";

const PRIORITY_COLOUR: Record<FulfilmentPriority, string> = {
  critical: "#f87171",
  high: "#fb923c",
  normal: GOLD,
  low: DIM,
};

const SOURCE_LABEL: Record<string, string> = {
  boardroom_brief_order: "Boardroom Brief",
  product_artifact: "Artifact",
  executive_report: "Executive Report",
  oversight_review_cycle: "Retainer Cycle",
  retainer_readiness: "Retainer Readiness",
  case_study: "Case Study",
  oversight_delivery: "Oversight Delivery",
};

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 3)}***@${domain}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

type TabKey = "all" | "needs_review" | "needs_generation" | "needs_delivery" | "overdue" | "failed" | "delivered";

function applyTab(items: FulfilmentItem[], tab: TabKey): FulfilmentItem[] {
  switch (tab) {
    case "needs_review": return items.filter((i) => i.nextAction.toLowerCase().includes("review") || i.nextAction.toLowerCase().includes("start"));
    case "needs_generation": return items.filter((i) => i.generationStatus === "GENERATING" || i.nextAction.toLowerCase().includes("generat"));
    case "needs_delivery": return items.filter((i) => i.nextAction.toLowerCase().includes("deliver"));
    case "overdue": return items.filter((i) => i.isOverdue);
    case "failed": return items.filter((i) => i.deliveryStatus === "FAILED" || i.deliveryStatus === "failed");
    case "delivered": return items.filter((i) => i.deliveryStatus === "delivered" || i.deliveryStatus === "DELIVERED" || i.deliveredAt);
    default: return items;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EstateFulfilmentPage({ items, counts, fetchError }: Props) {
  const [tab, setTab] = React.useState<TabKey>("all");
  const [search, setSearch] = React.useState("");

  const displayed = React.useMemo(() => {
    let result = applyTab(items, tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.sourceId.toLowerCase().includes(q) ||
          (i.customerEmail ?? "").toLowerCase().includes(q) ||
          (i.productCode ?? "").toLowerCase().includes(q) ||
          i.nextAction.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, tab, search]);

  const tabs: Array<{ key: TabKey; label: string; count: number; alert?: boolean }> = [
    { key: "all", label: "All", count: counts.total },
    { key: "needs_review", label: "Needs Review", count: counts.needsReview },
    { key: "needs_generation", label: "Needs Generation", count: counts.needsGeneration },
    { key: "needs_delivery", label: "Needs Delivery", count: counts.needsDelivery },
    { key: "overdue", label: "Overdue", count: counts.overdue, alert: counts.overdue > 0 },
    { key: "failed", label: "Failed", count: counts.failed, alert: counts.failed > 0 },
    { key: "delivered", label: "Delivered", count: items.filter((i) => i.deliveryStatus === "delivered" || i.deliveryStatus === "DELIVERED" || !!i.deliveredAt).length },
  ];

  return (
    <AdminLayout>
      <Head><title>Estate Fulfilment | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 1300 }}>
        <BackToOperatorCommandCentre />

        <div style={{ marginBottom: 24 }}>
          <p style={{ ...MONO, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Operations · Estate Fulfilment
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Estate Fulfilment Queue</h1>
          <p style={{ fontSize: 13, color: DIM, marginTop: 6, maxWidth: 700 }}>
            Unified view of every paid, governed, or review-requiring item across the product estate.
            All sources: Boardroom Orders · Artifacts · Retainer Cycles · Retainer Readiness · Case Studies · Oversight Deliveries.
          </p>
        </div>

        {fetchError && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", ...MONO, fontSize: 12, marginBottom: 16 }}>
            {fetchError}
          </div>
        )}

        {/* Summary chips */}
        {counts.overdue > 0 && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", ...MONO, fontSize: 11, marginBottom: 16 }}>
            ⚠ {counts.overdue} overdue item{counts.overdue > 1 ? "s" : ""} require immediate attention.
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "6px 12px",
                background: tab === t.key ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${tab === t.key ? "rgba(201,169,110,0.4)" : t.alert ? "rgba(239,68,68,0.3)" : RULE}`,
                color: tab === t.key ? GOLD : t.alert ? "#f87171" : DIM,
                cursor: "pointer",
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by source ID, email, or product…"
            style={{
              ...MONO, fontSize: 12, padding: "8px 12px", width: 420,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${RULE}`,
              color: "#f2f1ee", outline: "none",
            }}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, ...MONO }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${RULE}` }}>
                {["Priority", "Product", "Source", "Customer", "Status", "Next Action", "Due / Created", "Proof", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: DIM, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "32px 12px", color: DIM, textAlign: "center" }}>
                    No items match this filter.
                  </td>
                </tr>
              )}
              {displayed.map((item) => (
                <tr key={item.id} style={{
                  borderBottom: `1px solid ${RULE}`,
                  background: item.isOverdue ? "rgba(239,68,68,0.04)" : item.priority === "critical" ? "rgba(239,68,68,0.02)" : "transparent",
                }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: PRIORITY_COLOUR[item.priority], fontSize: 10, textTransform: "uppercase" }}>
                      {item.priority}
                    </span>
                    {item.isOverdue && <span style={{ marginLeft: 4, color: "#f87171", fontSize: 9 }}>OVERDUE</span>}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#f2f1ee" }}>
                    {SOURCE_LABEL[item.sourceType] ?? item.sourceType}
                    <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{item.productCode}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 10, color: DIM }}>{item.sourceId.slice(0, 14)}…</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: DIM }}>{maskEmail(item.customerEmail)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.deliveryStatus && (
                      <span style={{ fontSize: 10, color: item.deliveryStatus === "delivered" || item.deliveryStatus === "DELIVERED" ? "#4ade80" : DIM, textTransform: "uppercase" }}>
                        {item.deliveryStatus}
                      </span>
                    )}
                    {item.reviewStatus && (
                      <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", marginTop: 2 }}>
                        {item.reviewStatus}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: GOLD, fontSize: 11 }}>{item.nextAction}</td>
                  <td style={{ padding: "10px 12px", color: DIM, fontSize: 11 }}>
                    {item.dueAt ? (
                      <span style={{ color: item.isOverdue ? "#f87171" : DIM }}>
                        Due {formatDate(item.dueAt)}
                      </span>
                    ) : (
                      formatDate(item.createdAt)
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {item.proofMode ? (
                      <span style={{ background: "rgba(180,83,9,0.3)", color: "#fbbf24", border: "1px solid rgba(180,83,9,0.5)", padding: "2px 6px", fontSize: 9 }}>
                        PROOF
                      </span>
                    ) : <span style={{ color: DIM }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Link href={item.adminRoute} style={{ color: GOLD, textDecoration: "none", fontSize: 10, border: `1px solid rgba(201,169,110,0.3)`, padding: "4px 8px" }}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, ...MONO, fontSize: 10, color: DIM }}>
          Sources: Boardroom Orders · Product Artifacts · Retainer Cycles · Retainer Readiness · Case Studies · Oversight Deliveries
        </div>
      </div>
    </AdminLayout>
  );
}
