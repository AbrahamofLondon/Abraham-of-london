/**
 * pages/admin/demo-conversion.tsx — §13 conversion dashboard.
 *
 * Admin-gated view over the durable funnel store (§12). Answers "where is the corridor
 * losing serious buyers?" — signal / pilot / commercial funnels, completion rates and the
 * biggest drop-off, with date-range + journey-version filters. Uses the existing admin
 * auth gate; does not create a new admin application.
 */

import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { requireAdminPage } from "@/lib/access/server";
import { COLORS, FONTS, caption, card, bodyTextSm } from "@/lib/demo/journey-design";
import type { FunnelSummary } from "@/lib/demo/funnel-event-store.composed";

interface PageProps {
  summary: FunnelSummary | null;
  from: string;
  to: string;
  journeyVersion: string;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const from = typeof ctx.query.from === "string" ? ctx.query.from : "";
  const to = typeof ctx.query.to === "string" ? ctx.query.to : "";
  const journeyVersion = typeof ctx.query.jv === "string" ? ctx.query.jv : "";

  const { summarizeFunnel } = await import("@/lib/demo/funnel-event-store.composed");
  const summary = await Promise.resolve(
    summarizeFunnel({ from: from || undefined, to: to || undefined, journeyVersion: journeyVersion || undefined }),
  ).catch((err) => { console.error("[demo-conversion] summarize error", err); return null; });

  return { props: { summary: summary ? JSON.parse(JSON.stringify(summary)) : null, from, to, journeyVersion } };
};

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...card(), padding: "16px 18px" }}>
      <div style={{ ...caption(), fontSize: 10 }}>{label}</div>
      <div style={{ fontFamily: FONTS.display, fontSize: "2rem", color: COLORS.ink, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ ...bodyTextSm, color: COLORS.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FunnelRow({ label, n, of }: { label: string; n: number; of?: number }) {
  const pct = of && of > 0 ? Math.round((n / of) * 100) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 220, ...bodyTextSm, color: COLORS.body }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: COLORS.surface, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct ?? 100}%`, height: "100%", background: COLORS.gold, opacity: 0.75 }} />
      </div>
      <div style={{ width: 90, textAlign: "right", fontFamily: FONTS.mono, fontSize: 12, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>
        {n}{pct !== null ? ` · ${pct}%` : ""}
      </div>
    </div>
  );
}

export default function DemoConversionPage({ summary, from, to, journeyVersion }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head><title>Demo Conversion · Admin</title><meta name="robots" content="noindex,nofollow" /></Head>
      <main style={{ background: COLORS.canvas, minHeight: "100vh", padding: "48px 24px 96px", color: COLORS.body }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.18em", color: COLORS.gold }}>DEMO-TO-EVIDENCE · CONVERSION</span>
              <h1 style={{ fontFamily: FONTS.display, fontWeight: 300, fontSize: "2rem", color: COLORS.ink, margin: "8px 0 0" }}>Flagship journey funnel</h1>
            </div>
          </div>

          {/* filters */}
          <form method="get" style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ ...caption(COLORS.muted), display: "grid", gap: 4 }}>From (ISO)
              <input name="from" defaultValue={from} placeholder="2026-07-01" style={{ fontFamily: FONTS.mono, fontSize: 13, background: COLORS.surfaceRaised, border: `1px solid ${COLORS.hair}`, color: COLORS.ink, padding: "8px 10px", borderRadius: 4 }} /></label>
            <label style={{ ...caption(COLORS.muted), display: "grid", gap: 4 }}>To (ISO)
              <input name="to" defaultValue={to} placeholder="2026-07-31" style={{ fontFamily: FONTS.mono, fontSize: 13, background: COLORS.surfaceRaised, border: `1px solid ${COLORS.hair}`, color: COLORS.ink, padding: "8px 10px", borderRadius: 4 }} /></label>
            <label style={{ ...caption(COLORS.muted), display: "grid", gap: 4 }}>Journey version
              <input name="jv" defaultValue={journeyVersion} placeholder="flagship-1" style={{ fontFamily: FONTS.mono, fontSize: 13, background: COLORS.surfaceRaised, border: `1px solid ${COLORS.hair}`, color: COLORS.ink, padding: "8px 10px", borderRadius: 4 }} /></label>
            <button type="submit" style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.canvas, background: COLORS.gold, border: "none", padding: "10px 18px", borderRadius: 4, cursor: "pointer" }}>Apply</button>
          </form>

          {!summary || summary.totalEvents === 0 ? (
            <div style={{ ...card(COLORS.gold), marginTop: 28 }}>
              <div style={caption(COLORS.goldSoft)}>No funnel events yet</div>
              <p style={{ ...bodyTextSm, marginTop: 8 }}>
                Once the flagship journey receives traffic, events posted to <code>/api/demo/funnel-event</code> populate here.
                The dashboard is live and reading the durable store; it simply has nothing to show for this range yet.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 28 }}>
                <Metric label="Signal completion" value={`${summary.signal.completionRate}%`} sub={`${summary.signal.completions} of ${summary.signal.starts} starts`} />
                <Metric label="Pilot submissions" value={summary.pilot.submissions} sub={`${summary.pilot.accepted} accepted · ${summary.pilot.declined} declined`} />
                <Metric label="Commercial continuations" value={summary.commercial.continuationCompleted} sub={`${summary.commercial.continuationStarted} started`} />
                <Metric label="Total events" value={summary.totalEvents} />
              </div>

              {summary.biggestDropOff && (
                <div style={{ ...card(COLORS.rose), marginTop: 16 }}>
                  <span style={caption(COLORS.rose)}>Biggest drop-off</span>
                  <p style={{ ...bodyTextSm, marginTop: 8, color: COLORS.ink }}>
                    {summary.biggestDropOff.lost} lost between <strong>{summary.biggestDropOff.from.replace(/_/g, " ").toLowerCase()}</strong> and <strong>{summary.biggestDropOff.to.replace(/_/g, " ").toLowerCase()}</strong>.
                  </p>
                </div>
              )}

              <div style={{ ...card(), marginTop: 24, display: "grid", gap: 12 }}>
                <span style={caption()}>Signal funnel</span>
                <FunnelRow label="Landing viewed" n={summary.counts.SIGNAL_LANDING_VIEWED} />
                <FunnelRow label="Started" n={summary.counts.SIGNAL_STARTED} of={summary.counts.SIGNAL_LANDING_VIEWED} />
                <FunnelRow label="Completed" n={summary.counts.SIGNAL_COMPLETED} of={summary.counts.SIGNAL_STARTED} />
                <FunnelRow label="Next move accepted" n={summary.counts.NEXT_MOVE_ACCEPTED} of={summary.counts.SIGNAL_COMPLETED} />
              </div>

              <div style={{ ...card(), marginTop: 16, display: "grid", gap: 12 }}>
                <span style={caption()}>Pilot funnel</span>
                <FunnelRow label="Pilot viewed" n={summary.counts.PILOT_VIEWED} />
                <FunnelRow label="Intake started" n={summary.counts.PILOT_STARTED} of={summary.counts.PILOT_VIEWED} />
                <FunnelRow label="Submitted" n={summary.counts.PILOT_SUBMITTED} of={summary.counts.PILOT_STARTED} />
                <FunnelRow label="Accepted" n={summary.counts.PILOT_ACCEPTED} of={summary.counts.PILOT_SUBMITTED} />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
