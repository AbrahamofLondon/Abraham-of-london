/* pages/admin/intelligence/gmi/source-workbench.tsx — P1: Source Appendix Workbench */
/* Resolve the 11 release-blocking source rows. */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { getGmiSourceAppendix, type GmiSourceAppendixData } from "@/lib/intelligence/gmi-data-service.server";

type Props = {
  sourceRows: GmiSourceAppendixData[];
  editionId: string;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const STATUS_OPTIONS = [
  { value: "SOURCE_PENDING", label: "Pending" },
  { value: "EVIDENCE_COLLECTED", label: "Evidence Collected" },
  { value: "METHOD_NOTE_REQUIRED", label: "Method Note Required" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CARRIED_FORWARD", label: "Carried Forward" },
];

const SourceWorkbenchPage: NextPage<Props> = ({ sourceRows, editionId }) => {
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});
  const [methodNotes, setMethodNotes] = React.useState<Record<string, string>>({});
  const [justifications, setJustifications] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  const releaseBlockers = sourceRows.filter((r) => r.releaseBlocker);
  const pendingBlockers = releaseBlockers.filter((r) => r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED");

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const updates = sourceRows.map((row) => ({
        sourceRowId: row.id,
        status: statuses[row.id] || row.status,
        methodNote: methodNotes[row.id] || null,
        adminJustification: justifications[row.id] || null,
      }));

      const res = await fetch("/api/admin/intelligence/gmi/source-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId, updates }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(`Saved ${data.savedCount} row(s). ${data.errors?.length || 0} validation error(s).`);
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
        <title>Source Appendix Workbench | GMI Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  GMI Source Appendix Workbench
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  Source Rows — {editionId}
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  {pendingBlockers.length} release-blocking row(s) remain. Resolve all to clear the SOURCE_APPENDIX gate.
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
            <div className="mt-4 border px-4 py-3" style={{ borderColor: result.includes("Failed") ? "rgba(248,113,113,0.2)" : "rgba(110,231,183,0.2)" }}>
              <p className="font-mono text-[8px] text-white/70">{result}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {sourceRows.map((row) => {
              const isBlocker = row.releaseBlocker;
              const isPending = row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED";
              return (
                <div
                  key={row.id}
                  className="border p-4"
                  style={{
                    borderColor: isBlocker && isPending ? "rgba(248,113,113,0.25)" : RULE,
                    backgroundColor: isBlocker && isPending ? "rgba(248,113,113,0.03)" : "transparent",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                          {row.sourceRowId}
                        </p>
                        {isBlocker && (
                          <span className="border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.12em] text-red-400">
                            Blocks publication
                          </span>
                        )}
                        <span className="font-mono text-[7px] text-white/30">{row.evidenceClass}</span>
                      </div>
                      <p className="mt-1 text-sm text-white/80">{row.claim}</p>
                      <p className="mt-0.5 font-mono text-[7px] text-white/30">
                        Source: {row.sourceTitle ?? row.sourceUrl ?? "Source metadata pending"} · Confidence: {row.confidence} · Section: {row.reportSection}
                      </p>
                    </div>
                    <div className="w-36">
                      <select
                        value={statuses[row.id] || row.status}
                        onChange={(e) => setStatuses((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        className="w-full border bg-[rgb(3,3,5)] px-2 py-1.5 font-mono text-[8px] text-white"
                        style={{ borderColor: RULE }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(row.evidenceClass === "MODELLED_ESTIMATE" || row.evidenceClass === "SCENARIO_ASSUMPTION") && (
                    <div className="mt-3">
                      <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">
                        Method Note {row.evidenceClass === "MODELLED_ESTIMATE" ? "(required for modelled estimates)" : ""}
                      </label>
                      <textarea
                        value={methodNotes[row.id] ?? ""}
                        onChange={(e) => setMethodNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        rows={1}
                        className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                        style={{ borderColor: RULE }}
                        placeholder="Explain the methodology..."
                      />
                    </div>
                  )}

                  {(statuses[row.id] === "REJECTED" || statuses[row.id] === "CARRIED_FORWARD") && (
                    <div className="mt-3">
                      <label className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">
                        Admin Justification (required for demotion/removal)
                      </label>
                      <textarea
                        value={justifications[row.id] ?? ""}
                        onChange={(e) => setJustifications((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        rows={1}
                        className="mt-1 w-full border bg-transparent px-3 py-2 text-xs text-white/80"
                        style={{ borderColor: RULE }}
                        placeholder="Why is this being demoted or carried forward?"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5 disabled:opacity-40"
              style={{ borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14`, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save All Changes"}
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
  const sourceRows = await getGmiSourceAppendix(editionId);

  return {
    props: {
      sourceRows: JSON.parse(JSON.stringify(sourceRows.data)),
      editionId,
    },
  };
};

export default SourceWorkbenchPage;
