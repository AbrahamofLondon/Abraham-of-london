/**
 * pages/admin/launch-dashboard.tsx — Internal launch drop-off dashboard.
 *
 * Simple operational truth. No luxury UI.
 * Shows: starts vs completions, checkpoint rates, earned progression,
 * counsel eligibility, and Strategy Room entries.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { requireAdminPage } from "@/lib/access/server";

type EventCounts = Record<string, number>;
type TimeWindow = "7d" | "30d" | "all";

const FUNNELS = [
  { label: "Fast Diagnostic", start: "fast_started", end: "fast_completed" },
  { label: "Purpose Alignment", start: "purpose_alignment_started", end: "purpose_alignment_completed" },
  { label: "Earned Step", start: "earned_step_shown", end: "earned_step_clicked" },
  { label: "Checkpoint", start: "checkpoint_created", end: "checkpoint_responded" },
  { label: "Executive Reporting", start: "executive_reporting_gate_viewed", end: "executive_reporting_started" },
  { label: "Counsel Intake", start: "counsel_intake_started", end: "counsel_intake_submitted" },
];

const SINGLES = [
  { label: "Homepage CTA Clicks", event: "homepage_cta_clicked" },
  { label: "Decision Centre Opens", event: "decision_centre_opened" },
  { label: "Return Brief Opens", event: "return_brief_opened" },
  { label: "Return Brief Responses", event: "return_brief_response_submitted" },
  { label: "Strategy Room Entries", event: "strategy_room_entered" },
  { label: "Strategy Room Decisions", event: "strategy_room_decision_recorded" },
  { label: "Counsel Room Views", event: "counsel_room_viewed" },
];

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

const LaunchDashboard: NextPage<{ isAuthorized: boolean }> = () => {
  const [window, setWindow] = React.useState<TimeWindow>("7d");
  const [counts, setCounts] = React.useState<EventCounts>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/launch-events?window=${window}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCounts(json.counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [window]);

  return (
    <>
      <Head>
        <title>Launch Dashboard | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", fontFamily: "'JetBrains Mono', monospace" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Launch Drop-Off Dashboard
        </h1>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>
          Operational truth. Not vanity metrics.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {(["7d", "30d", "all"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              style={{
                padding: "6px 16px",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                border: `1px solid ${window === w ? "#C9A96E" : "#333"}`,
                backgroundColor: window === w ? "rgba(201,169,110,0.12)" : "transparent",
                color: window === w ? "#C9A96E" : "#888",
                cursor: "pointer",
              }}
            >
              {w === "7d" ? "7 Days" : w === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontSize: 11, color: "#666" }}>Loading...</p>
        ) : (
          <>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, color: "#C9A96E" }}>
              Progression Funnels
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32, fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#888" }}>Stage</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#888" }}>Started</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#888" }}>Completed</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#888" }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {FUNNELS.map((f) => {
                  const s = counts[f.start] ?? 0;
                  const e = counts[f.end] ?? 0;
                  return (
                    <tr key={f.label} style={{ borderBottom: "1px solid #222" }}>
                      <td style={{ padding: "8px 12px", color: "#ccc" }}>{f.label}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", color: "#fff" }}>{s}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", color: "#fff" }}>{e}</td>
                      <td style={{ textAlign: "right", padding: "8px 12px", color: e > 0 && s > 0 ? "#6ee7b7" : "#666" }}>{pct(e, s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, color: "#C9A96E" }}>
              Surface Activity
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "#888" }}>Surface</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "#888" }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {SINGLES.map((s) => (
                  <tr key={s.event} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "8px 12px", color: "#ccc" }}>{s.label}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", color: "#fff" }}>{counts[s.event] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const guard = await requireAdminPage(context);
  if (!guard.authorized) return guard.redirect;
  return { props: { isAuthorized: true } };
};

export default LaunchDashboard;
