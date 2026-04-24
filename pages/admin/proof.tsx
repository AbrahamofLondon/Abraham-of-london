import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { requireAdminPage } from "@/lib/access/server";
import { listProofEvidence, type ProofEvidenceRecord } from "@/lib/proof/evidence";
import { track } from "@/lib/analytics/track";
import AdminErrorState from "@/components/admin/AdminErrorState";

type PageProps = {
  initialItems: ProofEvidenceRecord[];
  error: string | null;
};

const statusOptions = ["PENDING", "APPROVED", "REJECTED"] as const;
const displayOptions = ["HIDDEN", "PUBLIC"] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[8px] uppercase" style={{ color: "var(--ds-text-subtle)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid var(--ds-border)",
    backgroundColor: "rgba(255,255,255,0.035)",
    color: "var(--ds-text)",
    padding: "0.75rem",
    fontSize: "13px",
    lineHeight: 1.5,
  };
}

function ProofRow({ item }: { item: ProofEvidenceRecord }) {
  const [draft, setDraft] = React.useState({
    anonymisedSummary: item.anonymisedSummary || "",
    displayLabel: item.displayLabel || "",
    userType: item.userType || "",
    organisationType: item.organisationType || "",
    outcomeCategory: item.outcomeCategory || "",
    proofType: item.proofType,
    approvalStatus: item.approvalStatus,
    displayStatus: item.displayStatus,
    adminNotes: item.adminNotes || "",
  });
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch(`/api/admin/proof/evidence/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error("save_failed");
      if (draft.approvalStatus === "APPROVED") {
        track("proof_approved", {
          proof_id: item.id,
          display_status: draft.displayStatus,
        });
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="border p-5" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[8px] uppercase" style={{ color: "var(--ds-accent)" }}>
            {item.sourceStage} · {item.proofType}
          </div>
          <p className="mt-2 text-[12px]" style={{ color: "var(--ds-text-subtle)" }}>
            {new Date(item.createdAt).toLocaleString()} · {item.sourceKind}
          </p>
        </div>
        <div className="font-mono text-[8px] uppercase" style={{ color: "var(--ds-text-subtle)" }}>
          {item.approvalStatus} / {item.displayStatus}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="font-mono text-[8px] uppercase" style={{ color: "var(--ds-text-subtle)" }}>
            Raw signal
          </div>
          <div className="mt-3 space-y-2 text-[13px] leading-[1.6]" style={{ color: "var(--ds-text-muted)" }}>
            <p>Accuracy: {item.accuracyScore || "—"}</p>
            <p>Usefulness: {item.usefulnessScore || "—"}</p>
            <p>Action intent: {item.actionIntent || "—"}</p>
            <p>Outcome: {item.outcomeCategory || "—"}</p>
            {item.freeTextRaw ? <p>Raw text: {item.freeTextRaw}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Anonymised summary">
            <textarea
              value={draft.anonymisedSummary}
              onChange={(e) => setDraft((d) => ({ ...d, anonymisedSummary: e.target.value }))}
              rows={3}
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Display label">
              <input value={draft.displayLabel} onChange={(e) => setDraft((d) => ({ ...d, displayLabel: e.target.value }))} style={inputStyle()} />
            </Field>
            <Field label="Organisation type">
              <input value={draft.organisationType} onChange={(e) => setDraft((d) => ({ ...d, organisationType: e.target.value }))} style={inputStyle()} />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Approval">
              <select value={draft.approvalStatus} onChange={(e) => setDraft((d) => ({ ...d, approvalStatus: e.target.value as any }))} style={inputStyle()}>
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Display">
              <select value={draft.displayStatus} onChange={(e) => setDraft((d) => ({ ...d, displayStatus: e.target.value as any }))} style={inputStyle()}>
                {displayOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Admin notes">
            <textarea
              value={draft.adminNotes}
              onChange={(e) => setDraft((d) => ({ ...d, adminNotes: e.target.value }))}
              rows={2}
              style={{ ...inputStyle(), resize: "vertical" }}
            />
          </Field>

          <button
            type="button"
            onClick={save}
            className="border px-4 py-3 font-mono text-[8px] uppercase transition hover:opacity-80"
            style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)", backgroundColor: "var(--ds-accent-soft)" }}
          >
            {status === "saving" ? "Saving" : "Save review"}
          </button>
          {status === "saved" && <span className="ml-3 font-mono text-[8px] uppercase text-emerald-300">Saved</span>}
          {status === "error" && <span className="ml-3 font-mono text-[8px] uppercase text-red-300">Save failed</span>}
        </div>
      </div>
    </div>
  );
}

const AdminProofPage: NextPage<PageProps> = ({ initialItems, error }) => {
  const [items, setItems] = React.useState(initialItems);
  const [manual, setManual] = React.useState({
    anonymisedSummary: "",
    displayLabel: "",
    organisationType: "",
    outcomeCategory: "clarified_problem",
    adminNotes: "",
  });
  const [manualStatus, setManualStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  async function createManualProof() {
    setManualStatus("saving");
    try {
      const response = await fetch("/api/admin/proof/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceStage: "admin_observed",
          proofType: "observed_outcome",
          sourceKind: "ADMIN_OBSERVED",
          ...manual,
        }),
      });
      if (!response.ok) throw new Error("create_failed");
      setManualStatus("saved");
      const refreshed = await fetch("/api/admin/proof/evidence");
      const json = await refreshed.json();
      if (json?.ok) setItems(json.items);
      setManual({
        anonymisedSummary: "",
        displayLabel: "",
        organisationType: "",
        outcomeCategory: "clarified_problem",
        adminNotes: "",
      });
    } catch {
      setManualStatus("error");
    }
  }

  if (error) {
    return (
      <Layout title="Proof Review" description="Admin proof evidence review" fullWidth>
        <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "var(--ds-background)" }}>
          <div className="mx-auto max-w-4xl">
            <AdminErrorState
              title="Proof system unavailable"
              message="Evidence could not be loaded. System integrity is not affected."
              action="Retry or inspect database connectivity and proof evidence storage."
            />
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Proof Review" description="Admin proof evidence review" fullWidth>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "var(--ds-background)" }}>
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase" style={{ color: "var(--ds-accent)" }}>
            Evidence review
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light" style={{ color: "var(--ds-text)" }}>
            Proof Capture
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: "var(--ds-text-muted)" }}>
            Review raw proof signals, redact identity, approve only structured evidence,
            and publish anonymised outcomes to public proof blocks.
          </p>

          <div className="mt-10 border p-6" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
            <p className="font-mono text-[8px] uppercase" style={{ color: "var(--ds-accent)" }}>
              Admin-assisted capture
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <Field label="Anonymised outcome summary">
                <textarea
                  value={manual.anonymisedSummary}
                  onChange={(e) => setManual((d) => ({ ...d, anonymisedSummary: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle(), resize: "vertical" }}
                />
              </Field>
              <div className="space-y-4">
                <Field label="Display label">
                  <input value={manual.displayLabel} onChange={(e) => setManual((d) => ({ ...d, displayLabel: e.target.value }))} style={inputStyle()} />
                </Field>
                <Field label="Organisation type">
                  <input value={manual.organisationType} onChange={(e) => setManual((d) => ({ ...d, organisationType: e.target.value }))} style={inputStyle()} />
                </Field>
              </div>
            </div>
            <div className="mt-4">
              <Field label="Admin source notes">
                <textarea
                  value={manual.adminNotes}
                  onChange={(e) => setManual((d) => ({ ...d, adminNotes: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle(), resize: "vertical" }}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={createManualProof}
              className="mt-4 border px-4 py-3 font-mono text-[8px] uppercase transition hover:opacity-80"
              style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)", backgroundColor: "var(--ds-accent-soft)" }}
            >
              {manualStatus === "saving" ? "Saving" : "Create evidence record"}
            </button>
            {manualStatus === "saved" && <span className="ml-3 font-mono text-[8px] uppercase text-emerald-300">Created</span>}
            {manualStatus === "error" && <span className="ml-3 font-mono text-[8px] uppercase text-red-300">Create failed</span>}
          </div>

          <div className="mt-10 space-y-5">
            {items.length ? (
              items.map((item) => <ProofRow key={item.id} item={item} />)
            ) : (
              <div className="border p-6" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}>
                No proof evidence captured yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  try {
    const initialItems = await listProofEvidence({ limit: 100 });
    return { props: { initialItems, error: null } };
  } catch (error) {
    console.error("[ADMIN_PROOF_LOAD_ERROR]", error);
    return {
      props: {
        initialItems: [],
        error: "PROOF_EVIDENCE_UNAVAILABLE",
      },
    };
  }
};

export default AdminProofPage;
