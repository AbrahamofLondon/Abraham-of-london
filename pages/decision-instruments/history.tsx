/**
 * Decision Instruments History — user-facing instrument result timeline.
 *
 * Shows: completed instruments, result bands, dates, movement over time,
 * what changed, next admissible move.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type InstrumentHistoryEntry = {
  id: string;
  slug: string;
  title: string;
  resultBand: string;
  score: number | null;
  updatedAt: string;
};

const SLUG_LABELS: Record<string, string> = {
  "decision-exposure-instrument": "Decision Exposure",
  "mandate-clarity-framework": "Mandate Clarity",
  "intervention-path-selector": "Intervention Path",
  "escalation-readiness-scorecard": "Escalation Readiness",
  "structural-failure-diagnostic-canvas": "Structural Failure Canvas",
  "execution-risk-index": "Execution Risk Index",
  "team-alignment-gap-map": "Team Alignment Gap Map",
  "decision-signal": "Decision Signal",
};

function bandColor(band: string): string {
  const upper = band.toUpperCase();
  if (upper === "CRITICAL" || upper === "OVERDUE" || upper === "COMPOUND_FAILURE") return "rgba(252,165,165,0.70)";
  if (upper === "HIGH" || upper === "READY" || upper === "WEAK") return "rgba(253,186,116,0.70)";
  if (upper === "MODERATE" || upper === "APPROACHING" || upper === "ADEQUATE") return `${GOLD}CC`;
  return "rgba(110,231,183,0.60)";
}

const HistoryPage: NextPage = () => {
  const [entries, setEntries] = React.useState<InstrumentHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    track("instrument_history_viewed");
    fetch("/api/decision-instruments/results")
      .then((r) => r.ok ? r.json() : { results: [] })
      .then((data) => {
        const mapped = (data.results || []).map((r: any) => {
          const result = r.data?.result ?? {};
          const slug = r.data?.instrumentSlug ?? "unknown";
          return {
            id: r.id ?? r.journeyKey,
            slug,
            title: SLUG_LABELS[slug] ?? slug.replace(/-/g, " "),
            resultBand: result.exposureBand ?? result.readinessBand ?? result.riskBand ?? result.alignmentBand ?? result.failurePattern ?? result.exposureBand ?? "UNKNOWN",
            score: result.exposureScore ?? result.readinessScore ?? result.riskIndex ?? result.overallAlignmentScore ?? result.healthScore ?? null,
            updatedAt: r.updatedAt ?? new Date().toISOString(),
          };
        });
        setEntries(mapped.sort((a: InstrumentHistoryEntry, b: InstrumentHistoryEntry) => b.updatedAt.localeCompare(a.updatedAt)));
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Instrument History | Abraham of London" description="Your governed decision instrument results.">
      <Head><meta name="robots" content="noindex" /></Head>
      <main className="min-h-screen px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Decision Instrument History
          </span>
          <h1 className="mt-4" style={{ ...serif, fontSize: "2rem", color: "white" }}>
            Your governed decision record.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Every instrument result is preserved. Movement over time shows whether the decision condition is improving, stable, or worsening.
          </p>

          {loading && (
            <p className="mt-8 text-sm text-white/30">Loading history...</p>
          )}

          {!loading && entries.length === 0 && (
            <div className="mt-8" style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem" }}>
              <p className="text-white/55">No instrument results recorded yet.</p>
              <p className="mt-3 text-sm leading-7 text-white/35">
                Start with the free Decision Signal to classify whether a decision condition exists,
                or run a paid instrument to produce a governed measurement. Every result is preserved
                in your decision record and informs the next admissible step.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/decision-instruments/signal" style={{ padding: "10px 16px", border: `1px solid ${GOLD}40`, color: `${GOLD}CC`, ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                  Free Decision Signal
                </Link>
                <Link href="/decision-instruments" style={{ padding: "10px 16px", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)", ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                  View instruments
                </Link>
              </div>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="mt-8 space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-white/70">{entry.title}</span>
                    <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", color: bandColor(entry.resultBand) }}>
                      {entry.resultBand.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {entry.score !== null && (
                      <span style={{ ...serif, fontSize: "1.5rem", color: bandColor(entry.resultBand) }}>{entry.score}</span>
                    )}
                    <span className="flex items-center gap-1 text-white/25" style={{ ...mono, fontSize: "8px" }}>
                      <Clock style={{ width: 9, height: 9 }} />
                      {new Date(entry.updatedAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <Link href={`/decision-instruments/${entry.slug}/run`} className="mt-3 flex items-center gap-1 text-white/30 hover:text-white/50" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Run again <ArrowRight style={{ width: 9, height: 9 }} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default HistoryPage;
