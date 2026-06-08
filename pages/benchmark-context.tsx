/**
 * pages/benchmark-context.tsx
 *
 * Benchmark Context — estate-wide capability explanation page.
 *
 * Route: /benchmark-context
 * Access: free_public (explanation; advanced tier requires Professional)
 *
 * Covers:
 *   - What Benchmark Context is
 *   - Anonymized internal cohort architecture
 *   - Comparison dimensions (basic free / advanced professional)
 *   - Minimum cohort threshold (n = 50)
 *   - What users receive at each tier
 *   - Access boundary: Professional / GMI / Retainer
 *   - Below-threshold behaviour
 */

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";
import { BENCHMARK_CAPABILITY, BENCHMARK_DIMENSIONS } from "@/lib/benchmarks/benchmark-context-authority";
import { CATALOG } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const TIER_COLORS = {
  free:         { color: "rgba(110,231,183,0.85)", bg: "rgba(110,231,183,0.06)", border: "rgba(110,231,183,0.18)" },
  professional: { color: `${GOLD}DD`,             bg: `${GOLD}08`,             border: `${GOLD}28` },
  retainer:     { color: "rgba(147,197,253,0.85)", bg: "rgba(147,197,253,0.06)", border: "rgba(147,197,253,0.18)" },
  gmi:          { color: "rgba(216,180,254,0.85)", bg: "rgba(216,180,254,0.06)", border: "rgba(216,180,254,0.18)" },
  internal:     { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.08)" },
};

