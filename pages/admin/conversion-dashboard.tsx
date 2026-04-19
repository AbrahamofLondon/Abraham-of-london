/* pages/admin/conversion-dashboard.tsx — Internal conversion metrics */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { requireAdminPage } from "@/lib/access/server";

const GOLD = "#C9A96E";

type MetricRow = { label: string; value: string; target: string; status: "good" | "warn" | "fail" };

function Metric({ row }: { row: MetricRow }) {
  const color = row.status === "good" ? "rgba(110,231,183,0.80)"
    : row.status === "warn" ? `${GOLD}CC`
    : "rgba(252,165,165,0.80)";

  return (
    <div style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-panel)", padding: "1.25rem" }}>
      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}>
        {row.label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "2rem", lineHeight: 1, color }}>
          {row.value}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ds-text-subtle)" }}>
          Target: {row.target}
        </div>
      </div>
    </div>
  );
}

export default function ConversionDashboard() {
  return (
    <Layout title="Conversion Dashboard | Admin" fullWidth>
      <Head><meta name="robots" content="noindex,nofollow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "var(--ds-background)" }}>
        <div className="mx-auto max-w-5xl">
          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.34em", textTransform: "uppercase", color: `${GOLD}90` }}>
            Conversion Dashboard
          </div>
          <h1 className="mt-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "2.5rem", lineHeight: 1, color: "var(--ds-text)" }}>
            Launch Validation Metrics
          </h1>
          <p className="mt-4 text-sm" style={{ color: "var(--ds-text-muted)", maxWidth: "48ch" }}>
            These metrics are tracked via GA4 events. View real-time data in your Google Analytics dashboard
            under Events. The targets below define the go/no-go decision matrix.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Metric row={{ label: "A1 — Activation", value: "—", target: "≥ 35%", status: "warn" }} />
            <Metric row={{ label: "A2 — Completion", value: "—", target: "≥ 70%", status: "warn" }} />
            <Metric row={{ label: "A3 — Trust Conversion", value: "—", target: "≥ 20%", status: "warn" }} />
            <Metric row={{ label: "A4 — Payment Conversion", value: "—", target: "≥ 5–10%", status: "warn" }} />
            <Metric row={{ label: "A5 — Escalation", value: "—", target: "≥ 10–20%", status: "warn" }} />
            <Metric row={{ label: "Accuracy (self-report)", value: "—", target: "≥ 50% precise", status: "warn" }} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Metric row={{ label: "Avg Time to First Click", value: "—", target: "< 30s", status: "warn" }} />
            <Metric row={{ label: "Paywall Hesitation", value: "—", target: "< 120s", status: "warn" }} />
            <Metric row={{ label: "Result Engagement Time", value: "—", target: "≥ 60s", status: "warn" }} />
            <Metric row={{ label: "Conversion by User Type", value: "—", target: "personal > operator", status: "warn" }} />
            <Metric row={{ label: "Conversion by Device", value: "—", target: "desktop ≥ mobile", status: "warn" }} />
            <Metric row={{ label: "Checkout Failures", value: "—", target: "< 2%", status: "warn" }} />
          </div>

          <div className="mt-10" style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-panel)", padding: "1.5rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "1rem" }}>
              Decision Matrix
            </div>
            <div className="space-y-2 text-[13px] leading-[1.7]" style={{ color: "var(--ds-text-muted)" }}>
              <p><strong style={{ color: "rgba(110,231,183,0.80)" }}>A1-A4 above threshold</strong> → LAUNCH</p>
              <p><strong style={{ color: "rgba(252,165,165,0.80)" }}>A1 good, A3/A4 weak</strong> → DO NOT LAUNCH (credibility gap)</p>
              <p><strong style={{ color: "rgba(252,165,165,0.80)" }}>A1 weak</strong> → DO NOT LAUNCH (positioning failure)</p>
              <p><strong style={{ color: `${GOLD}CC` }}>A4 strong + A5 strong</strong> → SCALE AGGRESSIVELY</p>
            </div>
          </div>

          <div className="mt-10" style={{ border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-panel)", padding: "1.5rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "1rem" }}>
              GA4 Event Map
            </div>
            <div className="space-y-1 font-mono text-[11px]" style={{ color: "var(--ds-text-subtle)" }}>
              <p>hero_viewed → A1 denominator</p>
              <p>hero_personal_clicked / hero_institutional_clicked → A1 numerator</p>
              <p>diagnostics_stage_start → A1 numerator (alt)</p>
              <p>diagnostics_stage_complete → A2 numerator (with duration_seconds)</p>
              <p>executive_reporting_paywall_viewed → A3 denominator</p>
              <p>executive_reporting_checkout_clicked → A3 numerator</p>
              <p>executive_reporting_checkout_returned_success → A4 numerator</p>
              <p>strategy_room_checkout_clicked → A5 numerator</p>
              <p>diagnostic_feedback → accuracy signal (score: precise/partial/no)</p>
              <p>hero_cards_visible → card exposure (time_to_visible_ms)</p>
              <p>scroll_depth → engagement depth (percent: 25/50/75/100)</p>
              <p>checkout_failed → failure signal (price_code, reason)</p>
              <p>result_engagement → result depth (time_on_result_ms, route)</p>
              <p>executive_reporting_paywall_abandoned → exit signal (time &gt; 5s)</p>
              <p>strategy_room_bridge_abandoned → exit signal (time &gt; 5s)</p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect;
  return { props: {} };
};
