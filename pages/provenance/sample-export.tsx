/**
 * pages/provenance/sample-export.tsx
 *
 * Client-safe provenance sample export — a standalone HTML page suitable
 * for sending to serious prospects. Contains a sample provenance summary
 * with accountability statement, hash, confidence bands, milestone timeline,
 * gap class counts, anchor status, and chain boundary note.
 *
 * This is a client-safe provenance summary. It does not expose internal
 * review notes, suppression details, or raw governance events.
 *
 * External anchoring is not yet configured.
 */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Shield, Hash, Clock, Layers, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

import Layout from "@/components/Layout";
import { trackLaunch } from "@/lib/analytics/client-launch-events";

// ─── Design tokens ─────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Sample data ────────────────────────────────────────────────────────────

const SAMPLE_HASH = "a3f5c8e1b2d7f9a0c4e6b8d2f1a3c5e7b9d0f2a4c6e8b1d3f5a7c9e0b2d4f6";

const SAMPLE_CONFIDENCE_BANDS = [
  { level: "OPERATOR_VERIFIED", label: "Operator-verified", count: 3 },
  { level: "SYSTEM_INFERRED", label: "System-inferred", count: 2 },
  { level: "USER_REPORTED", label: "User-reported", count: 1 },
];

const SAMPLE_TIMELINE = [
  { milestone: "EVIDENCE_CAPTURED", label: "Evidence captured", date: "14 May 2026" },
  { milestone: "REVIEW_COMPLETED", label: "Governance review completed", date: "14 May 2026" },
  { milestone: "DELIVERY_SENT", label: "Oversight brief delivered", date: "15 May 2026" },
  { milestone: "OUTCOME_RECORDED", label: "Outcome verified", date: "28 May 2026" },
];

const SAMPLE_GAP_CLASSES = ["WARNING"];

// ─── Page ──────────────────────────────────────────────────────────────────

