/* pages/admin/intelligence/gmi/batch-score.tsx — P0: Batch Call Scoring Workbench */
/* Score CALL-001 to CALL-008 from one screen with evidence discipline. */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getPublicGmiCallLedger, type PublicGmiCallLedgerEntry } from "@/lib/intelligence/gmi-instrument";
import { getCallsForReport } from "@/lib/intelligence/market-intelligence-call-ledger";

type Props = {
  calls: PublicGmiCallLedgerEntry[];
  editionId: string;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const SCORE_OPTIONS = [
  { value: "", label: "—" },
  { value: "5", label: "5 — Confirmed strongly" },
  { value: "4", label: "4 — Directionally confirmed" },
  { value: "3", label: "3 — Partially confirmed" },
  { value: "2", label: "2 — Too early to assess" },
  { value: "1", label: "1 — Weakly supported" },
  { value: "0", label: "0 — Disconfirmed" },
];

const BatchScorePage: NextPage<Props> = ({ calls, editionId }) => {
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [evidenceSummaries, setEvidenceSummaries] = React.useState<Record<string, string>>({});
  const [justifications, setJustifications] = React.useState<Record<string, string>>({});
  const [carryForwardJustifications, setCarryForwardJustifications] = React.useState<Record<string, string>>({});
  const [nextReviewDates, setNextReviewDates] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const q1Calls = calls.filter((c) => c.editionId === "GMI-Q1-2026");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const call of q1Calls) {
      const score = scores[call.callId];
      if (!score) {
        newErrors[call.callId] = "Score required";
        continue;
      }
      const scoreNum = parseInt(score, 10);
      if (scoreNum === 2) {
        if (!carryForwardJustifications[call.callId]?.trim()) {
          newErrors[call.callId] = "Score 2 requires carry-forward justification";
        }
        if (!nextReviewDates[call.callId]) {
          newErrors[call.callId] = "Score 2 requires next review date";
        }
      } else {
        if (!evidenceSummaries[call.callId]?.trim()) {
          newErrors[call.callId] = `Score ${scoreNum} requires evidence summary`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (mode: "all" | "valid") => {
    if (mode === "all" && !validate()) return;

    setSaving(true);
    setResult(null);
    try {
      const updates = q1Calls.map((call) => ({
        callId: call.callId,
        score: scores[call.callId] ? parseInt(scores[call.callId] ?? "", 10) : null,
        status: statuses[call.callId] || "REVIEWED",
        evidenceSummary: evidenceSummaries[call.callId] || "",
        justification: justifications[call.callId] || "",
        carryForwardJustification: carryForwardJustifications[call.callId] || null,
        nextReviewDue: nextReviewDates[call.callId] || null,
      }));

      const res = await fetch("/api/admin/intelligence/gmi/batch-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId, updates, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(`Saved ${data.savedCount} call(s) successfully. ${data.errors?.length || 0} error(s).`);
      } else {
        setResult(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Batch Call Scoring | GMI Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  GMI Batch Call Scoring
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  Score Q1 Calls — {editionId}
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  Score 5/4/3/1/0 requires evidence. Score 2 requires carry-forward justification and review date.
                </p>
              </div>
              <Link
                href="/admin/intelligence/gmi/publication-readiness"
                className="border px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.14em] transition hover:bg-white/5"
                style={{ borderColor: RULE }}
              >
                ← Publication Readiness
              </Link>
            </div>
          </div>

          {result && (
            <div className="mt-4 border px-4 py-3" style={{ borderColor: result.includes("Failed") ? "rgba(248,113,113,0.2)" : "rgba(110,231,183,0.2)", backgroundColor: result.includes("Failed") ? "rgba(248,113,113,0.05)" : "rgba(110,231,183,0.05)" }}>
              <p className="font-mono text-[8px] text-white/70">{result}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {q1Calls.map((call) => (
              <div key={call.callId} className="border p-5" style={{ borderColor: errors[call.callId] ? "rgba(248,113,113,0.3)" : RULE }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                      {call.callId}
                    </p>
                    <p className="mt-1 font-serif text-base italic text-white/80">{call.thesis}</p>
                    <p className="mt-1 font-mono text-[7px] text-white/30">
                      Category: {call.category} · Confidence: {call.confidenceBand} · Current: {call.currentStatus}
                    </p>
                  </div>
                  <div className="w-24">
                    <select
                      value={scores[call.callId] ?? ""}
                      onChange={(e) => setScores((prev) => ({ ...prev, [call.callId]: e.target.value }))}
                      className="w-full border bg-[rgb(3,3,5)] px-2 py-1.5 font-mono text-[9px] text-white"
                      style={{ borderColor: RULE }}
                    >
                      {SCORE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {errors[call.callId] && (
                  <p className="mt-2 font-mono text-[8px] text-red-400">{errors[call.callId]}</p>
                )}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">Evidence Summary</label>
                    <textarea
                      value={evidenceSummaries[call.callId] ?? ""}
                      onChange={(e) => setEvidenceSummaries((prev) => ({ ...prev, [call.callId]: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                      style={{ borderColor: RULE }}
                      placeholder="Summarise the evidence supporting this score..."
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">Justification</label>
                    <textarea
                      value={justifications[call.callId] ?? ""}
                      onChange={(e) => setJustifications((prev) => ({ ...prev, [call.callId]: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                      style={{ borderColor: RULE }}
                      placeholder="Why this score?"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">Carry-Forward Justification (score 2 only)</label>
                    <textarea
                      value={carryForwardJustifications[call.callId] ?? ""}
                      onChange={(e) => setCarryForwardJustifications((prev) => ({ ...prev, [call.callId]: e.target.value }))}
                      rows={1}
                      className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                      style={{ borderColor: RULE }}
                      placeholder="Why is this too early to assess?"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">Next Review Date (score 2 only)</label>
                    <input
                      type="date"
                      value={nextReviewDates[call.callId] ?? ""}
                      onChange={(e) => setNextReviewDates((prev) => ({ ...prev, [call.callId]: e.target.value }))}
                      className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                      style={{ borderColor: RULE }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleSave("all")}
              disabled={saving}
              className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14`, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save All (all-or-nothing)"}
            </button>
            <button
              onClick={() => handleSave("valid")}
              disabled={saving}
              className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: RULE, color: "rgba(255,255,255,0.6)", cursor: saving ? "not-allowed" : "pointer" }}
            >
              Save Valid Rows Only
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.ok) return { redirect: { ...auth.redirect, permanent: false } };

  const editionId = (ctx.query?.edition as string) || "GMI-Q2-2026";
  const calls = getPublicGmiCallLedger();

  return {
    props: {
      calls: JSON.parse(JSON.stringify(calls)),
      editionId,
    },
  };
};

export default BatchScorePage;
