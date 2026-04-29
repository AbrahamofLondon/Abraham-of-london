/* pages/diagnostics/purpose-alignment.tsx
   Purpose Alignment Analysis — the personal diagnostic entry point.
   Positioned as the free public instrument that proves the platform's
   intelligence before the institutional ladder begins. */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import PurposeAlignmentAssessment from "@/components/alignment/PurposeAlignmentAssessment";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

export default function PurposeAlignmentPage() {
  React.useEffect(() => {
    track("purpose_alignment_viewed", {
      route: "/diagnostics/purpose-alignment",
    });
    try {
      window.sessionStorage.setItem("aol_diagnostics_origin", "purpose_alignment");
    } catch {
      // Origin marker is measurement-only.
    }
  }, []);

  return (
    <Layout
      title="Purpose Alignment Analysis | Abraham of London"
      description="A free personal analysis that reads your alignment across six structural domains. 8 minutes. No account required. Specific to your exact condition."
      canonicalUrl="/diagnostics/purpose-alignment"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
        <meta property="og:title" content="Purpose Alignment Analysis | Abraham of London" />
        <meta property="og:description" content="A free personal analysis that reads where your direction is holding and where it is structurally drifting." />
      </Head>

      <div style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "-5%", top: "-15%", width: "600px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}09 0%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
            <div className="pt-28 pb-12 md:pt-36 md:pb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
                  color: `${GOLD}BB`,
                }}>
                  Personal Analysis · Free · 8 minutes
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 4rem)",
                lineHeight: 0.98, letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.92)", maxWidth: "20ch",
                fontStyle: "italic",
              }}>
                Your decisions reveal your real mandate.
              </h1>

              <p style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.65,
                color: "rgba(255,255,255,0.48)", maxWidth: "52ch",
              }}>
                This is not a personality test. It reads whether your decisions, environment, and behaviour are structurally carrying what you say matters — then names the move required to restore order.
              </p>

              <div style={{
                marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}>
                <span>No account required</span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                <span>Instant result</span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                <span>Pattern-specific reading</span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                <span>Concrete first action</span>
              </div>

              <div
                style={{
                  marginTop: "1.75rem",
                  padding: "1rem 1.25rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.018)",
                  maxWidth: "44rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.96rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.46)",
                  }}
                >
                  This is a personal decision surface. The institutional ladder begins with the Constitutional Diagnostic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Assessment */}
        <section className="mx-auto max-w-6xl px-6 lg:px-12 pb-24">
          <PurposeAlignmentAssessment />
        </section>

        {/* Post-analysis context */}
        <section className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12 py-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}55` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase",
                  color: `${GOLD}90`,
                }}>
                  What comes next
                </span>
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
                color: "rgba(255,255,255,0.45)",
              }}>
                This analysis reads you personally. The Constitutional Diagnostic reads your organisation structurally. Together they form one decision system: personal direction informing institutional order.
              </p>
              <Link
                href="/diagnostics/constitutional-diagnostic"
                className="inline-flex items-center gap-2 mt-6 transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                  color: `${GOLD}`,
                }}
              >
                Test the organisational structure
                <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
