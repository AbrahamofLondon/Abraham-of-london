/**
 * pages/admin/security-assurance-requests.tsx
 *
 * /admin/security-assurance-requests
 *
 * Admin review queue for controlled security assurance requests.
 * Read the request, update status, copy response templates.
 * Does not send documents automatically.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import AdminLayout from "@/components/admin/AdminLayout";
import { getSecurityAssuranceMaterialById } from "@/lib/security-assurance/security-assurance-pack-registry";
import type {
  SecurityAssuranceRequestStatus,
} from "@/lib/security-assurance/security-assurance-pack-registry";
import { buildSecurityAssuranceResponse } from "@/lib/security-assurance/security-assurance-response-builder";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const STATUS_OPTIONS: SecurityAssuranceRequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "PUBLIC_PACK_APPROVED",
  "NDA_REQUIRED",
  "RESTRICTED_PACK_APPROVED",
  "DECLINED",
  "FULFILLED",
];

const STATUS_COLOR: Record<string, string> = {
  NEW: "rgba(201,169,110,0.80)",
  UNDER_REVIEW: "rgba(147,197,253,0.75)",
  PUBLIC_PACK_APPROVED: "rgba(110,231,183,0.70)",
  NDA_REQUIRED: "rgba(253,186,116,0.75)",
  RESTRICTED_PACK_APPROVED: "rgba(110,231,183,0.70)",
  DECLINED: "rgba(252,165,165,0.60)",
  FULFILLED: "rgba(167,243,208,0.55)",
};

const LEVEL_COLOR: Record<string, string> = {
  PUBLIC: "rgba(110,231,183,0.65)",
  REQUESTABLE: "rgba(253,186,116,0.65)",
  RESTRICTED: "rgba(252,165,165,0.65)",
};

type RequestRow = {
  id: string;
  name: string | null;
  email: string;
  organisation: string | null;
  role: string | null;
  requestedMaterial: string;
  procurementStage: string | null;
  message: string | null;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  requests: RequestRow[];
  counts: {
    NEW: number;
    UNDER_REVIEW: number;
    total: number;
  };
};

const RFI_PACK_ID = "enterprise-assurance-rfi-answer-pack";

function ResponseTemplate({
  request,
  currentStatus,
}: {
  request: RequestRow;
  currentStatus: string;
}) {
  const material = getSecurityAssuranceMaterialById(request.requestedMaterial);
  const isRfiPack = request.requestedMaterial === RFI_PACK_ID;

  // For RFI pack and approval statuses, use the response builder
  const builtResponse =
    isRfiPack ||
    currentStatus === "PUBLIC_PACK_APPROVED" ||
    currentStatus === "RESTRICTED_PACK_APPROVED"
      ? buildSecurityAssuranceResponse({
          requestedMaterialId: request.requestedMaterial,
          requesterName: request.name,
          organisation: request.organisation,
          procurementStage: request.procurementStage,
        })
      : null;

  // Fallback templates for other statuses
  const fallbackTemplates: Record<string, string> = {
    NDA_REQUIRED: `Hi${request.name ? ` ${request.name.split(" ")[0]}` : ""},\n\nThank you for your request for the ${material?.title ?? request.requestedMaterial}. Given the sensitivity of this material, we share it under NDA. Please reply confirming you are willing to proceed under a mutual NDA and I will send the agreement for signature.\n\nBest regards,\nAbraham of London`,
    DECLINED: `Hi${request.name ? ` ${request.name.split(" ")[0]}` : ""},\n\nThank you for your request. After review, we are not in a position to share the requested material at this time. This may be because the procurement stage is not yet appropriate or additional context is needed.\n\nIf you have further questions, please reply to this email.\n\nBest regards,\nAbraham of London`,
  };

  const template =
    builtResponse?.body ??
    fallbackTemplates[currentStatus] ??
    fallbackTemplates["DECLINED"] ??
    "";

  const disclosureNotice = builtResponse?.disclosureNotice;
  const recommendedAttachments = builtResponse?.recommendedAttachments ?? [];

  return (
    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* RFI-specific meta */}
      {isRfiPack && (
        <div
          style={{
            border: `1px solid ${GOLD}18`,
            backgroundColor: `${GOLD}04`,
            padding: "0.6rem 0.75rem",
          }}
        >
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}77`, marginBottom: "0.3rem" }}>
            Suggested action — RFI pack
          </p>
          <p style={{ ...serif, fontSize: "0.83rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
            Review requester identity, procurement stage, and intended use before release. Confirm organisation is genuine. The pack contains honest assurance boundaries — no SOC 2, ISO 27001, or pen-test completion is claimed.
          </p>
          {recommendedAttachments.length > 0 && (
            <div style={{ marginTop: "0.4rem" }}>
              <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                Recommended materials to share
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {recommendedAttachments.map((id) => (
                  <span
                    key={id}
                    style={{
                      ...mono,
                      fontSize: "6px",
                      letterSpacing: "0.10em",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "1px 6px",
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclosure notice */}
      {disclosureNotice && (
        <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", color: "rgba(255,200,80,0.55)" }}>
          {disclosureNotice}
        </p>
      )}

      <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
        {isRfiPack ? "RFI response template" : "Response template"}
      </p>

      <pre
        style={{
          fontFamily: "inherit",
          fontSize: "11px",
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.45)",
          whiteSpace: "pre-wrap",
          border: "1px solid rgba(255,255,255,0.04)",
          backgroundColor: "rgba(255,255,255,0.01)",
          padding: "0.6rem 0.75rem",
        }}
      >
        {template}
      </pre>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(template)}
          style={{
            ...mono,
            fontSize: "6.5px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: `${GOLD}88`,
            background: "none",
            border: `1px solid ${GOLD}22`,
            padding: "0.25rem 0.55rem",
            cursor: "pointer",
          }}
        >
          {isRfiPack ? "Copy RFI response template" : "Copy template"}
        </button>
        {builtResponse && (
          <button
            onClick={() => navigator.clipboard.writeText(builtResponse.subject)}
            style={{
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              background: "none",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "0.25rem 0.55rem",
              cursor: "pointer",
            }}
          >
            Copy subject
          </button>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, onStatusChange }: { request: RequestRow; onStatusChange: (id: string, status: string, note: string) => void }) {
  const [expanded, setExpanded] = React.useState(request.status === "NEW");
  const [status, setStatus] = React.useState<string>(request.status);
  const [note, setNote] = React.useState<string>(request.decisionNote ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const material = getSecurityAssuranceMaterialById(request.requestedMaterial);
  const isRfiPack = request.requestedMaterial === RFI_PACK_ID;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/security-assurance-requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status, decisionNote: note }),
      });
      if (res.ok) {
        setSaved(true);
        onStatusChange(request.id, status, note);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${request.status === "NEW" ? `${GOLD}30` : "rgba(255,255,255,0.06)"}`,
        backgroundColor: request.status === "NEW" ? `${GOLD}04` : "rgba(255,255,255,0.01)",
        padding: "1rem",
      }}
    >
      {/* Summary row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: STATUS_COLOR[request.status] ?? "rgba(255,255,255,0.40)",
                border: `1px solid ${STATUS_COLOR[request.status] ?? "rgba(255,255,255,0.15)"}33`,
                padding: "1px 6px",
              }}
            >
              {request.status.replace(/_/g, " ")}
            </span>
            {material && (
              <span
                style={{
                  ...mono,
                  fontSize: "6.5px",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: LEVEL_COLOR[material.disclosureLevel] ?? "rgba(255,255,255,0.30)",
                  border: `1px solid ${LEVEL_COLOR[material.disclosureLevel] ?? "rgba(255,255,255,0.10)"}44`,
                  padding: "1px 5px",
                }}
              >
                {material.disclosureLevel}
                {material.requiresNda && " · NDA required"}
              </span>
            )}
            {isRfiPack && (
              <span
                style={{
                  ...mono,
                  fontSize: "6px",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: `${GOLD}99`,
                  border: `1px solid ${GOLD}22`,
                  padding: "1px 5px",
                  backgroundColor: `${GOLD}06`,
                }}
              >
                Enterprise RFI
              </span>
            )}
          </div>
          <p style={{ ...serif, fontSize: "0.92rem", color: "rgba(255,255,255,0.75)", marginTop: "0.25rem" }}>
            {material?.title ?? request.requestedMaterial}
          </p>
          <div style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.35)", marginTop: "0.15rem" }}>
            {request.email}
            {request.organisation && ` · ${request.organisation}`}
            {request.role && ` · ${request.role}`}
          </div>
          <div style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.20)", marginTop: "0.1rem" }}>
            {new Date(request.createdAt).toLocaleString("en-GB")}
            {request.procurementStage && ` · Stage: ${request.procurementStage.replace(/_/g, " ")}`}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(request.email)}
            style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", background: "none", border: "1px solid rgba(255,255,255,0.06)", padding: "3px 8px", cursor: "pointer" }}
          >
            Copy email
          </button>
          <button
            onClick={() => setExpanded((x) => !x)}
            style={{ ...mono, fontSize: "6px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", background: "none", border: "1px solid rgba(255,255,255,0.06)", padding: "3px 8px", cursor: "pointer" }}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {request.message && (
            <div>
              <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.3rem" }}>Message</p>
              <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)" }}>{request.message}</p>
            </div>
          )}

          {/* Status update */}
          <div>
            <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.4rem" }}>Update status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    ...mono,
                    fontSize: "6.5px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: status === s ? (STATUS_COLOR[s] ?? "rgba(255,255,255,0.70)") : "rgba(255,255,255,0.28)",
                    background: "none",
                    border: `1px solid ${status === s ? (STATUS_COLOR[s] ?? "rgba(255,255,255,0.20)") + "44" : "rgba(255,255,255,0.06)"}`,
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Decision note (optional — not sent to requester)"
              rows={2}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.55)",
                fontSize: "12px",
                padding: "0.4rem 0.6rem",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: saved ? "rgba(110,231,183,0.80)" : `${GOLD}CC`,
                background: "none",
                border: `1px solid ${saved ? "rgba(110,231,183,0.30)" : `${GOLD}30`}`,
                padding: "0.35rem 0.8rem",
                cursor: "pointer",
                marginTop: "0.4rem",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving…" : saved ? "Saved" : "Save status"}
            </button>
          </div>

          {/* Response template */}
          <ResponseTemplate request={request} currentStatus={status} />
        </div>
      )}
    </div>
  );
}

