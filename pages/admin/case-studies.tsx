/**
 * pages/admin/case-studies.tsx — Admin: Governed Case Study Registry
 *
 * List, filter, create from Boardroom Brief order, publish, and withdraw.
 * All writes go through the API layer; state is DB-backed.
 */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import type { CaseStudyRecord } from "@/lib/evidence/case-study-service";
import { EVIDENCE_STATUS_LABELS, OUTCOME_STATUS_LABELS } from "@/lib/evidence/case-study-public";
import type { EvidenceStatus, OutcomeStatus, VisibilityStatus } from "@/lib/evidence/case-study-service";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" };

type Props = {
  initialRecords: CaseStudyRecord[];
};

// ─── Row ──────────────────────────────────────────────────────────────────────

function CaseRow({
  record,
  onAction,
}: {
  record: CaseStudyRecord;
  onAction: (id: string, action: string, payload?: Record<string, unknown>) => void;
}) {
  const [note, setNote] = React.useState("");

  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginBottom: 4 }}>{record.title}</div>
        <div style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{record.id}</div>
        {record.slug && (
          <div style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>/{record.slug}</div>
        )}
      </td>
      <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
        <span style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
          {record.visibilityStatus}
        </span>
        <br />
        <span style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, display: "block" }}>
          {record.narrative.productCode ?? "—"}
        </span>
      </td>
      <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
        <span style={{ ...mono, fontSize: 10, color: "rgba(251,191,36,0.8)" }}>
          {EVIDENCE_STATUS_LABELS[record.evidenceStatus as EvidenceStatus] ?? record.evidenceStatus}
        </span>
      </td>
      <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
        <span style={{ ...mono, fontSize: 10, color: "rgba(52,211,153,0.7)" }}>
          {OUTCOME_STATUS_LABELS[record.outcomeStatus as OutcomeStatus] ?? record.outcomeStatus}
        </span>
        <br />
        <span style={{ ...mono, fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, display: "block" }}>
          consent: {record.consentStatus}
        </span>
      </td>
      <td style={{ padding: "14px 12px", verticalAlign: "top" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {record.visibilityStatus === "DRAFT" || record.visibilityStatus === "INTERNAL_REVIEW" ? (
            <>
              <button
                onClick={() => onAction(record.id, "publish", { targetVisibility: "PUBLIC_ANONYMISED" })}
                style={{ ...mono, fontSize: 10, padding: "4px 10px", background: "rgba(52,211,153,0.18)", color: "rgba(52,211,153,0.85)", border: "none", cursor: "pointer", borderRadius: 2 }}
              >
                Publish Anonymised
              </button>
              {record.consentStatus === "GRANTED" && (
                <button
                  onClick={() => onAction(record.id, "publish", { targetVisibility: "PUBLIC_NAMED" })}
                  style={{ ...mono, fontSize: 10, padding: "4px 10px", background: "rgba(52,211,153,0.28)", color: "rgba(52,211,153,0.9)", border: "none", cursor: "pointer", borderRadius: 2 }}
                >
                  Publish Named
                </button>
              )}
            </>
          ) : null}
          {record.visibilityStatus !== "WITHDRAWN" && (
            <button
              onClick={() => onAction(record.id, "withdraw")}
              style={{ ...mono, fontSize: 10, padding: "4px 10px", background: "rgba(239,68,68,0.12)", color: "rgba(239,68,68,0.7)", border: "none", cursor: "pointer", borderRadius: 2 }}
            >
              Withdraw
            </button>
          )}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{record.evidenceLinks.length} link(s)</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Create from Boardroom Brief ──────────────────────────────────────────────

function CreateFromOrderPanel({ onCreated }: { onCreated: (record: CaseStudyRecord) => void }) {
  const [orderId, setOrderId] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "error" | "exists">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handle() {
    if (!orderId.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await fetch("/api/admin/case-studies/boardroom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setErrorMsg(data.reason ?? data.error ?? "FAILED");
        setStatus("error");
        return;
      }
      setOrderId("");
      setStatus(data.alreadyExists ? "exists" : "idle");
      onCreated(data.record);
    } catch {
      setStatus("error");
      setErrorMsg("REQUEST_FAILED");
    }
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "20px 24px", marginBottom: 32 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
        CREATE FROM BOARDROOM BRIEF ORDER
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          placeholder="BoardroomBriefOrder ID"
          style={{ flex: 1, ...mono, fontSize: 12, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}
        />
        <button
          onClick={handle}
          disabled={status === "loading" || !orderId.trim()}
          style={{ ...mono, fontSize: 11, padding: "8px 16px", background: "rgba(52,211,153,0.18)", color: "rgba(52,211,153,0.85)", border: "none", cursor: "pointer" }}
        >
          {status === "loading" ? "Creating…" : "Create Draft"}
        </button>
      </div>
      {status === "error" && <div style={{ ...mono, fontSize: 11, color: "rgba(239,68,68,0.8)", marginTop: 8 }}>{errorMsg}</div>}
      {status === "exists" && <div style={{ ...mono, fontSize: 11, color: "rgba(251,191,36,0.7)", marginTop: 8 }}>Draft already exists for this order.</div>}
      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        Prefills product artefacts, falsification entry, and outcome hypothesis. Stays in DRAFT — no auto-publish.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCaseStudiesPage({ initialRecords }: Props) {
  const [records, setRecords] = React.useState<CaseStudyRecord[]>(initialRecords);
  const [actionStatus, setActionStatus] = React.useState<Record<string, string>>({});

  async function handleAction(id: string, action: string, payload?: Record<string, unknown>) {
    setActionStatus(s => ({ ...s, [id]: "loading" }));
    try {
      const r = await fetch(`/api/admin/case-studies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setActionStatus(s => ({ ...s, [id]: data.reason ?? data.error ?? "FAILED" }));
        return;
      }
      setRecords(prev => prev.map(rec => rec.id === id ? data.record : rec));
      setActionStatus(s => ({ ...s, [id]: "ok" }));
    } catch {
      setActionStatus(s => ({ ...s, [id]: "REQUEST_FAILED" }));
    }
  }

  function handleCreated(record: CaseStudyRecord) {
    setRecords(prev => [record, ...prev.filter(r => r.id !== record.id)]);
  }

  return (
    <AdminLayout title="Case Studies">
      <Head>
        <title>Case Studies — Admin</title>
      </Head>

      <div style={{ padding: "32px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "rgba(255,255,255,0.88)", margin: "0 0 8px" }}>
            Governed Case Studies
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.7 }}>
            All cases require evidence status, outcome status, and consent before publication. No case auto-publishes.
          </p>
        </div>

        <CreateFromOrderPanel onCreated={handleCreated} />

        {records.length === 0 ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            No case studies yet. Create one from a Boardroom Brief order above.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Case", "Visibility / Product", "Evidence", "Outcome / Consent", "Actions"].map(h => (
                  <th key={h} style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textAlign: "left", padding: "8px 12px" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <React.Fragment key={rec.id}>
                  <CaseRow record={rec} onAction={handleAction} />
                  {actionStatus[rec.id] && actionStatus[rec.id] !== "ok" && actionStatus[rec.id] !== "loading" && (
                    <tr>
                      <td colSpan={5} style={{ ...mono, fontSize: 11, padding: "4px 12px 10px", color: "rgba(239,68,68,0.75)" }}>
                        {actionStatus[rec.id]}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as any;

  try {
    const { listCaseStudies } = await import("@/lib/evidence/case-study-service");
    const records = await listCaseStudies();
    return { props: { initialRecords: records } };
  } catch {
    return { props: { initialRecords: [] } };
  }
};