const SampleExportPage: NextPage = () => {
  React.useEffect(() => {
    trackLaunch("provenance_sample_viewed", "provenance_sample_export");
  }, []);

  return (
    <Layout
      title="Provenance Sample Export | Abraham of London"
      description="Client-safe provenance summary sample — accountability statement, hash, confidence bands, timeline, and gap counts."
      fullWidth
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-3xl space-y-8">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${GOLD}30`,
                backgroundColor: `${GOLD}08`,
                color: `${GOLD}BB`,
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.25rem 0.55rem",
                marginBottom: "0.85rem",
              }}
            >
              Sample / no live client data
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Client-Safe Provenance Summary
              </p>
            </div>
            <h1 style={{ ...serif, fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)" }}>
              Decision Provenance Record
            </h1>
            <p style={{ marginTop: "0.75rem", ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
              This is a client-safe provenance summary. It does not expose internal review notes, suppression details, or raw governance events.
            </p>
            <p style={{ marginTop: "0.4rem", ...serif, fontSize: "0.9rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
              This page demonstrates the client-safe provenance format. It is not generated from the current visitor's account or case.
            </p>
            <p style={{ marginTop: "0.4rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)" }}>
              Sample data for demonstration purposes. Not connected to your account, case, or governed record.
            </p>
          </header>

          {/* ── ACCOUNTABILITY STATEMENT ────────────────────────────── */}
          <section style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}03`, padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
              Accountability statement
            </p>
            <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.78)" }}>
              6 evidence inputs captured; 3 evidence inputs operator or third-party verified; 1 operator review completed; 1 field suppressed for safety; delivery sent; outcome recorded; 1 provenance gap remains.
            </p>
          </section>

          {/* ── PROVENANCE HASH ─────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
                Provenance hash
              </p>
            </div>
            <p style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.65)", wordBreak: "break-all" }}>
              {SAMPLE_HASH}
            </p>
            <p style={{ marginTop: "0.4rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)" }}>
              SHA-256 of the canonical internal record. The client-safe summary carries the same hash.
            </p>
          </section>

          {/* ── POSTURE GRID ────────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Posture
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Delivery</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(110,231,183,0.80)", marginTop: "0.2rem" }}>Delivered</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Outcome</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(110,231,183,0.80)", marginTop: "0.2rem" }}>Recorded</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Gaps</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(251,191,36,0.80)", marginTop: "0.2rem" }}>1 warning</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Anchor</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)", marginTop: "0.2rem" }}>Hash verified</p>
              </div>
            </div>
          </section>

          {/* ── CONFIDENCE BANDS ────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Evidence confidence
            </p>
            <div className="flex flex-wrap gap-3">
              {SAMPLE_CONFIDENCE_BANDS.map((band) => (
                <div key={band.level} style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", padding: "0.5rem 0.75rem", minWidth: "140px" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}88` }}>
                    {band.label}
                  </p>
                  <p style={{ ...mono, fontSize: "16px", color: "rgba(255,255,255,0.80)", marginTop: "0.2rem" }}>
                    {band.count}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "0.5rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)" }}>
              Confidence tiers are never upgraded. System-inferred remains system-inferred. Operator-verified means a human confirmed the finding.
            </p>
          </section>

          {/* ── TIMELINE ────────────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88` }}>
                Milestone timeline
              </p>
            </div>
            <div className="space-y-3">
              {SAMPLE_TIMELINE.map((entry, i) => (
                <div key={entry.milestone} className="flex items-start gap-4">
                  <div style={{ textAlign: "center", minWidth: "20px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: i < SAMPLE_TIMELINE.length - 1 ? `${GOLD}60` : "rgba(110,231,183,0.60)", margin: "0 auto" }} />
                    {i < SAMPLE_TIMELINE.length - 1 && (
                      <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(255,255,255,0.10)", margin: "2px auto" }} />
                    )}
                  </div>
                  <div>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                      {entry.date}
                    </p>
                    <p style={{ ...serif, fontSize: "0.9rem", color: "rgba(255,255,255,0.72)", marginTop: "0.1rem" }}>
                      {entry.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── GAP CLASSES ─────────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Gap classes
            </p>
            {SAMPLE_GAP_CLASSES.length === 0 ? (
              <p style={{ ...serif, fontSize: "0.9rem", color: "rgba(110,231,183,0.70)" }}>
                <CheckCircle2 className="inline h-4 w-4 mr-1" />
                No gaps detected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {SAMPLE_GAP_CLASSES.map((cls) => {
                  const color = cls === "CRITICAL" ? "rgba(239,68,68,0.80)" : cls === "WARNING" ? "rgba(251,191,36,0.80)" : "rgba(255,255,255,0.50)";
                  const bg = cls === "CRITICAL" ? "rgba(239,68,68,0.08)" : cls === "WARNING" ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)";
                  return (
                    <div key={cls} style={{ border: `1px solid ${color}30`, backgroundColor: bg, padding: "0.4rem 0.7rem" }}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" style={{ color }} />
                        <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color }}>
                          {cls}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ marginTop: "0.5rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)" }}>
              Gap severity classes are exposed without internal stage names or remediation details.
            </p>
          </section>

          {/* ── ANCHOR STATUS ───────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.75rem" }}>
              Anchor status
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Hash</p>
                <p style={{ ...mono, fontSize: "11px", color: `${GOLD}AA`, marginTop: "0.2rem" }}>Verified</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>Chain</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.50)", marginTop: "0.2rem" }}>Not yet included</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>External anchor</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.30)", marginTop: "0.2rem" }}>Not configured</p>
              </div>
              <div>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>WORM storage</p>
                <p style={{ ...mono, fontSize: "11px", color: "rgba(255,255,255,0.30)", marginTop: "0.2rem" }}>Not configured</p>
              </div>
            </div>
          </section>

          {/* ── RELATED SURFACES ────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>
              Related surfaces
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/provenance/anchor-log" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                View public anchor log status
              </Link>
              <Link href="/tools/decision-delay-exposure" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                Estimate decision delay exposure
              </Link>
              <Link href="/diagnostics/fast" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}>
                Run the Fast Diagnostic
              </Link>
            </div>
          </section>

          {/* ── CHAIN BOUNDARY NOTE ─────────────────────────────────── */}
          <section style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}03`, padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
              Chain boundary
            </p>
            <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.60)" }}>
              This provenance record is hash-verified against the internal Decision Provenance Record. The hash is stored in the oversight cycle archive and can be independently verified by the platform operator upon request. External WORM storage or public blockchain anchoring is not yet configured. Until then, the hash provides tamper evidence rather than tamper prevention — any change to the record produces a different hash, enabling detection.
            </p>
          </section>

          {/* ── FOOTER ──────────────────────────────────────────────── */}
          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" style={{ color: `${GOLD}60` }} />
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                Client-safe provenance summary
              </p>
            </div>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
              This is a client-safe provenance summary. It does not expose internal review notes, suppression details, or raw governance events. Sample data for demonstration purposes. Not connected to your account, case, or governed record.
            </p>
            <p style={{ marginTop: "0.3rem", ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.14)" }}>
              External anchoring is not yet configured.
            </p>
          </footer>

        </div>
      </main>
    </Layout>
  );
};

export default SampleExportPage;
