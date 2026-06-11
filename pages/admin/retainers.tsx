/**
 * pages/admin/retainers.tsx — Unified admin retainer pipeline queue
 *
 * Shows all readiness candidates and active contracts.
 * Admin actions: mark_review_ready, approve, reject, create_contract,
 *                create_first_cycle, create_case_study_draft, add_notes.
 *
 * Guardrails:
 *   - Cannot create contract without APPROVED readiness
 *   - Cannot create cycle without ACTIVE contract
 *   - Cannot create case study draft without COMPLETED cycle
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";
import { listReadinessCandidates } from "@/lib/retainers/retainer-pipeline-service";
import { readinessClassToStage, PIPELINE_STAGE_LABELS, TIER_LABELS } from "@/lib/retainers/retainer-pipeline-contracts";
import { prisma } from "@/lib/prisma.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type Candidate = {
  id: string;
  userEmail: string | null;
  readinessClass: string;
  evaluatorNotes: string | null;
  adminApprovedBy: string | null;
  adminApprovedAt: string | null;
  createdAt: string;
};

type Contract = {
  id: string;
  tier: string;
  status: string;
  startDate: string;
  organisationId: string;
};

type PageProps = {
  candidates: Candidate[];
  activeContracts: Contract[];
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const result = await requireAdminPage(ctx);
  if ("redirect" in result || "notFound" in result) return result as any;

  const [rawCandidates, activeContracts] = await Promise.all([
    listReadinessCandidates(),
    prisma.retainerContract.findMany({
      where: {},
      select: { id: true, tier: true, status: true, startDate: true, organisationId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const candidates: Candidate[] = rawCandidates.map(c => ({
    id: c.id,
    userEmail: c.userEmail,
    readinessClass: c.readinessClass,
    evaluatorNotes: c.evaluatorNotes,
    adminApprovedBy: c.adminApprovedBy,
    adminApprovedAt: c.adminApprovedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  const contracts: Contract[] = activeContracts.map(c => ({
    id: c.id,
    tier: c.tier,
    status: c.status,
    startDate: c.startDate.toISOString(),
    organisationId: c.organisationId,
  }));

  return { props: { candidates, activeContracts: contracts } };
};

function stageBadge(readinessClass: string) {
  const stage = readinessClassToStage(readinessClass);
  const label = PIPELINE_STAGE_LABELS[stage];
  const colours: Record<string, string> = {
    NOT_STARTED: "#3a3830", READINESS_CANDIDATE: "#7f6a3c", REVIEW_READY: "#2471a3",
    APPROVED_FOR_OFFER: "#1a7a4a",
  };
  return (
    <span style={{
      ...mono, fontSize: 10, letterSpacing: "0.08em", padding: "2px 8px",
      background: colours[stage] ?? "#3a3830", color: "#e8e0d0", borderRadius: 2,
    }}>
      {label}
    </span>
  );
}

function ActionButton({ label, onClick, disabled, danger }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...mono, fontSize: 10, letterSpacing: "0.08em",
        background: danger ? "#3d1a1a" : "#1a1a24",
        color: danger ? "#e74c3c" : GOLD,
        border: `1px solid ${danger ? "#5a2020" : "#2a2a38"}`,
        padding: "4px 10px", borderRadius: 2, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default function AdminRetainersPage({
  candidates,
  activeContracts,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [actionState, setActionState] = React.useState<Record<string, string>>({});
  const [tierInputs, setTierInputs] = React.useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = React.useState<Record<string, string>>({});
  const [rejectReasonInputs, setRejectReasonInputs] = React.useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = React.useState(0);

  async function patchAction(id: string, payload: Record<string, unknown>) {
    setActionState(s => ({ ...s, [id]: "working" }));
    try {
      const res = await fetch(`/api/admin/retainers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { ok: boolean; reason?: string };
      if (!data.ok) throw new Error(data.reason ?? "Action failed");
      setActionState(s => ({ ...s, [id]: "done" }));
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setActionState(s => ({ ...s, [id]: err instanceof Error ? err.message : "Error" }));
    }
  }

  return (
    <AdminLayout>
      <Head><title>Retainer Pipeline | Admin</title></Head>
      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
        <BackToOperatorCommandCentre />
        <div style={{ marginBottom: 32 }}>
          <p style={{ ...mono, fontSize: 11, color: GOLD, letterSpacing: "0.15em", marginBottom: 8 }}>RETAINER PIPELINE</p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "#f5f0e8" }}>Admin Queue</h1>
        </div>

        {/* ── READINESS CANDIDATES ── */}
        <section style={{ marginBottom: 48 }}>
          <p style={{ ...mono, fontSize: 11, color: "#7e7870", letterSpacing: "0.1em", marginBottom: 16 }}>
            READINESS CANDIDATES ({candidates.length})
          </p>
          {candidates.length === 0 && (
            <p style={{ fontSize: 13, color: "#5e5850" }}>No readiness submissions yet.</p>
          )}
          {candidates.map(c => {
            const state = actionState[c.id];
            const isWorking = state === "working";
            const isDone = state === "done";
            return (
              <div key={c.id} style={{
                background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4,
                padding: "20px 24px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ ...mono, fontSize: 12, color: "#e8e0d0", marginBottom: 4 }}>
                      {c.userEmail ?? "Unknown email"}
                    </p>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850" }}>
                      {new Date(c.createdAt).toLocaleDateString("en-GB")} · {c.id.slice(0, 12)}
                    </p>
                  </div>
                  {stageBadge(c.readinessClass)}
                </div>

                {c.evaluatorNotes && (
                  <p style={{ fontSize: 12, color: "#7e7870", marginBottom: 12, lineHeight: 1.6 }}>
                    {c.evaluatorNotes}
                  </p>
                )}

                {c.adminApprovedBy && (
                  <p style={{ ...mono, fontSize: 10, color: "#27ae60", marginBottom: 12 }}>
                    Approved by {c.adminApprovedBy}
                  </p>
                )}

                {isDone && (
                  <p style={{ ...mono, fontSize: 10, color: "#27ae60" }}>Done — reloading…</p>
                )}
                {state && state !== "working" && state !== "done" && (
                  <p style={{ ...mono, fontSize: 10, color: "#e74c3c", marginBottom: 8 }}>{state}</p>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {c.readinessClass === "CANDIDATE" && (
                    <ActionButton label="Mark Review Ready" disabled={isWorking} onClick={() => patchAction(c.id, { action: "mark_review_ready" })} />
                  )}
                  {c.readinessClass === "REVIEW_READY" && (
                    <ActionButton label="Approve for Offer" disabled={isWorking} onClick={() => patchAction(c.id, { action: "approve_for_offer", notes: notesInputs[c.id] })} />
                  )}
                  {c.readinessClass === "APPROVED" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={tierInputs[c.id] ?? ""}
                        onChange={e => setTierInputs(t => ({ ...t, [c.id]: e.target.value }))}
                        style={{ ...mono, fontSize: 11, background: "#1a1a24", color: "#e8e0d0", border: "1px solid #2a2a38", padding: "4px 8px", borderRadius: 2 }}
                      >
                        <option value="">Select tier…</option>
                        <option value="CORE">Core Oversight</option>
                        <option value="OPERATIONAL">Operator Oversight</option>
                        <option value="INSTITUTIONAL">Institutional Oversight</option>
                      </select>
                      <ActionButton
                        label="Create Contract"
                        disabled={isWorking || !tierInputs[c.id]}
                        onClick={() => patchAction(c.id, { action: "create_contract", tier: tierInputs[c.id] })}
                      />
                    </div>
                  )}
                  {(c.readinessClass === "CANDIDATE" || c.readinessClass === "REVIEW_READY") && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        placeholder="Rejection reason…"
                        value={rejectReasonInputs[c.id] ?? ""}
                        onChange={e => setRejectReasonInputs(r => ({ ...r, [c.id]: e.target.value }))}
                        style={{ ...mono, fontSize: 11, background: "#1a1a24", color: "#e8e0d0", border: "1px solid #2a2a38", padding: "4px 8px", borderRadius: 2, width: 200 }}
                      />
                      <ActionButton
                        label="Reject"
                        danger
                        disabled={isWorking || !rejectReasonInputs[c.id]}
                        onClick={() => patchAction(c.id, { action: "reject", reason: rejectReasonInputs[c.id], routeTo: "Boardroom Brief" })}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      placeholder="Add note…"
                      value={notesInputs[c.id] ?? ""}
                      onChange={e => setNotesInputs(n => ({ ...n, [c.id]: e.target.value }))}
                      style={{ ...mono, fontSize: 11, background: "#1a1a24", color: "#e8e0d0", border: "1px solid #2a2a38", padding: "4px 8px", borderRadius: 2, width: 200 }}
                    />
                    <ActionButton
                      label="Save Note"
                      disabled={isWorking || !notesInputs[c.id]}
                      onClick={() => patchAction(c.id, { action: "add_notes", notes: notesInputs[c.id] })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── ACTIVE CONTRACTS ── */}
        <section>
          <p style={{ ...mono, fontSize: 11, color: "#7e7870", letterSpacing: "0.1em", marginBottom: 16 }}>
            CONTRACTS ({activeContracts.length})
          </p>
          {activeContracts.length === 0 && (
            <p style={{ fontSize: 13, color: "#5e5850" }}>No contracts yet.</p>
          )}
          {activeContracts.map(c => {
            const state = actionState[c.id];
            const isWorking = state === "working";
            const isDone = state === "done";
            return (
              <div key={c.id} style={{
                background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4,
                padding: "20px 24px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ ...mono, fontSize: 12, color: "#e8e0d0", marginBottom: 4 }}>
                      {TIER_LABELS[c.tier] ?? c.tier}
                    </p>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850" }}>
                      {c.id.slice(0, 16)} · Started {new Date(c.startDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span style={{
                    ...mono, fontSize: 10, padding: "2px 8px", borderRadius: 2,
                    background: c.status === "ACTIVE" ? "#1a4a2a" : "#3a2a1a",
                    color: c.status === "ACTIVE" ? "#27ae60" : "#f39c12",
                  }}>
                    {c.status}
                  </span>
                </div>
                {isDone && <p style={{ ...mono, fontSize: 10, color: "#27ae60" }}>Done — reloading…</p>}
                {state && state !== "working" && state !== "done" && (
                  <p style={{ ...mono, fontSize: 10, color: "#e74c3c", marginBottom: 8 }}>{state}</p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.status === "ACTIVE" && (
                    <ActionButton
                      label="Create First Cycle"
                      disabled={isWorking}
                      onClick={() => patchAction(c.id, { action: "create_first_cycle", contractId: c.id })}
                    />
                  )}
                  <a href={`/retainers/status/${c.id}`} target="_blank" rel="noreferrer"
                    style={{ ...mono, fontSize: 10, color: "#7e7870", textDecoration: "none", padding: "4px 10px", border: "1px solid #2a2a38", borderRadius: 2 }}>
                    View Status Page ↗
                  </a>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AdminLayout>
  );
}
