import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import ClientIntelligenceStack from "@/components/Intelligence/user/ClientIntelligenceStack";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export default function IntelligenceMemoryPage() {
  return (
    <Layout title="Intelligence Memory | Abraham of London" description="What changed, what carried forward, and what the record now suggests.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 24px 96px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
            Intelligence memory
          </p>
          <h1 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.04, color: "rgba(255,255,255,0.90)", fontStyle: "italic", marginTop: "10px" }}>
            What changed since the last governed reading.
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", marginTop: "10px", maxWidth: "56ch" }}>
            This page surfaces movement, not mechanism. It shows what the record now suggests, what remains unresolved, and where earlier evidence is still shaping the case.
          </p>
          <div style={{ display: "grid", gap: "16px", marginTop: "28px" }}>
            <ClientIntelligenceStack
              scope={{
                sourceSurface: "INTELLIGENCE_MEMORY",
                scopeLabel: "Account-wide view",
                scopeType: "ACCOUNT",
              }}
              showVelocity
              showWhatChanged
              showCrossAssessment
              emptyTitle="No decision memory has been created yet. Start with Fast Diagnostic."
              thinTitle="Memory is forming. Complete another checkpoint or diagnostic to make comparison possible."
            />
          </div>
          <div style={{ marginTop: "28px" }}>
            <Link href="/decision-centre" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}>
              Return to Decision Centre
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