const BenchmarkContextPage: NextPage = () => {
  const freeDims    = BENCHMARK_CAPABILITY.freeDimensions.map((d) => BENCHMARK_DIMENSIONS[d]);
  const profDims    = BENCHMARK_CAPABILITY.professionalDimensions.map((d) => BENCHMARK_DIMENSIONS[d]);
  const retainerDims = BENCHMARK_CAPABILITY.retainerDimensions.map((d) => BENCHMARK_DIMENSIONS[d]);
  const gmiDims     = BENCHMARK_CAPABILITY.gmiDimensions.map((d) => BENCHMARK_DIMENSIONS[d]);

  const professionalPrice = CATALOG.professional?.displayPrice ?? "£59/month";

  return (
    <Layout
      title="Benchmark Context | Abraham of London"
      description="What Benchmark Context is, how it works, what it compares, and what access tier it requires."
      canonicalUrl="/benchmark-context"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ backgroundColor: "rgb(3,3,5)", color: "white", minHeight: "100vh", padding: "96px 24px 80px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>

          {/* Header */}
          <header style={{ borderLeft: `2px solid ${GOLD}55`, paddingLeft: "20px", marginBottom: "48px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB`, marginBottom: "12px" }}>
              Estate-wide capability
            </p>
            <h1 style={{ ...serif, fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)", marginBottom: "16px" }}>
              Benchmark Context
            </h1>
            <p style={{ ...mono, fontSize: "10px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)", maxWidth: "600px" }}>
              Benchmark Context compares a governed case, decision position, or outcome record
              against anonymized data from opted-in cases in the same cohort.
              It does not predict. It contextualises.
            </p>
          </header>

          {/* What it is */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "24px", marginBottom: "2px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "12px" }}>
              What it is
            </p>
            <p style={{ ...mono, fontSize: "10px", lineHeight: 1.8, color: "rgba(255,255,255,0.60)" }}>
              Benchmark Context is an estate-wide capability, not a product.
              It is available wherever a governed case exists and opted-in data is sufficient.
              Basic comparison (aggregate outcome rates) is free.
              Advanced comparison (multi-dimensional, role, industry, organisation) requires Professional.
            </p>
          </section>

          {/* Anonymized cohort architecture */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "24px", marginBottom: "2px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "12px" }}>
              Anonymized cohort architecture
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "No individual case, user, or organisation is identifiable in benchmark output.",
                "Only opted-in cases contribute. No case contributes without explicit consent.",
                "Cohort data is aggregated at the pool level — never case-by-case.",
                `Benchmark output is suppressed below n = ${BENCHMARK_CAPABILITY.minimumPoolSize}. The system shows "Building" rather than publishing insufficient data.`,
                "Sample size is always disclosed when benchmark output is shown.",
                "Outcomes are self-reported at the time of contribution. The system does not independently verify.",
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ ...mono, fontSize: "8px", color: `${GOLD}66`, flexShrink: 0, paddingTop: "2px" }}>—</span>
                  <span style={{ ...mono, fontSize: "9px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Threshold */}
          <section style={{ border: `1px solid ${GOLD}20`, background: `${GOLD}05`, padding: "20px 24px", marginBottom: "32px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "4px" }}>
                  Minimum cohort
                </p>
                <p style={{ ...mono, fontSize: "24px", color: `${GOLD}EE` }}>
                  n = {BENCHMARK_CAPABILITY.minimumPoolSize}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ ...mono, fontSize: "9px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
                  Benchmark output requires at least {BENCHMARK_CAPABILITY.minimumPoolSize} opted-in governed cases
                  in the relevant cohort. Below this threshold the system shows "Building cohort" rather than
                  publishing data. No benchmark claim is made below this threshold.
                </p>
              </div>
            </div>
          </section>

          {/* Dimensions */}
          <section style={{ marginBottom: "48px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "20px" }}>
              Comparison dimensions
            </p>

            {/* Free tier */}
            <div style={{ marginBottom: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${TIER_COLORS.free.border}`, background: TIER_COLORS.free.bg, color: TIER_COLORS.free.color }}>
                  Free
                </span>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>Available to all users</span>
              </div>
              {freeDims.map((dim) => (
                <div key={dim.dimension} style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "14px 18px", marginBottom: "1px" }}>
                  <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.72)", marginBottom: "4px" }}>{dim.label}</p>
                  <p style={{ ...mono, fontSize: "8px", lineHeight: 1.7, color: "rgba(255,255,255,0.42)" }}>{dim.compares}</p>
                </div>
              ))}
            </div>

            {/* Professional tier */}
            <div style={{ marginBottom: "2px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${TIER_COLORS.professional.border}`, background: TIER_COLORS.professional.bg, color: TIER_COLORS.professional.color }}>
                  Professional
                </span>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>{professionalPrice}</span>
              </div>
              {profDims.map((dim) => (
                <div key={dim.dimension} style={{ border: `1px solid ${GOLD}12`, background: `${GOLD}03`, padding: "14px 18px", marginBottom: "1px" }}>
                  <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.65)", marginBottom: "4px" }}>{dim.label}</p>
                  <p style={{ ...mono, fontSize: "8px", lineHeight: 1.7, color: "rgba(255,255,255,0.40)" }}>{dim.compares}</p>
                </div>
              ))}
            </div>

            {/* Retainer tier */}
            <div style={{ marginBottom: "2px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${TIER_COLORS.retainer.border}`, background: TIER_COLORS.retainer.bg, color: TIER_COLORS.retainer.color }}>
                  Retainer
                </span>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>By engagement</span>
              </div>
              {retainerDims.map((dim) => (
                <div key={dim.dimension} style={{ border: "1px solid rgba(147,197,253,0.08)", background: "rgba(147,197,253,0.02)", padding: "14px 18px", marginBottom: "1px" }}>
                  <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.60)", marginBottom: "4px" }}>{dim.label}</p>
                  <p style={{ ...mono, fontSize: "8px", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>{dim.compares}</p>
                </div>
              ))}
            </div>

            {/* GMI tier */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", border: `1px solid ${TIER_COLORS.gmi.border}`, background: TIER_COLORS.gmi.bg, color: TIER_COLORS.gmi.color }}>
                  GMI Report
                </span>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.35)" }}>Requires GMI access</span>
              </div>
              {gmiDims.map((dim) => (
                <div key={dim.dimension} style={{ border: "1px solid rgba(216,180,254,0.08)", background: "rgba(216,180,254,0.02)", padding: "14px 18px", marginBottom: "1px" }}>
                  <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.60)", marginBottom: "4px" }}>{dim.label}</p>
                  <p style={{ ...mono, fontSize: "8px", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>{dim.compares}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What happens when below threshold */}
          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "24px", marginBottom: "2px" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "12px" }}>
              When the cohort is building
            </p>
            <p style={{ ...mono, fontSize: "9px", lineHeight: 1.8, color: "rgba(255,255,255,0.50)" }}>
              When the opted-in pool for a dimension is below n = {BENCHMARK_CAPABILITY.minimumPoolSize},
              the system shows a "Building cohort" indicator rather than empty or misleading data.
              No comparison claim is made. No rate or percentile is shown.
              The indicator explains that context will appear when the pool reaches threshold.
            </p>
            <p style={{ ...mono, fontSize: "9px", lineHeight: 1.8, color: "rgba(255,255,255,0.38)", marginTop: "10px" }}>
              Once the threshold is met, benchmark output appears automatically in Decision Centre
              for users with sufficient access tier.
            </p>
          </section>

          {/* Disclaimer */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", marginBottom: "40px" }}>
            <p style={{ ...mono, fontSize: "7.5px", lineHeight: 1.8, color: "rgba(255,255,255,0.28)" }}>
              {BENCHMARK_CAPABILITY.disclaimer}
            </p>
          </section>

          {/* Access CTAs */}
          <section style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/professionals"
              style={{
                ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                padding: "12px 20px", border: `1px solid ${GOLD}45`, background: `${GOLD}10`,
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
              }}
            >
              Unlock advanced benchmarks →
            </Link>
            <Link
              href="/decision-centre"
              style={{
                ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                padding: "12px 20px", border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.45)", textDecoration: "none",
              }}
            >
              Open Decision Centre
            </Link>
            <Link
              href="/diagnostics/fast"
              style={{
                ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                padding: "12px 20px", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.35)", textDecoration: "none",
              }}
            >
              Create a governed case
            </Link>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default BenchmarkContextPage;
