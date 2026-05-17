/* pages/diagnostics/purpose-alignment.tsx
   Purpose Alignment Analysis — the personal diagnostic entry point.
   accessPosture: Free signal (free reading) | Paid instrument (£49 governed dossier)
   Positioned as the free public instrument that proves the platform's
   intelligence before the institutional ladder begins. */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock, Unlock, ShieldCheck } from "lucide-react";

import Layout from "@/components/Layout";
import PurposeAlignmentAssessment from "@/components/alignment/PurposeAlignmentAssessment";
import AssessmentResultSurface from "@/components/diagnostics/AssessmentResultSurface";
import { track } from "@/lib/analytics/track";
import { mapPurposeAlignmentToAssessmentResult } from "@/lib/diagnostics/assessment-result-mappers";
import type { AssessmentResult } from "@/lib/diagnostics/assessment-result-contract";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const EMERALD = "#6EE7B7";
const VOID = "rgb(3 3 5)";

type EntitlementState = "loading" | "free" | "paid_unlocked" | "auth_required";

export default function PurposeAlignmentPage() {
  const [entitlementState, setEntitlementState] = React.useState<EntitlementState>("loading");
  const [assessmentResult, setAssessmentResult] = React.useState<AssessmentResult | null>(null);

  React.useEffect(() => {
    track("purpose_alignment_viewed", {
      route: "/diagnostics/purpose-alignment",
    });
    try {
      window.sessionStorage.setItem("aol_diagnostics_origin", "purpose_alignment");
    } catch {
      // Origin marker is measurement-only.
    }

    // Check entitlement on mount
    fetch("/api/entitlements")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          setEntitlementState("auth_required");
          return;
        }
        const hasPaid = (data.entitlements ?? []).some(
          (e: { slug: string }) => e.slug === "personal-decision-audit",
        );
        setEntitlementState(hasPaid ? "paid_unlocked" : "free");
      })
      .catch(() => {
        setEntitlementState("free");
      });
  }, []);

  function stateLabel() {
    switch (entitlementState) {
      case "loading":
        return { label: "Checking access...", color: "rgba(255,255,255,0.25)" };
      case "free":
        return { label: "Free assessment · 8 minutes · Upgrade available", color: `${GOLD}BB` };
      case "paid_unlocked":
        return { label: "Personal Decision Audit · Paid · Full dossier unlocked", color: `${EMERALD}BB` };
      case "auth_required":
        return { label: "Sign in to access paid features", color: `${AMBER}AA` };
    }
  }

  function stateIcon() {
    switch (entitlementState) {
      case "paid_unlocked":
        return <ShieldCheck style={{ width: 10, height: 10, color: EMERALD }} />;
      case "auth_required":
        return <Lock style={{ width: 10, height: 10, color: AMBER }} />;
      default:
        return null;
    }
  }

  const currentLabel = stateLabel();

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
                {stateIcon()}
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
                  color: currentLabel.color,
                }}>
                  Personal Decision Infrastructure · {currentLabel.label}
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
                  Test whether your stated direction can survive evidence, pressure, contradiction, and consequence. The institutional ladder begins with the Constitutional Diagnostic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Purchase CTA for free users */}
        {entitlementState === "free" && (
          <section className="mx-auto max-w-6xl px-6 lg:px-12 pb-4">
            <div style={{
              border: `1px solid ${GOLD}24`,
              backgroundColor: `${GOLD}04`,
              padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "12px",
            }}>
              <div>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: `${GOLD}AA`,
                }}>
                  Personal Decision Audit · £49
                </span>
                <p style={{
                  marginTop: "4px", fontSize: "12px", lineHeight: 1.5,
                  color: "rgba(255,255,255,0.40)", maxWidth: "48ch",
                }}>
                  Full dossier with mandate reading, obligation conflict map, decision behaviour pattern,
                  alignment drift warning, execution integrity implication, personal decision constitution,
                  next admissible move, Decision Centre memory, and PDF download.
                </p>
              </div>
              <Link
                href="/checkout/personal-decision-audit"
                style={{
                  padding: "10px 18px",
                  border: `1px solid ${GOLD}50`,
                  backgroundColor: `${GOLD}18`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase",
                  textDecoration: "none", whiteSpace: "nowrap",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                }}
              >
                Continue to the governed assessment
                <ArrowRight style={{ width: "10px", height: "10px" }} />
              </Link>
            </div>
          </section>
        )}

        {/* Paid unlocked banner */}
        {entitlementState === "paid_unlocked" && (
          <section className="mx-auto max-w-6xl px-6 lg:px-12 pb-4">
            <div style={{
              border: `1px solid ${EMERALD}30`,
              backgroundColor: `${EMERALD}08`,
              padding: "16px 20px",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <ShieldCheck style={{ width: 16, height: 16, color: EMERALD, flexShrink: 0 }} />
              <div>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: `${EMERALD}CC`,
                }}>
                  Personal Decision Audit — unlocked
                </span>
                <p style={{
                  marginTop: "2px", fontSize: "12px", lineHeight: 1.5,
                  color: "rgba(255,255,255,0.45)",
                }}>
                  Complete the assessment to receive your full dossier with all 10 paid deliverables.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── What this reads / detects / record boundary ────────────────── */}
        <section className="mx-auto max-w-6xl px-6 lg:px-12 pb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                What this reads
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                Your avoided decision, stated obligation, chosen consequence, and personal context across six structural domains.
              </p>
            </div>
            <div style={{ borderLeft: `2px solid ${GOLD}30`, padding: "0.75rem 1.25rem", backgroundColor: `${GOLD}04` }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                What this detects
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                Purpose alignment posture, primary contradiction between values and behaviour, governance implication, and the next structural move.
              </p>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1.25rem", backgroundColor: "rgba(255,255,255,0.015)" }}>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.4rem" }}>
                Record boundary
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.40)" }}>
                This creates a session result until saved. Saving creates an account-bound governed case in Decision Centre with a record status and next earned action.
              </p>
            </div>
          </div>
        </section>

        {/* Assessment */}
        <section className="mx-auto max-w-6xl px-6 lg:px-12 pb-24">
          <PurposeAlignmentAssessment
            isPaidEntitled={entitlementState === "paid_unlocked"}
            onScored={(result) => setAssessmentResult(mapPurposeAlignmentToAssessmentResult(result))}
          />
        </section>

        {/* ── Shared result surface — appears when assessment completes ─────── */}
        {assessmentResult && (
          <section className="mx-auto max-w-2xl px-6 pb-24">
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem" }}>
              <AssessmentResultSurface result={assessmentResult} />
            </div>
          </section>
        )}

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
              {!assessmentResult && (
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
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
