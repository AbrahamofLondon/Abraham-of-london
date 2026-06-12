/**
 * pages/admin/boardroom/orders.tsx
 *
 * Boardroom Brief fulfilment queue — live paid orders needing review.
 * Admin-guarded. Shows all orders with enriched stub/delivery state.
 */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import type { BoardroomOrderRow } from "@/pages/api/admin/boardroom/orders";

type Props = {
  orders: BoardroomOrderRow[];
  fetchError: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  try {
    const orders = await fetchOrdersDirect();
    return { props: { orders, fetchError: null } };
  } catch {
    return { props: { orders: [], fetchError: "Failed to load orders" } };
  }
};

// Server-side direct DB fetch (avoids HTTP round-trip in SSR)
async function fetchOrdersDirect(): Promise<BoardroomOrderRow[]> {
  const { prisma } = await import("@/lib/prisma");

  const rows = await prisma.boardroomBriefOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      paymentStatus: true,
      deliveryStatus: true,
      riskLevel: true,
      score: true,
      createdAt: true,
      deliveredAt: true,
      stripeSessionId: true,
      source: true,
      metadata: true,
    },
  });

  if (rows.length === 0) return [];

  const orderIds = rows.map((o) => o.id);

  const [artifactStubs, falsificationStubs, hypothesisStubs] = await Promise.all([
    prisma.productArtifact.findMany({
      where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: { in: orderIds } },
      select: { sourceEntityId: true },
    }),
    prisma.falsificationEntry.findMany({
      where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: { in: orderIds } },
      select: { sourceEntityId: true },
    }),
    prisma.outcomeHypothesis.findMany({
      where: { sourceRunId: { in: orderIds } },
      select: { sourceRunId: true },
    }),
  ]);

  const artifactSet = new Set(artifactStubs.map((a) => a.sourceEntityId).filter(Boolean) as string[]);
  const falsificationSet = new Set(falsificationStubs.map((f) => f.sourceEntityId).filter(Boolean) as string[]);
  const hypothesisSet = new Set(hypothesisStubs.map((h) => h.sourceRunId).filter(Boolean) as string[]);

  return rows.map((o) => {
    const meta = (o.metadata as Record<string, unknown> | null) ?? {};
    const proofMode = meta.proofMode === "true" || meta.proofMode === true;
    const deliveryDeadline = new Date(o.createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

    return {
      id: o.id,
      email: o.email,
      paymentStatus: o.paymentStatus,
      deliveryStatus: o.deliveryStatus,
      riskLevel: o.riskLevel,
      score: o.score,
      createdAt: o.createdAt.toISOString(),
      deliveryDeadline,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      stripeSessionId: o.stripeSessionId,
      proofMode,
      source: o.source,
      artifactStubExists: artifactSet.has(o.id),
      falsificationStubExists: falsificationSet.has(o.id),
      hypothesisStubExists: hypothesisSet.has(o.id),
    };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.35)";
const RULE = "rgba(255,255,255,0.07)";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 3)}***@${domain}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

function isOverdue(row: BoardroomOrderRow): boolean {
  return row.deliveryStatus !== "delivered" && new Date(row.deliveryDeadline) < new Date();
}

function statusColor(status: string): string {
  switch (status) {
    case "delivered": return "#4ade80";
    case "customer_access_ready": return "#4ade80";
    case "approved_for_delivery": return "#4ade80";
    case "dossier_generated":
    case "draft_generated": return "#c9a96e";
    case "awaiting_operator_review":
    case "in_review": return "#60a5fa";
    case "case_stubs_created": return "#60a5fa";
    case "paid":
    case "requested": return "#f87171";
    case "blocked":
    case "failed": return "#ef4444";
    default: return DIM;
  }
}

function nextAction(row: BoardroomOrderRow): string {
  if (row.deliveryStatus === "delivered") return "Delivered";
  if (row.deliveryStatus === "customer_access_ready") return "Ready to deliver";
  if (row.deliveryStatus === "approved_for_delivery") return "Generate customer access";
  if (row.deliveryStatus === "dossier_generated" || row.deliveryStatus === "draft_generated") return "Awaiting review";
  if (row.deliveryStatus === "awaiting_operator_review" || row.deliveryStatus === "in_review") return "Review pending";
  if (row.deliveryStatus === "case_stubs_created") return "Generate dossier";
  if (row.deliveryStatus === "paid" || row.deliveryStatus === "requested") return "Needs review";
  if (row.deliveryStatus === "blocked") return "Blocked";
  if (row.deliveryStatus === "failed") return "Failed";
  return "—";
}

type FilterTab = "all" | "pending_review" | "generated" | "delivered" | "overdue" | "proof";

