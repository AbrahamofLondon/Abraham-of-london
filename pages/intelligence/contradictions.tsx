import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import ClientIntelligenceStack from "@/components/Intelligence/user/ClientIntelligenceStack";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export default function IntelligenceContradictionsPage() {
  return (
    <Layout title="Contradictions | Abraham of London" description="User-safe contradiction preview for the active case.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 24px 96px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(252,165,165,0.72)" }}>
            Contradictions
          </p>
          <h1 style={{ ...serif, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.04, color: "rgba(255,255,255,0.90)", fontStyle: "italic", marginTop: "10px" }}>
            Active contradictions shaping the case.
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", marginTop: "10px", maxWidth: "56ch" }}>
            This is a plain-language preview. It shows the conflict, the current severity band, and what still requires action. It does not expose internal mechanics.
          </p>
          <div style={{ display: "grid", gap: "16px", marginTop: "28px" }}>
            <ClientIntelligenceStack
              scope={{
                sourceSurface: "INTELLIGENCE_CONTRADICTIONS",
                scopeLabel: "Account-wide view",
                scopeType: "ACCOUNT",
              }}
              showContradictions
              emptyTitle="No contradictions have been recorded yet."
              thinTitle="One contradiction has been recorded. Relationship mapping begins when another signal is available."
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
