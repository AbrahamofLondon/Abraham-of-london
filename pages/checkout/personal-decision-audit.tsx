/**
 * pages/checkout/personal-decision-audit.tsx
 *
 * Stripe Checkout page for the Personal Decision Audit (£49).
 *
 * This is the paid gate for the Purpose Alignment assessment.
 * After successful payment, the user is redirected to the assessment
 * page with the personal-decision-audit entitlement granted.
 */

import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, Shield, FileText, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const DELIVERABLES = [
  "Mandate clarity reading — what you say vs what your behaviour reveals",
  "Obligation conflict map — the competing forces pulling against your direction",
  "Decision behaviour pattern — the recurring pattern under pressure",
  "Alignment drift warning — where you are drifting and what it costs",
  "Execution integrity implication — whether your pattern threatens execution",
  "Personal decision constitution — your governing principles and rules",
  "Next admissible move — the single most important action",
  "Decision Centre memory — your result is recorded and tracked",
  "PDF dossier — full downloadable report",
  "Corridor bridge — escalation to Executive Reporting if justified",
];

export default function PersonalDecisionAuditCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePurchase() {
    setLoading(true);
    setError(null);

    try {
      track("personal_decision_audit_checkout_started", {});

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "personal-decision-audit",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.canonicalEndpoint) {
          // Redirect to canonical billing checkout
          window.location.href = data.canonicalEndpoint;
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }

      track("personal_decision_audit_checkout_completed", {});

      // Redirect to the assessment with the entitlement
      router.push("/diagnostics/purpose-alignment?purchased=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Personal Decision Audit | Abraham of London"
      description="Purchase the Personal Decision Audit — a governed mandate assessment that tests whether your decisions, obligations, authority, and execution behaviour are aligned."
      canonicalUrl="/checkout/personal-decision-audit"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <div className="py-14 lg:py-20">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}>
                Purchase
              </span>
            </div>

            <div className="mt-8 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
              {/* Left — Product Details */}
              <div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                  lineHeight: 1.0, color: "rgba(255,255,255,0.92)",
                  fontStyle: "italic",
                }}>
                  Personal Decision Audit
                </h1>

                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  marginTop: "0.8rem", fontSize: "0.95rem", lineHeight: 1.6,
                  color: "rgba(255,255,255,0.42)", maxWidth: "52ch",
                }}>
                  This is not a self-help quiz. It is a governed personal mandate assessment
                  that tests whether your decisions, obligations, authority, and execution
                  behaviour are aligned with the life, work, family, vocation, and institutional
                  responsibilities you claim to hold.
                </p>

                <div className="mt-8 space-y-4">
                  {DELIVERABLES.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle style={{
                        width: "14px", height: "14px", color: `${GOLD}88`,
                        marginTop: "2px", flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: "13px", lineHeight: 1.55,
                        color: "rgba(255,255,255,0.55)",
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[16px]" style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "16px 20px",
                }}>
                  <div className="flex items-center gap-2">
                    <Shield style={{ width: "12px", height: "12px", color: `${GOLD}66` }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                      color: `${GOLD}88`,
                    }}>
                      What this is not
                    </span>
                  </div>
                  <p style={{
                    marginTop: "8px", fontSize: "12px", lineHeight: 1.6,
                    color: "rgba(255,255,255,0.35)",
                  }}>
                    This is not a personality test, coaching form, self-help content,
                    career quiz, or AI advice generator. It tests alignment under obligation,
                    detects mandate conflict, records decision posture, creates governed memory,
                    and recommends escalation only when the evidence justifies it.
                  </p>
                </div>
              </div>

              {/* Right — Purchase Card */}
              <div style={{
                position: "sticky", top: "24px",
                border: `1px solid ${GOLD}24`,
                backgroundColor: `${GOLD}04`,
                padding: "28px 24px",
                height: "fit-content",
              }}>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontSize: "2.4rem", lineHeight: 1, color: "rgba(255,255,255,0.90)",
                  fontStyle: "italic",
                }}>
                  £49
                </div>
                <p style={{
                  marginTop: "4px", fontSize: "12px", lineHeight: 1.5,
                  color: "rgba(255,255,255,0.30)",
                }}>
                  One-time purchase · Lifetime access · Full dossier
                </p>

                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={loading}
                  className="mt-6 w-full transition-all"
                  style={{
                    padding: "14px 24px",
                    border: `1px solid ${GOLD}50`,
                    backgroundColor: `${GOLD}18`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {loading ? "Processing..." : "Purchase now"}
                  {!loading && <ArrowRight style={{ width: "11px", height: "11px" }} />}
                </button>

                {error && (
                  <div className="mt-4 rounded-[8px]" style={{
                    backgroundColor: "rgba(252,165,165,0.08)",
                    border: "1px solid rgba(252,165,165,0.15)",
                    padding: "10px 14px",
                  }}>
                    <p style={{ fontSize: "11px", lineHeight: 1.5, color: "rgba(252,165,165,0.70)" }}>
                      {error}
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.20)" }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}>
                      PDF dossier included
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.20)" }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}>
                      Decision Centre memory included
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{
                    fontSize: "11px", lineHeight: 1.6,
                    color: "rgba(255,255,255,0.28)", fontStyle: "italic",
                  }}>
                    &ldquo;This should not be £49.&rdquo; — not because of hype, but because
                    the output is structured, specific, and difficult to get elsewhere
                    without a serious adviser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