function applyFilter(orders: BoardroomOrderRow[], filter: FilterTab): BoardroomOrderRow[] {
  switch (filter) {
    case "pending_review":
      return orders.filter((o) =>
        o.paymentStatus === "paid" &&
        (o.deliveryStatus === "requested" || o.deliveryStatus === "paid" ||
         o.deliveryStatus === "in_review" || o.deliveryStatus === "awaiting_operator_review" ||
         o.deliveryStatus === "case_stubs_created")
      );
    case "generated":
      return orders.filter((o) =>
        o.deliveryStatus === "dossier_generated" || o.deliveryStatus === "draft_generated"
      );
    case "delivered":
      return orders.filter((o) =>
        o.deliveryStatus === "delivered" || o.deliveryStatus === "customer_access_ready" || o.deliveryStatus === "approved_for_delivery"
      );
    case "overdue":
      return orders.filter(isOverdue);
    case "proof":
      return orders.filter((o) => o.proofMode);
    default:
      return orders;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BoardroomOrdersPage({ orders, fetchError }: Props) {
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    let result = applyFilter(orders, filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) => o.id.toLowerCase().includes(q) || o.email.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, filter, search]);

  const counts = {
    all: orders.length,
    pending_review: applyFilter(orders, "pending_review").length,
    generated: applyFilter(orders, "generated").length,
    delivered: applyFilter(orders, "delivered").length,
    overdue: applyFilter(orders, "overdue").length,
    proof: applyFilter(orders, "proof").length,
  };

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending_review", label: `Pending Review (${counts.pending_review})` },
    { key: "generated", label: `Generated (${counts.generated})` },
    { key: "delivered", label: `Delivered (${counts.delivered})` },
    { key: "overdue", label: `Overdue (${counts.overdue})` },
    { key: "proof", label: `Proof (${counts.proof})` },
  ];

  return (
    <AdminLayout>
      <Head><title>Boardroom Orders | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
        <BackToOperatorCommandCentre />

        <div style={{ marginBottom: 24 }}>
          <p style={{ ...MONO, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Boardroom · Fulfilment Queue
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Boardroom Brief Orders</h1>
          <p style={{ fontSize: 13, color: DIM, marginTop: 6 }}>
            Live paid orders requiring review, generation, and delivery. Archive is for delivered/historical records only.
          </p>
        </div>

        {fetchError && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", ...MONO, fontSize: 12, marginBottom: 16 }}>
            {fetchError}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "6px 12px",
                background: filter === t.key ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === t.key ? "rgba(201,169,110,0.4)" : RULE}`,
                color: filter === t.key ? GOLD : DIM,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or email…"
            style={{
              ...MONO, fontSize: 12, padding: "8px 12px", width: 360,
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
                {[
                  "Order Ref", "Customer", "Payment", "Delivery Status", "Risk",
                  "Stubs", "Created", "Deadline", "Proof", "Next Action", "",
                ].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: DIM, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: "32px 12px", color: DIM, textAlign: "center" }}>
                    No orders match this filter.
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const overdue = isOverdue(o);
                return (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${RULE}`, background: overdue ? "rgba(239,68,68,0.04)" : "transparent" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <Link href={`/admin/boardroom/orders/${o.id}`} style={{ color: GOLD, textDecoration: "none", fontSize: 11 }}>
                        {o.id.slice(0, 16)}…
                      </Link>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#f2f1ee" }}>{maskEmail(o.email)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: o.paymentStatus === "paid" ? "#4ade80" : "#f87171", fontSize: 10, textTransform: "uppercase" }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: statusColor(o.deliveryStatus), fontSize: 10, textTransform: "uppercase" }}>
                        {o.deliveryStatus}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: o.riskLevel === "Critical" || o.riskLevel === "High" ? "#f87171" : DIM }}>
                      {o.riskLevel ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span title="Artifact / Falsification / Hypothesis" style={{ letterSpacing: "0.15em" }}>
                        <span style={{ color: o.artifactStubExists ? "#4ade80" : "#f87171" }}>A</span>
                        <span style={{ color: o.falsificationStubExists ? "#4ade80" : "#f87171" }}> F</span>
                        <span style={{ color: o.hypothesisStubExists ? "#4ade80" : "#f87171" }}> H</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: DIM }}>{formatDate(o.createdAt)}</td>
                    <td style={{ padding: "10px 12px", color: overdue ? "#f87171" : DIM }}>
                      {formatDate(o.deliveryDeadline)}
                      {overdue && <span style={{ marginLeft: 4, color: "#f87171", fontSize: 9 }}>OVERDUE</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {o.proofMode ? (
                        <span style={{ background: "rgba(180,83,9,0.3)", color: "#fbbf24", border: "1px solid rgba(180,83,9,0.5)", padding: "2px 6px", fontSize: 9, letterSpacing: "0.1em" }}>
                          PROOF
                        </span>
                      ) : <span style={{ color: DIM }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: DIM, fontSize: 11 }}>{nextAction(o)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Link href={`/admin/boardroom/orders/${o.id}`} style={{ color: GOLD, textDecoration: "none", fontSize: 10, border: `1px solid rgba(201,169,110,0.3)`, padding: "4px 8px" }}>
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ marginTop: 16, ...MONO, fontSize: 10, color: DIM }}>
          Stubs: A = ProductArtifact · F = FalsificationEntry · H = OutcomeHypothesis · Green = exists · Red = missing
        </div>
      </div>
    </AdminLayout>
  );
}
