/**
 * pages/retainers/status/[token].tsx — Client-safe retainer status
 *
 * Accessible via contract ID as token.
 * Shows: contract tier, current cycle, health, next review date,
 *        what is being monitored, what is not yet verified.
 * Never shows: internal notes, admin data, other clients' data.
 */

import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { getClientSafeContractStatus } from "@/lib/retainers/retainer-pipeline-service";
import {
  PIPELINE_STAGE_LABELS,
  assertNoInternalFields,
} from "@/lib/retainers/retainer-pipeline-contracts";
import type { ClientSafeContractStatus } from "@/lib/retainers/retainer-pipeline-contracts";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

type PageProps =
  | { found: true; status: ClientSafeContractStatus }
  | { found: false };

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { token } = ctx.params ?? {};
  if (!token || typeof token !== "string") {
    return { props: { found: false } };
  }

  try {
    const status = await getClientSafeContractStatus(token);
    if (!status) return { props: { found: false } };

    // Guard: verify no internal fields before sending to client
    assertNoInternalFields(status as unknown as Record<string, unknown>);
    if (status.currentCycle) {
      assertNoInternalFields(status.currentCycle as unknown as Record<string, unknown>);
    }

    return { props: { found: true, status } };
  } catch {
    return { props: { found: false } };
  }
};

function HealthBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    HEALTHY: "#27ae60", WATCH: "#f39c12", DETERIORATING: "#e67e22",
    CRITICAL: "#c0392b", UNKNOWN: "#5e5850",
  };
  return (
    <span style={{
      ...mono, fontSize: 10, letterSpacing: "0.1em", padding: "3px 8px",
      background: colours[status] ?? "#5e5850", color: "#fff", borderRadius: 2,
    }}>
      {status}
    </span>
  );
}

export default function RetainerStatusPage(props: PageProps) {
  if (!props.found) {
    return (
      <Layout>
        <Head><title>Contract Status | Abraham of London</title></Head>
        <div style={{ background: "#060609", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <p style={{ ...mono, fontSize: 11, color: "#5e5850", letterSpacing: "0.1em" }}>STATUS NOT FOUND</p>
            <p style={{ fontSize: 14, color: "#5e5850", marginTop: 12 }}>
              This contract status is not available. The contract may be inactive or the reference may be incorrect.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const { status } = props;
  const stageLabel = PIPELINE_STAGE_LABELS[status.pipelineStage];

  return (
    <Layout>
      <Head>
        <title>Retainer Status | Abraham of London</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main style={{ background: "#060609", color: "#e8e0d0", minHeight: "100vh" }}>

        {/* Header */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "48px 24px 36px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, marginBottom: 16 }}>RETAINER STATUS</p>
            <h1 style={{ ...serif, fontSize: 32, fontWeight: 300, color: "#f5f0e8", marginBottom: 12 }}>
              {status.tierLabel}
            </h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ ...mono, fontSize: 11, color: "#5e5850" }}>
                Active since {new Date(status.startDate).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
              </span>
              <span style={{ ...mono, fontSize: 11, color: "#5e5850" }}>·</span>
              <span style={{ ...mono, fontSize: 11, color: "#b8b0a0" }}>{stageLabel}</span>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>

          {/* Current cycle */}
          {status.currentCycle ? (
            <section style={{ marginBottom: 48 }}>
              <p style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", color: GOLD, marginBottom: 24 }}>
                CURRENT REVIEW CYCLE — #{status.currentCycle.cycleNumber}
              </p>
              <div style={{ background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4, padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, marginBottom: 20 }}>
                  <div>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 6 }}>STATUS</p>
                    <p style={{ fontSize: 14, color: "#b8b0a0" }}>{status.currentCycle.status}</p>
                  </div>
                  <div>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 6 }}>CLIENT HEALTH</p>
                    <HealthBadge status={status.currentCycle.clientHealthStatus} />
                  </div>
                  <div>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 6 }}>PERIOD</p>
                    <p style={{ fontSize: 13, color: "#9e9890" }}>
                      {new Date(status.currentCycle.periodStart).toLocaleDateString("en-GB")} –{" "}
                      {new Date(status.currentCycle.periodEnd).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  {status.currentCycle.nextCycleDate && (
                    <div>
                      <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 6 }}>NEXT REVIEW DUE</p>
                      <p style={{ fontSize: 13, color: "#9e9890" }}>
                        {new Date(status.currentCycle.nextCycleDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  )}
                </div>
                {status.currentCycle.outcomeSummary && (
                  <div style={{ borderTop: "1px solid #1a1a20", paddingTop: 16 }}>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 8 }}>OUTCOME SUMMARY</p>
                    <p style={{ fontSize: 14, color: "#b8b0a0", lineHeight: 1.7 }}>{status.currentCycle.outcomeSummary}</p>
                  </div>
                )}
                {status.currentCycle.clientNotes && (
                  <div style={{ borderTop: "1px solid #1a1a20", paddingTop: 16, marginTop: 16 }}>
                    <p style={{ ...mono, fontSize: 10, color: "#5e5850", marginBottom: 8 }}>NOTES FOR THIS CYCLE</p>
                    <p style={{ fontSize: 14, color: "#b8b0a0", lineHeight: 1.7 }}>{status.currentCycle.clientNotes}</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section style={{ marginBottom: 48 }}>
              <p style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", color: GOLD, marginBottom: 16 }}>REVIEW CYCLES</p>
              <p style={{ fontSize: 14, color: "#5e5850" }}>No review cycles have been opened yet for this contract.</p>
            </section>
          )}

          <FeedbackWidget
            surface="retainer_review_cycle"
            subjectType="retainer_contract"
            subjectId={status.contractId}
            productCode="retainer_oversight"
            compact
          />

          {/* What is being monitored */}
          <section style={{ marginBottom: 48 }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", color: GOLD, marginBottom: 20 }}>WHAT IS BEING MONITORED</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {status.whatIsBeingMonitored.map(item => (
                <div key={item} style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: GOLD, flexShrink: 0, paddingTop: 2 }}>›</span>
                  <p style={{ fontSize: 14, color: "#b8b0a0", lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What is not yet verified */}
          {status.whatIsNotYetVerified.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <p style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", color: "#6e6860", marginBottom: 20 }}>WHAT IS NOT YET VERIFIED</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {status.whatIsNotYetVerified.map(item => (
                  <div key={item} style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#5e5850", flexShrink: 0, paddingTop: 2 }}>—</span>
                    <p style={{ fontSize: 13, color: "#7e7870", lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </Layout>
  );
}
