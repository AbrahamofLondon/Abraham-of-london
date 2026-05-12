/**
 * pages/admin/outcome-verification.tsx
 *
 * Operator review queue — outcome verification records requiring human review.
 * Displays DISPUTED, BLOCKED, and INSUFFICIENT_EVIDENCE verifications.
 * Operators can confirm accuracy, dispute, approve memory updates, or escalate.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { requireAdminPage } from "@/lib/access/server";
import {
  getPendingOperatorReviews,
} from "@/lib/product/operator-outcome-review";
import type { PendingReviewItem, OperatorReviewOutcome } from "@/lib/product/operator-outcome-review";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type PageProps = {
  items: PendingReviewItem[];
  total: number;
  operatorEmail: string;
};

const Page: NextPage<PageProps> = ({ items, total, operatorEmail }) => {
  return (
    <Layout title="Outcome Verification Review | Admin" description="Operator review queue for verification records.">
      <main className="min-h-screen px-6 py-14" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
              Admin · Operator Review Queue
            </p>
            <h1 className="mt-2 text-2xl text-white" style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 }}>
              Outcome Verification
            </h1>
            <p className="mt-2 text-sm text-white/50">
              {total} record{total !== 1 ? "s" : ""} pending operator review.
              Reviewing as <span className="text-white/70">{operatorEmail}</span>.
            </p>
          </div>

          {items.length === 0 ? (
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "2rem 1.5rem" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                No records pending review
              </p>
              <p className="mt-2 text-sm text-white/40">
                All disputed, blocked, and insufficient-evidence verifications have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <ReviewCard key={item.diagnosticRecordId} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

function ReviewCard({ item }: { item: PendingReviewItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const [outcome, setOutcome] = React.useState<OperatorReviewOutcome>("ACCURACY_CONFIRMED");
  const [note, setNote] = React.useState("");
  const [memoryApproved, setMemoryApproved] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ reviewId: string; memoryApproved: boolean } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const statusColor =
    item.status === "DISPUTED" ? "rgba(239,68,68,0.75)"
    : item.status === "BLOCKED" ? "rgba(249,115,22,0.72)"
    : "rgba(251,191,36,0.70)";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim() || note.trim().length < 10) {
      setError("Operator note must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/outcome-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticRecordId: item.diagnosticRecordId,
          verificationId: item.verificationId,
          outcome,
          operatorNote: note,
          memoryApproved,
        }),
      });
      const data = await res.json() as { ok: boolean; reviewId?: string; memoryApproved?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Review submission failed.");
      setDone({ reviewId: data.reviewId!, memoryApproved: data.memoryApproved! });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ border: `1px solid rgba(110,231,183,0.25)`, background: "rgba(110,231,183,0.03)", padding: "1.1rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(110,231,183,0.60)" }}>
          Review recorded — {done.reviewId}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {done.memoryApproved
            ? "Memory application approved. Comparison basis maturity update queued."
            : "Review noted. Memory update withheld pending further review."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${statusColor}30`, background: `${statusColor.slice(0, -5)}0.03)` }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        style={{ padding: "1rem 1.25rem" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: statusColor }}>
                {item.status}
              </span>
              {item.sourceSurface && (
                <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.30)" }}>
                  {item.sourceSurface}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-white/80">{item.userEmail}</p>
            <p className="mt-0.5 text-xs text-white/40">{item.reviewReason}</p>
          </div>
          <div style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.28)", textAlign: "right", flexShrink: 0 }}>
            <div>{new Date(item.createdAt).toLocaleDateString("en-GB")}</div>
            <div className="mt-0.5">{item.outcomeClassification.replace(/_/g, " ")}</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.25rem" }}>
          <div className="space-y-3 mb-6">
            <DataRow label="Did act" value={item.didAct} />
            <DataRow label="Changed state" value={item.changedState} />
            <DataRow label="System accuracy" value={item.systemDiagnosisAccuracy} />
            <DataRow label="Evidence posture" value={item.evidencePosture} />
            {item.whatChanged && <DataRow label="What changed" value={item.whatChanged} />}
            {item.evidenceSummary && <DataRow label="Evidence summary" value={item.evidenceSummary} />}
            {item.rememberNote && <DataRow label="Remember note" value={item.rememberNote} />}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                Review outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as OperatorReviewOutcome)}
                className="mt-2 w-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="ACCURACY_CONFIRMED">Accuracy confirmed — system diagnosis was correct</option>
                <option value="ACCURACY_DISPUTED">Accuracy disputed — system diagnosis was incorrect</option>
                <option value="PATTERN_EXCEPTION">Pattern exception — valid case, does not invalidate signal</option>
                <option value="MEMORY_APPROVED">Memory approved — mark for institutional memory update</option>
                <option value="MEMORY_REJECTED">Memory rejected — do not update institutional memory</option>
                <option value="REQUIRES_FURTHER_REVIEW">Escalate — requires senior review</option>
              </select>
            </div>

            <div>
              <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                Operator note <span style={{ color: "rgba(255,255,255,0.20)" }}>(required — min 10 chars)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="mt-2 w-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                placeholder="Document your review rationale. This is written to the institutional record."
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={memoryApproved}
                onChange={(e) => setMemoryApproved(e.target.checked)}
                className="h-3 w-3"
              />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
                Approve memory update — this will increment comparison basis maturity for this surface
              </span>
            </label>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{ ...mono, border: `1px solid ${GOLD}45`, background: `${GOLD}10`, color: `${GOLD}CC`, padding: "10px 18px", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase" }}
              className="disabled:opacity-60"
            >
              {submitting ? "Recording..." : "Record Operator Review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", minWidth: "110px", paddingTop: "2px" }}>
        {label}
      </span>
      <span className="text-xs text-white/60 leading-relaxed">{value}</span>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth/options");
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as unknown as ReturnType<GetServerSideProps<PageProps>>;

  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const items = await getPendingOperatorReviews({ limit: 50, offset: 0 });

  return {
    props: {
      items,
      total: items.length,
      operatorEmail: session?.user?.email ?? "",
    },
  };
};

export default Page;
