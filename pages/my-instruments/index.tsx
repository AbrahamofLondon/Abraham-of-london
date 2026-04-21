import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serifStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN INSTRUMENTS (for display metadata)
// ─────────────────────────────────────────────────────────────────────────────

const INSTRUMENT_META: Record<string, { title: string; category: string; href: string }> = {
  "decision-exposure-instrument": {
    title: "Decision Exposure Instrument",
    category: "Worksheet",
    href: "/decision-instruments/decision-exposure-instrument",
  },
  "mandate-clarity-framework": {
    title: "Mandate Clarity Framework",
    category: "Framework",
    href: "/decision-instruments/mandate-clarity-framework",
  },
  "intervention-path-selector": {
    title: "Intervention Path Selector",
    category: "Toolkit",
    href: "/decision-instruments/intervention-path-selector",
  },
  // GMI and other paid assets
  "global-market-intelligence-report-q1-2026": {
    title: "Global Market Intelligence Report Q1 2026",
    category: "Report",
    href: "/artifacts/global-market-intelligence-report-q1-2026",
  },
  "assessment.executive_reporting": {
    title: "Executive Reporting",
    category: "Flagship",
    href: "/diagnostics/executive-reporting/run",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type EntitlementEntry = {
  slug: string;
  source: string;
  grantedAt: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MyInstrumentsPage() {
  const [entitlements, setEntitlements] = React.useState<EntitlementEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/entitlements")
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated ?? false);
        setEntitlements(data.entitlements ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout
      title="Your Instruments | Abraham of London"
      description="Access your purchased decision instruments and assets."
      canonicalUrl="/my-instruments"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: VOID }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-12">
          <div className="py-14 lg:py-20">

            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
              <span style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                Your instruments
              </span>
            </div>

            <h1 style={{
              ...serifStyle,
              marginTop: "1rem",
              fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
              lineHeight: 1.0,
              color: "rgba(255,255,255,0.92)",
              fontStyle: "italic",
            }}>
              Return to your instruments.
            </h1>

            <p style={{
              ...serifStyle,
              marginTop: "0.8rem",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.42)",
              maxWidth: "52ch",
            }}>
              Purchased instruments are tied to your account. Access them from any device.
            </p>

            {/* Loading */}
            {loading && (
              <div className="mt-8" style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Resolving entitlements...
              </div>
            )}

            {/* Not authenticated */}
            {!loading && !authenticated && (
              <div className="mt-8" style={{
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.02)",
                padding: "1.25rem",
                maxWidth: "48rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Lock style={{ width: 12, height: 12, color: "rgba(255,255,255,0.35)" }} />
                  <span style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                    Sign in to view your instruments
                  </span>
                </div>
                <p style={{ ...serifStyle, marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)" }}>
                  Your purchased instruments are linked to your email. Sign in to access them.
                </p>
              </div>
            )}

            {/* Authenticated but no entitlements */}
            {!loading && authenticated && entitlements.length === 0 && (
              <div className="mt-8" style={{
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.02)",
                padding: "1.25rem",
                maxWidth: "48rem",
              }}>
                <div style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  No instruments acquired yet
                </div>
                <p style={{ ...serifStyle, marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)" }}>
                  Decision instruments become available here after purchase.
                </p>
                <Link
                  href="/decision-instruments"
                  className="mt-4 inline-flex items-center gap-2 transition-all duration-200"
                  style={{
                    padding: "9px 16px",
                    border: `1px solid ${AMBER}30`,
                    color: AMBER,
                    ...monoStyle,
                    fontSize: "7.5px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                  }}
                >
                  View instruments
                  <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
              </div>
            )}

            {/* Entitlements list */}
            {!loading && entitlements.length > 0 && (
              <div className="mt-8 space-y-3" style={{ maxWidth: "48rem" }}>
                {entitlements.map((e) => {
                  const meta = INSTRUMENT_META[e.slug];
                  const title = meta?.title ?? e.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const category = meta?.category ?? "Asset";
                  const href = meta?.href ?? `/decision-instruments/${e.slug}`;

                  return (
                    <Link
                      key={e.slug}
                      href={href}
                      className="block transition-all duration-200 hover:-translate-y-px"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        padding: "1rem 1.25rem",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{ ...monoStyle, fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}80` }}>
                            {category}
                          </div>
                          <div style={{ ...serifStyle, marginTop: "0.3rem", fontSize: "1.05rem", lineHeight: 1.2, color: "rgba(255,255,255,0.85)" }}>
                            {title}
                          </div>
                          <div style={{ ...monoStyle, marginTop: "0.3rem", fontSize: "6px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.25)" }}>
                            Acquired {new Date(e.grantedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {e.source === "purchase" ? " \u00b7 purchased" : ""}
                          </div>
                        </div>
                        <div style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: AMBER, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          Open
                          <ArrowRight style={{ width: 10, height: 10 }} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Back link */}
            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-all hover:underline"
                style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
