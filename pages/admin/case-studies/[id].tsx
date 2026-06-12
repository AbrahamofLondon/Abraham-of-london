/**
 * pages/admin/case-studies/[id].tsx
 *
 * Admin preview page for a case study.
 * Used by the Boardroom order detail page's "Open Draft" link.
 *
 * Requirements:
 * - Admin-auth protected
 * - Loads case study by ID
 * - Displays linked Boardroom order ID
 * - Displays customer
 * - Displays draft status
 * - Displays draft content or structured placeholder
 * - Links back to Boardroom order
 * - Shows whether ProductArtifact is linked
 * - Does not expose customer-facing delivery accidentally
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

type EvidenceLink = {
  id: string;
  sourceType: string;
  sourceId: string;
  notes: string | null;
  verificationStatus: string;
};

type CaseStudyRecord = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  visibilityStatus: string;
  evidenceStatus: string;
  outcomeStatus: string;
  consentStatus: string;
  verificationStatus: string;
  publicationAllowed: boolean;
  anonymised: boolean;
  narrative: Record<string, unknown> | null;
  evidenceLinks: EvidenceLink[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  record: CaseStudyRecord | null;
  boardroomOrderId: string | null;
  boardroomOrderStatus: string | null;
  artifactStatus: string | null;
  notFound: boolean;
  error: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const id = typeof ctx.params?.id === "string" ? ctx.params.id : "";

  if (!id) {
    return { props: { record: null, boardroomOrderId: null, boardroomOrderStatus: null, artifactStatus: null, notFound: true, error: "No case study ID provided" } };
  }

  try {
    const { getCaseStudyById } = await import("@/lib/evidence/case-study-service");
    const record = await getCaseStudyById(id);

    if (!record) {
      return { props: { record: null, boardroomOrderId: null, boardroomOrderStatus: null, artifactStatus: null, notFound: true, error: "Case study not found" } };
    }

    // Find linked Boardroom order
    const boardroomEvidence = record.evidenceLinks?.find(
      (e: EvidenceLink) => e.sourceType === "boardroom_brief_order"
    );
    const boardroomOrderId = boardroomEvidence?.sourceId ?? null;

    let boardroomOrderStatus: string | null = null;
    let artifactStatus: string | null = null;

    if (boardroomOrderId) {
      const { prisma } = await import("@/lib/prisma");
      const order = await prisma.boardroomBriefOrder.findUnique({
        where: { id: boardroomOrderId },
        select: { deliveryStatus: true },
      });
      boardroomOrderStatus = order?.deliveryStatus ?? null;

      const artifact = await prisma.productArtifact.findUnique({
        where: { artifactId: `pa_boardroom_${boardroomOrderId}` },
        select: { status: true, deliveryStatus: true },
      });
      artifactStatus = artifact ? `${artifact.status} / ${artifact.deliveryStatus}` : null;
    }

    return {
      props: {
        record,
        boardroomOrderId,
        boardroomOrderStatus,
        artifactStatus,
        notFound: false,
        error: null,
      },
    };
  } catch (err) {
    return {
      props: {
        record: null, boardroomOrderId: null, boardroomOrderStatus: null,
        artifactStatus: null, notFound: false,
        error: err instanceof Error ? err.message : "Failed to load case study",
      },
    };
  }
};

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

export default function AdminCaseStudyPage({ record, boardroomOrderId, boardroomOrderStatus, artifactStatus, notFound, error }: Props) {
  if (notFound || !record) {
    return (
      <AdminLayout>
        <Head><title>Case Study Not Found | Admin</title></Head>
        <div style={{ padding: "32px", color: DIM }}>
          <p style={{ ...MONO, fontSize: 12, color: "#f87171", marginBottom: 12 }}>
            {error ?? "Case study not found."}
          </p>
          <Link href="/admin/boardroom/orders" style={{ color: GOLD, ...MONO, fontSize: 11 }}>
            ← Back to Boardroom Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const narrative = record.narrative as Record<string, unknown> | null;
  const evidenceCount = record.evidenceLinks?.length ?? 0;
  const displayStatus = record.visibilityStatus || "DRAFT";

  return (
    <AdminLayout>
      <Head><title>{record.title} | Admin Case Study</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 900 }}>
        <div style={{ marginBottom: 8 }}>
          <Link href="/admin/boardroom/orders" style={{ ...MONO, fontSize: 11, color: GOLD, textDecoration: "none" }}>
            ← Boardroom Orders
          </Link>
          {boardroomOrderId && (
            <span style={{ marginLeft: 16 }}>
              <Link href={`/admin/boardroom/orders/${boardroomOrderId}`} style={{ ...MONO, fontSize: 11, color: "#818cf8", textDecoration: "none" }}>
                → Order {boardroomOrderId.slice(0, 12)}…
              </Link>
            </span>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ ...MONO, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
            Case Study Preview
            <span style={{ marginLeft: 10, background: "rgba(201,169,110,0.12)", color: GOLD, border: `1px solid ${GOLD}44`, padding: "2px 8px", fontSize: 9, letterSpacing: "0.1em" }}>
              {displayStatus}
            </span>
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 400, color: "#f5f0e8", ...MONO }}>{record.title}</h1>
        </div>

        <Section title="Details">
          <Field label="ID" value={record.id} />
          <Field label="Title" value={record.title} />
          <Field label="Slug" value={record.slug ?? "—"} />
          <Field label="Status" value={displayStatus} accent={displayStatus === "DRAFT" ? "#fbbf24" : displayStatus === "PUBLISHED" ? "#4ade80" : DIM} />
          <Field label="Verification" value={record.verificationStatus} />
          <Field label="Consent" value={record.consentStatus} />
          <Field label="Anonymised" value={record.anonymised ? "Yes" : "No"} />
          <Field label="Publication Allowed" value={record.publicationAllowed ? "Yes" : "No"} />
          <Field label="Created" value={new Date(record.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} />
          <Field label="Updated" value={new Date(record.updatedAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} />
        </Section>

        {boardroomOrderId && (
          <Section title="Linked Boardroom Order">
            <Field label="Order ID" value={boardroomOrderId} />
            <Field label="Delivery Status" value={boardroomOrderStatus ?? "Unknown"} />
            <Field label="ProductArtifact" value={artifactStatus ?? "Not found"} />
            <div style={{ marginTop: 8 }}>
              <Link
                href={`/admin/boardroom/orders/${boardroomOrderId}`}
                style={{ ...MONO, fontSize: 11, color: "#818cf8", textDecoration: "none", border: "1px solid rgba(129,140,248,0.3)", padding: "6px 12px", display: "inline-block" }}
              >
                → Open Boardroom Order
              </Link>
            </div>
          </Section>
        )}

        <Section title="Evidence Links">
          {evidenceCount > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", ...MONO, fontSize: 11 }}>
              <thead>
                <tr>
                  {["Source Type", "Source ID", "Verification", "Notes"].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.evidenceLinks?.map((ev, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${RULE}` }}>
                    <td style={{ padding: "6px 8px", color: "#f2f1ee" }}>{ev.sourceType}</td>
                    <td style={{ padding: "6px 8px", color: DIM }}>{ev.sourceId}</td>
                    <td style={{ padding: "6px 8px", color: DIM }}>{ev.verificationStatus}</td>
                    <td style={{ padding: "6px 8px", color: DIM }}>{ev.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ ...MONO, fontSize: 11, color: DIM, padding: "8px 0" }}>No evidence links.</div>
          )}
        </Section>

        <Section title="Narrative / Content">
          {narrative ? (
            <div style={{ ...MONO, fontSize: 11, color: "#f2f1ee", lineHeight: 1.6 }}>
              <Field label="Product Code" value={String(narrative.productCode ?? "—")} />
              <Field label="Case Type" value={String(narrative.caseType ?? "—")} />
              <Field label="Evidence Status" value={String(narrative.evidenceStatus ?? "—")} />
              <Field label="Outcome Status" value={String(narrative.outcomeStatus ?? "—")} />
              {String(narrative.adminNotes ?? "") && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${RULE}`, borderRadius: 4 }}>
                  <p style={{ ...MONO, fontSize: 10, color: GOLD, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Notes</p>
                  <p style={{ ...MONO, fontSize: 11, color: "#f2f1ee", whiteSpace: "pre-wrap" }}>{String(narrative.adminNotes)}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...MONO, fontSize: 11, color: DIM, padding: "8px 0" }}>
              No narrative content yet. This is a structured placeholder — content will appear once the draft is populated.
            </div>
          )}
        </Section>

        {/* Status badges */}
        <Section title="Pipeline Status">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge label="Case Study" status={displayStatus} />
            <StatusBadge label="Verification" status={record.verificationStatus} />
            <StatusBadge label="Consent" status={record.consentStatus} />
            {boardroomOrderStatus && <StatusBadge label="Boardroom Delivery" status={boardroomOrderStatus} />}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  const color = status === "DRAFT" || status === "PENDING" ? "#fbbf24"
    : status === "PUBLISHED" || status === "VERIFIED" || status === "delivered" ? "#4ade80"
    : status === "UNVERIFIED" ? "#f87171"
    : DIM;

  return (
    <div style={{ ...MONO, fontSize: 10, padding: "4px 10px", border: `1px solid ${color}44`, color, background: `${color}11` }}>
      {label}: {status}
    </div>
  );
}
