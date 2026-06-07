/* pages/admin/intelligence/gmi-falsification.tsx — P2: Falsification Gap Resolution */
/* Extended with High-Conviction Coverage panel. */

import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/require-admin-page";
import {
  getGmiCallLedger,
  getGmiFalsificationRules,
  type GmiFalsificationRuleData,
} from "@/lib/intelligence/gmi-data-service.server";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-authority";

type Props = {
  rules: GmiFalsificationRuleData[];
  integrity: {
    activeTheses: number;
    thesesWithFalsificationThresholds: number;
    thesesMissingObservableTrigger: number;
    thresholdsDueForReview: number;
    falsificationTriggersCurrentlyBreached: number;
    adminActionRequired: boolean;
  };
  highConvictionCalls: Array<{ callId: string; thesis: string; hasRule: boolean }>;
  missingThresholdCount: number;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function GmiFalsificationAdminPage({
  rules,
  integrity,
  highConvictionCalls,
  missingThresholdCount,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>GMI Falsification | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="border-b pb-6" style={{ borderBottomColor: RULE }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  GMI Falsification Register
                </p>
                <h1 className="mt-2 font-serif text-3xl italic text-white/88">
                  Falsification Governance
                </h1>
                <p className="mt-2 text-sm text-white/42">
                  Major theses must state observable triggers, thresholds, evidence rows, review dates, and public explanation before high conviction publication.
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

          {/* Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Active theses", value: integrity.activeTheses },
              { label: "With thresholds", value: integrity.thesesWithFalsificationThresholds },
              { label: "Missing trigger", value: integrity.thesesMissingObservableTrigger, warn: integrity.thesesMissingObservableTrigger > 0 },
              { label: "Due for review", value: integrity.thresholdsDueForReview, warn: integrity.thresholdsDueForReview > 0 },
              { label: "Admin action", value: integrity.adminActionRequired ? "Required" : "Clear", warn: integrity.adminActionRequired },
            ].map((m) => (
              <div key={m.label} className="border p-4" style={{ borderColor: m.warn ? "rgba(248,113,113,0.2)" : RULE }}>
                <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/30">{m.label}</p>
                <p className={`mt-1 font-mono text-lg ${m.warn ? "text-red-400" : "text-white/70"}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* High-Conviction Coverage Panel */}
          <div className="mt-8">
            <p style={{ ...mono, color: "#F87171", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              High-Conviction Coverage {missingThresholdCount > 0 ? `— ${missingThresholdCount} thesis(es) missing threshold` : "— All covered"}
            </p>
            <div className="mt-3 space-y-3">
              {highConvictionCalls.map((call) => (
                <div
                  key={call.callId}
                  className="border p-4"
                  style={{ borderColor: call.hasRule ? "rgba(110,231,183,0.2)" : "rgba(248,113,113,0.25)", backgroundColor: call.hasRule ? "rgba(110,231,183,0.02)" : "rgba(248,113,113,0.03)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                          {call.callId}
                        </p>
                        <span className={`border px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.12em] ${call.hasRule ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                          {call.hasRule ? "Covered" : "Missing threshold"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/80">{call.thesis}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Rules */}
          <div className="mt-8 space-y-4">
            <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Falsification Rules ({rules.length})
            </p>
            {rules.map((rule) => (
              <div key={rule.id} className="border p-5" style={{ borderColor: RULE }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/65">{rule.thesisId}</p>
                    <h2 className="mt-2 font-serif text-xl text-white">{rule.thesisStatement}</h2>
                  </div>
                  <span className={`border px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] ${
                    rule.currentStatus === "breached" ? "border-red-500/20 bg-red-500/10 text-red-400" :
                    rule.currentStatus === "monitoring" ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400" :
                    "border-green-500/20 bg-green-500/10 text-green-400"
                  }`}>
                    {rule.currentStatus}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    { label: "Threshold type", value: rule.thresholdType },
                    { label: "Threshold value", value: rule.thresholdValue },
                    { label: "Next review", value: rule.nextReviewDue },
                    { label: "Evidence rows", value: rule.evidenceSourceRows.length },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/30">{m.label}</p>
                      <p className="mt-1 font-mono text-xs text-white/60">{String(m.value)}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">{rule.falsificationCondition}</p>
                {rule.publicExplanation && (
                  <p className="mt-2 text-xs text-white/35 italic">{rule.publicExplanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.ok) return { redirect: { ...auth.redirect, permanent: false } };

  const editionId = (ctx.query?.edition as string) || "GMI-Q2-2026";
  const [releaseState, rulesResult, callsResult] = await Promise.all([
    resolveGmiReleaseState(editionId),
    getGmiFalsificationRules(editionId),
    getGmiCallLedger(editionId),
  ]);
  const rules = rulesResult.data;
  const q1Calls = callsResult.data.filter((c) => c.editionId === "GMI-Q1-2026" && c.confidenceBand === "HIGH");

  const highConvictionCalls = q1Calls.map((call) => ({
    callId: call.callId,
    thesis: call.callStatement,
    hasRule: rules.some((r) => r.evidenceSourceRows.includes(call.callId)),
  }));

  const missingThresholdCount = highConvictionCalls.filter((c) => !c.hasRule).length;
  const now = Date.now();
  const integrity = {
    activeTheses: rules.length,
    thesesWithFalsificationThresholds: rules.filter((rule) => rule.thresholdValue.trim()).length,
    thesesMissingObservableTrigger: rules.filter((rule) => !rule.observableIndicator.trim()).length,
    thresholdsDueForReview: rules.filter((rule) => rule.nextReviewDue && new Date(rule.nextReviewDue).getTime() <= now).length,
    falsificationTriggersCurrentlyBreached: rules.filter((rule) => rule.currentStatus === "breached").length,
    adminActionRequired: releaseState.blockers.some((blocker) => blocker.category === "FALSIFICATION" && blocker.blocksPublication),
  };

  return {
    props: {
      rules: JSON.parse(JSON.stringify(rules)),
      integrity,
      highConvictionCalls: JSON.parse(JSON.stringify(highConvictionCalls)),
      missingThresholdCount,
    },
  };
};