const SecurityAssuranceRequestsPage: NextPage<Props> = ({
  requests: initialRequests,
  counts,
}) => {
  const [requests, setRequests] = React.useState(initialRequests);

  const handleStatusChange = (id: string, status: string, note: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, decisionNote: note } : r)),
    );
  };

  const pending = requests.filter((r) => r.status === "NEW" || r.status === "UNDER_REVIEW");
  const resolved = requests.filter((r) => r.status !== "NEW" && r.status !== "UNDER_REVIEW");

  return (
    <AdminLayout title="Security Assurance Requests">
      <Head>
        <title>Security Assurance Requests | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
            Security assurance · Request queue
          </span>
          <p style={{ ...serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem" }}>
            Review requests, update status, copy response templates. Do not send documents automatically.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total requests", value: counts.total, color: "rgba(255,255,255,0.55)" },
            { label: "New / pending", value: counts.NEW, color: counts.NEW > 0 ? `${GOLD}CC` : "rgba(255,255,255,0.30)" },
            { label: "Under review", value: counts.UNDER_REVIEW, color: counts.UNDER_REVIEW > 0 ? "rgba(147,197,253,0.75)" : "rgba(255,255,255,0.30)" },
          ].map((s) => (
            <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.85rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{s.label}</div>
              <div style={{ ...mono, fontSize: "18px", color: s.color, marginTop: "0.2rem" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pending */}
        <div>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.6rem" }}>
            Pending review ({pending.length})
          </p>
          {pending.length === 0 ? (
            <p style={{ ...serif, fontSize: "0.85rem", color: "rgba(255,255,255,0.22)" }}>No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <RequestCard key={r.id} request={r} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>

        {/* Resolved */}
        {resolved.length > 0 && (
          <div>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.6rem" }}>
              Resolved ({resolved.length})
            </p>
            <div className="space-y-3">
              {resolved.map((r) => (
                <RequestCard key={r.id} request={r} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as any;

  const rows = await prisma.securityAssuranceRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const requests: RequestRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    organisation: r.organisation,
    role: r.role,
    requestedMaterial: r.requestedMaterial,
    procurementStage: r.procurementStage,
    message: r.message,
    status: r.status,
    decisionNote: r.decisionNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const newCount = rows.filter((r) => r.status === "NEW").length;
  const underReviewCount = rows.filter((r) => r.status === "UNDER_REVIEW").length;

  return {
    props: {
      requests,
      counts: {
        NEW: newCount,
        UNDER_REVIEW: underReviewCount,
        total: rows.length,
      },
    },
  };
};

export default SecurityAssuranceRequestsPage;
