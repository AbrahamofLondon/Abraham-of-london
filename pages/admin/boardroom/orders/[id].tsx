/**
 * pages/admin/boardroom/orders/[id].tsx
 *
 * Boardroom Brief order detail and review page.
 * Shows order, stubs, entitlement, audit trail, and action buttons.
 * Admin-guarded. Delivery requires explicit human confirmation.
 */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const GOLD = "#C9A96E";
const DIM = "rgba(242,241,238,0.35)";
const RULE = "rgba(255,255,255,0.07)";

type OrderDetail = {
  id: string;
  email: string;
  paymentStatus: string;
  deliveryStatus: string;
  riskLevel: string | null;
  score: number | null;
  source: string;
  proofMode: boolean;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  deliveryDeadline: string;
  stripeSessionId: string;
  metadata: Record<string, unknown> | null;
};

type StubSummary = {
  status: string;
  createdAt: string;
  [key: string]: unknown;
} | null;

type Props = {
  orderId: string;
  order: OrderDetail | null;
  artifact: StubSummary;
  falsification: StubSummary;
  hypothesis: StubSummary;
  entitlement: { productCode: string; tier: string; createdAt: string } | null;
  auditLogs: Array<{ id: string; action: string; createdAt: string; actorEmail?: string | null }>;
  notFound: boolean;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const id = typeof ctx.params?.id === "string" ? ctx.params.id : "";

  try {
    const { prisma } = await import("@/lib/prisma");

    const order = await prisma.boardroomBriefOrder.findUnique({ where: { id } });

    if (!order) {
      return { props: { orderId: id, order: null, artifact: null, falsification: null, hypothesis: null, entitlement: null, auditLogs: [], notFound: true } };
    }

    const [artifact, falsification, hypothesis, entitlement, auditLogs] = await Promise.all([
      prisma.productArtifact.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
        select: { id: true, artifactId: true, status: true, deliveryStatus: true, generatedBy: true, createdAt: true, updatedAt: true },
      }),
      prisma.falsificationEntry.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
        select: { id: true, productCode: true, status: true, claimOrRecommendation: true, confidenceLevel: true, createdAt: true, updatedAt: true },
      }),
      prisma.outcomeHypothesis.findFirst({
        where: { sourceRunId: id },
        select: { id: true, hypothesisId: true, status: true, predictedDecisionMove: true, createdAt: true, updatedAt: true },
      }),
      prisma.clientEntitlement.findFirst({
        where: { email: order.email, productCode: "boardroom-brief" },
        orderBy: { createdAt: "desc" },
        select: { productCode: true, tier: true, createdAt: true },
      }),
      prisma.accessAuditLog.findMany({
        where: { targetKey: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, action: true, createdAt: true, actorEmail: true },
      }).catch(() => []),
    ]);

    const meta = (order.metadata as Record<string, unknown> | null) ?? {};
    const proofMode = meta.proofMode === "true" || meta.proofMode === true;
    const deliveryDeadline = new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();

    return {
      props: {
        orderId: id,
        notFound: false,
        order: {
          id: order.id,
          email: order.email,
          paymentStatus: order.paymentStatus,
          deliveryStatus: order.deliveryStatus,
          riskLevel: order.riskLevel,
          score: order.score,
          source: order.source,
          proofMode,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          deliveredAt: order.deliveredAt?.toISOString() ?? null,
          deliveryDeadline,
          stripeSessionId: order.stripeSessionId,
          metadata: meta,
        },
        artifact: artifact ? { ...artifact, createdAt: artifact.createdAt.toISOString(), updatedAt: artifact.updatedAt.toISOString() } : null,
        falsification: falsification ? { ...falsification, createdAt: falsification.createdAt.toISOString(), updatedAt: falsification.updatedAt.toISOString() } : null,
        hypothesis: hypothesis ? { ...hypothesis, createdAt: hypothesis.createdAt.toISOString(), updatedAt: hypothesis.updatedAt.toISOString() } : null,
        entitlement: entitlement ? { ...entitlement, createdAt: entitlement.createdAt.toISOString() } : null,
        auditLogs: auditLogs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      },
    };
  } catch {
    return { props: { orderId: id, order: null, artifact: null, falsification: null, hypothesis: null, entitlement: null, auditLogs: [], notFound: false } };
  }
};

