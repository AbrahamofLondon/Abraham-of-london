/**
 * pages/admin/boardroom/orders/[id].tsx
 *
 * Boardroom Brief order detail and review page.
 * Shows order, stubs, entitlement, audit trail, and action buttons.
 * Admin-guarded. Delivery requires explicit human confirmation.
 *
 * Uses the governed Boardroom delivery state machine.
 * States: paid → case_stubs_created → draft_generated → awaiting_operator_review
 *         → approved_for_delivery → customer_access_ready → delivered
 */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import {
  isValidTransition,
  DELIVERY_STATUS_LABELS,
  DELIVERY_STATUS_COLORS,
  type BoardroomDeliveryStatus,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";

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
  deliveryStatus?: string;
  createdAt: string;
  artifactId?: string;
  [key: string]: unknown;
} | null;

type CaseStudyDraftInfo = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
} | null;

type Props = {
  orderId: string;
  order: OrderDetail | null;
  artifact: StubSummary;
  falsification: StubSummary;
  hypothesis: StubSummary;
  caseStudyDraft: CaseStudyDraftInfo;
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
      return {
        props: {
          orderId: id, order: null, artifact: null, falsification: null,
          hypothesis: null, caseStudyDraft: null, entitlement: null,
          auditLogs: [], notFound: true,
        },
      };
    }

    const [artifact, falsification, hypothesis, entitlement, auditLogs, caseStudyEvidence] = await Promise.all([
      prisma.productArtifact.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
        select: {
          id: true, artifactId: true, status: true, deliveryStatus: true,
          generatedBy: true, downloadUrl: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.falsificationEntry.findFirst({
        where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: id },
        select: {
          id: true, productCode: true, status: true, claimOrRecommendation: true,
          confidenceLevel: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.outcomeHypothesis.findFirst({
        where: { sourceRunId: id },
        select: {
          id: true, hypothesisId: true, status: true, predictedDecisionMove: true,
          createdAt: true, updatedAt: true,
        },
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
      // Check for existing case study draft linked to this order
      prisma.caseStudyEvidence.findFirst({
        where: { sourceType: "boardroom_brief_order", sourceId: id },
        select: { caseStudyId: true },
      }).then(async (evidence) => {
        if (!evidence) return null;
        const cs = await prisma.caseStudy.findUnique({
          where: { id: evidence.caseStudyId },
          select: { id: true, title: true, status: true, createdAt: true },
        });
        return cs;
      }),
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
        artifact: artifact
          ? { ...artifact, createdAt: artifact.createdAt.toISOString(), updatedAt: artifact.updatedAt.toISOString() }
          : null,
        falsification: falsification
          ? { ...falsification, createdAt: falsification.createdAt.toISOString(), updatedAt: falsification.updatedAt.toISOString() }
          : null,
        hypothesis: hypothesis
          ? { ...hypothesis, createdAt: hypothesis.createdAt.toISOString(), updatedAt: hypothesis.updatedAt.toISOString() }
          : null,
        caseStudyDraft: caseStudyEvidence
          ? {
              id: caseStudyEvidence.id,
              title: caseStudyEvidence.title,
              status: caseStudyEvidence.status,
              createdAt: caseStudyEvidence.createdAt.toISOString(),
            }
          : null,
        entitlement: entitlement
          ? { ...entitlement, createdAt: entitlement.createdAt.toISOString() }
          : null,
        auditLogs: auditLogs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      },
    };
  } catch {
    return {
      props: {
        orderId: id, order: null, artifact: null, falsification: null,
        hypothesis: null, caseStudyDraft: null, entitlement: null,
        auditLogs: [], notFound: false,
      },
    };
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
  label, onClick, disabled, colour, title,
}: { label: string; onClick: () => void; disabled?: boolean; colour?: string; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BoardroomOrderDetailPage({
  orderId, order, artifact, falsification, hypothesis, caseStudyDraft,
  entitlement, auditLogs, notFound,
}: Props) {
  const [actionState, setActionState] = React.useState<{
    loading: boolean; error: string | null; success: string | null;
  }>({ loading: false, error: null, success: null });
  const [currentStatus, setCurrentStatus] = React.useState(order?.deliveryStatus ?? "");
  const [currentArtifact, setCurrentArtifact] = React.useState(order?.deliveryStatus ?? "");

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

  const isOverdue = currentStatus !== "delivered" && new Date(order.deliveryDeadline) < new Date();
  const statusColor = DELIVERY_STATUS_COLORS[currentStatus as BoardroomDeliveryStatus] ?? GOLD;
  const statusLabel = DELIVERY_STATUS_LABELS[currentStatus as BoardroomDeliveryStatus] ?? currentStatus;

  // Determine what actions are available based on current state
  const canTransitionTo = (target: string) => isValidTransition(currentStatus, target);
  const canStartReview = canTransitionTo("in_review") || canTransitionTo("awaiting_operator_review");
  const canGenerateDraft = canTransitionTo("draft_generated");
  const canApproveForDelivery = canTransitionTo("approved_for_delivery");
  const canCreateCustomerAccess = canTransitionTo("customer_access_ready");
  const canDeliver = canTransitionTo("delivered");

  // Check if artefact is in a deliverable state
  const artifactIsReady = artifact?.status === "READY" || artifact?.status === "READY_FOR_DELIVERY";
  const hasAdminPreviewUrl = artifact?.downloadUrl != null;
  const hasCustomerAccessUrl = order.metadata?.customerAccessUrl != null;

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
        setActionState({
          loading: false, error: null,
          success: data.alreadyExists
            ? "Case study draft exists. Status: Awaiting operator review."
            : "Case study draft created.",
        });
        // Reload the page to show the new draft
        window.location.reload();
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  async function generateDossierDraft() {
    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch(`/api/admin/boardroom/orders/${order!.id}/generate-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.error || data.reason || "Dossier generation failed", success: null });
      } else {
        setCurrentStatus(data.order.deliveryStatus);
        setActionState({ loading: false, error: null, success: "Dossier draft generated and ready for review." });
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  async function approveForDelivery() {
    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch(`/api/admin/boardroom/orders/${order!.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.error || data.reason || "Approval failed", success: null });
      } else {
        setCurrentStatus(data.order.deliveryStatus);
        setActionState({ loading: false, error: null, success: "Dossier approved for delivery." });
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  async function generateCustomerAccess() {
    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch(`/api/admin/boardroom/orders/${order!.id}/customer-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.error || data.reason || "Customer access generation failed", success: null });
      } else {
        setCurrentStatus(data.order.deliveryStatus);
        setActionState({ loading: false, error: null, success: "Customer access link created." });
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  async function markDelivered() {
    if (!confirm(
      `Confirm: mark order ${order!.id} as delivered?\n\n` +
      `This will:\n` +
      `- Set deliveryStatus to "delivered"\n` +
      `- Persist deliveredAt timestamp\n` +
      `- Send delivery notification to customer\n\n` +
      `This cannot be undone without a DB update.`
    )) return;

    setActionState({ loading: true, error: null, success: null });
    try {
      const r = await fetch(`/api/admin/boardroom/orders/${order!.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await r.json();
      if (!data.ok) {
        setActionState({ loading: false, error: data.error || data.reason || "Delivery failed", success: null });
      } else {
        setCurrentStatus(data.order.deliveryStatus);
        setActionState({ loading: false, error: null, success: "Order delivered successfully." });
      }
    } catch {
      setActionState({ loading: false, error: "Network error", success: null });
    }
  }

  // Build the admin preview URL if artifact exists
  const adminPreviewUrl = artifact?.downloadUrl
    ? (typeof artifact.downloadUrl === "string" ? artifact.downloadUrl : null)
    : caseStudyDraft
      ? `/admin/case-studies/${caseStudyDraft.id}`
      : null;

  // Build dossier preview URL
  const dossierPreviewUrl = (order.metadata as Record<string, unknown> | null)?.dossierId
    ? `/boardroom/dossier/${String((order.metadata as Record<string, unknown>).dossierId)}`
    : null;

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
          <Field label="Delivery Status" value={currentStatus} accent={statusColor} />
          <Field label="Status Label" value={statusLabel} accent={statusColor} />
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

        {/* Case Study / Dossier Draft Section */}
        <Section title="Dossier / Case Study Draft">
          {caseStudyDraft ? (
            <div style={{
              padding: "12px 16px",
              background: "rgba(201,169,110,0.08)",
              border: "1px solid rgba(201,169,110,0.3)",
              marginBottom: 12,
            }}>
              <p style={{ ...MONO, fontSize: 11, color: GOLD, marginBottom: 4 }}>
                Case study draft exists.
              </p>
              <p style={{ ...MONO, fontSize: 10, color: DIM, marginBottom: 10 }}>
                Status: {currentStatus === "awaiting_operator_review" || currentStatus === "draft_generated"
                  ? "Awaiting operator review"
                  : currentStatus}
                {caseStudyDraft.status ? ` · Case study status: ${caseStudyDraft.status}` : ""}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ActionButton
                  label="Open Draft"
                  onClick={() => window.open(`/admin/case-studies/${caseStudyDraft.id}`, "_blank")}
                  colour="#818cf8"
                />
                {dossierPreviewUrl && (
                  <ActionButton
                    label="Preview Dossier"
                    onClick={() => window.open(dossierPreviewUrl, "_blank")}
                    colour="#818cf8"
                  />
                )}
                {Boolean(artifact?.downloadUrl) && (
                  <ActionButton
                    label="View ProductArtifact"
                    onClick={() => window.open(String(artifact?.downloadUrl), "_blank")}
                    colour="#818cf8"
                  />
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...MONO, fontSize: 11, color: DIM, padding: "8px 0", marginBottom: 12 }}>
              No case study draft created yet. Use "Generate Dossier Draft" below to create one.
            </div>
          )}

          {/* Admin preview link from artifact */}
          {adminPreviewUrl && !caseStudyDraft && (
            <div style={{ marginTop: 8 }}>
              <ActionButton
                label="Open Admin Preview"
                onClick={() => window.open(adminPreviewUrl, "_blank")}
                colour="#818cf8"
              />
            </div>
          )}
        </Section>

        <Section title="Actions">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Start Review — moves paid → in_review */}
            <ActionButton
              label="Start Review"
              onClick={() => transitionTo("in_review")}
              disabled={actionState.loading || !canStartReview}
            />

            {/* Generate Dossier Draft — creates the actual dossier + case study */}
            <ActionButton
              label="Generate Dossier Draft"
              onClick={generateDossierDraft}
              disabled={actionState.loading || !canGenerateDraft}
              colour="#60a5fa"
              title="Generate the Boardroom dossier draft and case study from the paid order"
            />

            {/* Create Case Study Draft — legacy action, kept for compatibility */}
            <ActionButton
              label="Create Case Study Draft"
              onClick={createCaseStudyDraft}
              disabled={actionState.loading}
              colour="#818cf8"
            />

            {/* Approve for Delivery */}
            <ActionButton
              label="Approve for Delivery"
              onClick={approveForDelivery}
              disabled={actionState.loading || !canApproveForDelivery}
              colour="#fbbf24"
              title="Approve the dossier draft for customer delivery"
            />

            {/* Generate Customer Access */}
            <ActionButton
              label="Generate Customer Access"
              onClick={generateCustomerAccess}
              disabled={actionState.loading || !canCreateCustomerAccess}
              colour="#4ade80"
              title="Create secure customer access link"
            />

            {/* Mark Delivered — guarded */}
            <ActionButton
              label="Mark Delivered"
              onClick={markDelivered}
              disabled={
                actionState.loading ||
                !canDeliver ||
                !artifactIsReady ||
                !hasAdminPreviewUrl
              }
              colour="#4ade80"
              title={
                !canDeliver ? "Cannot deliver from current state" :
                !artifactIsReady ? "Cannot mark delivered: customer-facing artefact is not ready (artifact status must be READY or READY_FOR_DELIVERY)" :
                !hasAdminPreviewUrl ? "Cannot mark delivered: admin preview URL is missing" :
                "Mark as delivered and notify customer"
              }
            />

            {/* Mark Blocked */}
            <ActionButton
              label="Mark Blocked"
              onClick={() => transitionTo("blocked")}
              disabled={actionState.loading || !isValidTransition(currentStatus, "blocked")}
              colour="#ef4444"
            />
          </div>

          {/* Delivery readiness warnings */}
          {currentStatus === "delivered" && !artifactIsReady && (
            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              ...MONO, fontSize: 10, color: "#f87171",
            }}>
              ⚠ Warning: Order is marked delivered but ProductArtifact is not in READY state.
              This indicates a fulfilment pipeline gap.
            </div>
          )}

          <p style={{ ...MONO, fontSize: 10, color: DIM, marginTop: 10 }}>
            Governed state machine: paid → case_stubs_created → draft_generated → awaiting_operator_review → approved_for_delivery → customer_access_ready → delivered
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