// ── Components ────────────────────────────────────────────────────────────────

function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: `1px solid ${RULE}` }}>
      <div style={{ ...MONO, fontSize: 10, color: DIM, textTransform: "uppercase", letterSpacing: "0.12em", width: 160, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 12, color: accent ?? "#f2f1ee" }}>{value ?? "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ ...MONO, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );
}

function StubCard({ label, stub }: { label: string; stub: StubSummary }) {
  if (!stub) {
    return (
      <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", ...MONO, fontSize: 11, color: "#f87171" }}>
        {label}: NOT FOUND
      </div>
    );
  }
  return (
    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${RULE}`, marginBottom: 8 }}>
      <div style={{ ...MONO, fontSize: 10, color: GOLD, marginBottom: 6 }}>{label}</div>
      {Object.entries(stub).map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 12, ...MONO, fontSize: 11, marginBottom: 2 }}>
          <span style={{ color: DIM, width: 160 }}>{k}</span>
          <span style={{ color: "#f2f1ee" }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  label, onClick, disabled, colour,
}: { label: string; onClick: () => void; disabled?: boolean; colour?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        padding: "8px 16px",
        background: disabled ? "rgba(255,255,255,0.04)" : (colour ? `${colour}1A` : "rgba(201,169,110,0.12)"),
        border: `1px solid ${disabled ? RULE : (colour ? `${colour}55` : "rgba(201,169,110,0.35)")}`,
        color: disabled ? DIM : (colour ?? GOLD),
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default function BoardroomOrderDetailPage({
  orderId, order, artifact, falsification, hypothesis, entitlement, auditLogs, notFound,
}: Props) {
  const [actionState, setActionState] = React.useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });
  const [currentStatus, setCurrentStatus] = React.useState(order?.deliveryStatus ?? "");

  if (notFound || !order) {
    return (
      <AdminLayout>
        <Head><title>Order Not Found | Admin</title></Head>
        <div style={{ padding: "32px", color: DIM }}>
          Order <code>{orderId}</code> not found. <Link href="/admin/boardroom/orders" style={{ color: GOLD }}>← Back to orders</Link>
        </div>
      </AdminLayout>
    );
  }

  const isOverdue = order.deliveryStatus !== "delivered" && new Date(order.deliveryDeadline) < new Date();

  async function transitionTo(nextStatus: string) {
    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch(`/api/admin/boardroom/orders/${order!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus }),
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.error || data.reason || "Update failed", success: null });
      } else {
        setCurrentStatus(data.order.deliveryStatus);
        setActionState({ loading: false, error: null, success: `Status updated to ${data.order.deliveryStatus}` });
      }
    } catch (err) {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  async function createCaseStudyDraft() {
    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch("/api/admin/case-studies/boardroom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order!.id }),
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.reason || "Case study creation failed", success: null });
      } else {
        setActionState({ loading: false, error: null, success: data.alreadyExists ? "Case study already exists" : "Case study draft created" });
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  return (
    <AdminLayout>
      <Head><title>Order {order.id.slice(0, 12)} | Boardroom Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 900 }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/admin/boardroom/orders" style={{ ...MONO, fontSize: 11, color: GOLD, textDecoration: "none" }}>
            ← Boardroom Orders
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ ...MONO, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
            Order Detail
            {order.proofMode && (
              <span style={{ marginLeft: 10, background: "rgba(180,83,9,0.3)", color: "#fbbf24", border: "1px solid rgba(180,83,9,0.5)", padding: "2px 8px", fontSize: 9, letterSpacing: "0.1em" }}>
                PROOF MODE
              </span>
            )}
            {isOverdue && (
              <span style={{ marginLeft: 10, background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", fontSize: 9 }}>
                OVERDUE
              </span>
            )}
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 400, color: "#f5f0e8", ...MONO }}>{order.id}</h1>
        </div>

        {/* Action feedback */}
        {actionState.error && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", ...MONO, fontSize: 12, marginBottom: 16 }}>
            {actionState.error}
          </div>
        )}
        {actionState.success && (
          <div style={{ padding: "10px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", ...MONO, fontSize: 12, marginBottom: 16 }}>
            {actionState.success}
          </div>
        )}

        <Section title="Order Details">
          <Field label="Order ID" value={order.id} />
          <Field label="Customer" value={order.email} />
          <Field label="Payment Status" value={order.paymentStatus} accent={order.paymentStatus === "paid" ? "#4ade80" : "#f87171"} />
          <Field label="Delivery Status" value={currentStatus} accent={currentStatus === "delivered" ? "#4ade80" : GOLD} />
          <Field label="Risk Level" value={order.riskLevel} />
          <Field label="Score" value={order.score !== null ? String(order.score) : null} />
          <Field label="Source" value={order.source} />
          <Field label="Proof Mode" value={order.proofMode ? "YES" : "No"} accent={order.proofMode ? "#fbbf24" : undefined} />
          <Field label="Created" value={new Date(order.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} />
          <Field label="Delivery Deadline" value={new Date(order.deliveryDeadline).toLocaleString("en-GB", { timeZone: "Europe/London" })} accent={isOverdue ? "#f87171" : undefined} />
          <Field label="Delivered At" value={order.deliveredAt ? new Date(order.deliveredAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Not delivered"} />
          <Field label="Stripe Session" value={<span style={{ ...MONO, fontSize: 11 }}>{order.stripeSessionId.slice(0, 30)}…</span>} />
        </Section>

        <Section title="Entitlement">
          {entitlement ? (
            <>
              <Field label="Product Code" value={entitlement.productCode} />
              <Field label="Tier" value={entitlement.tier} />
              <Field label="Granted At" value={new Date(entitlement.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} />
            </>
          ) : (
            <div style={{ ...MONO, fontSize: 11, color: "#f87171", padding: "8px 0" }}>No entitlement found for this email + product code.</div>
          )}
        </Section>

        <Section title="Evidence Stubs">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <StubCard label="ProductArtifact" stub={artifact} />
            <StubCard label="FalsificationEntry" stub={falsification} />
            <StubCard label="OutcomeHypothesis" stub={hypothesis} />
          </div>
        </Section>

        <Section title="Actions">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionButton
              label="Start Review"
              onClick={() => transitionTo("in_review")}
              disabled={actionState.loading || !["requested", "paid"].includes(currentStatus)}
            />
            <ActionButton
              label="Mark Dossier Generated"
              onClick={() => transitionTo("dossier_generated")}
              disabled={actionState.loading || currentStatus !== "in_review"}
            />
            <ActionButton
              label="Mark Delivered"
              onClick={() => {
                if (!confirm(`Confirm: mark order ${order.id} as delivered? This persists deliveredAt and cannot be undone without a DB update.`)) return;
                transitionTo("delivered");
              }}
              disabled={actionState.loading || currentStatus !== "dossier_generated"}
              colour="#4ade80"
            />
            <ActionButton
              label="Create Case Study Draft"
              onClick={createCaseStudyDraft}
              disabled={actionState.loading}
              colour="#818cf8"
            />
          </div>
          <p style={{ ...MONO, fontSize: 10, color: DIM, marginTop: 10 }}>
            Status flow: requested / paid → in_review → dossier_generated → delivered
          </p>
        </Section>

        {auditLogs.length > 0 && (
          <Section title="Audit Trail">
            <table style={{ width: "100%", borderCollapse: "collapse", ...MONO, fontSize: 11 }}>
              <thead>
                <tr>
                  {["Timestamp", "Action", "Actor"].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${RULE}` }}>
                    <td style={{ padding: "6px 8px", color: DIM }}>{new Date(l.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                    <td style={{ padding: "6px 8px", color: "#f2f1ee" }}>{l.action}</td>
                    <td style={{ padding: "6px 8px", color: DIM }}>{l.actorEmail ?? "system"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}
      </div>
    </AdminLayout>
  );
}
