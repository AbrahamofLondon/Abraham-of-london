/**
 * pages/pricing.tsx
 *
 * Public pricing page — /pricing
 *
 * Organised into three access tiers:
 * 1. Free entry instruments and governed tools
 * 2. Paid one-time access (reporting, execution, decision instruments)
 * 3. Retained and contracted engagements
 *
 * Rules:
 * - All prices derived from CATALOG — no hardcoded amounts
 * - Only active products shown in self-serve tiers
 * - Retainer/contracted tier shown as enquiry-only, no prices
 * - Mandatory disclaimer: access fees, not financial advice
 * - No fake certifications, no fabricated scarcity
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { CATALOG, type CatalogProduct } from "@/lib/commercial/catalog";
import { FEATURES, paidFeatures, retainerFeatures } from "@/lib/product/feature-entitlements";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};
const BG = "#0A0A0A";

// ─── Data helpers ─────────────────────────────────────────────────────────────

/** Free entry tools shown on pricing page */
const FREE_ENTRY_PRODUCTS: CatalogProduct[] = [
  CATALOG.fast_diagnostic,
].filter((p): p is CatalogProduct => Boolean(p));

/** Active paid one-time products (excluding bundles marked inactive) */
const ONE_TIME_PRODUCTS: CatalogProduct[] = [
  CATALOG.personal_decision_audit,
  CATALOG.executive_reporting,
  CATALOG.strategy_room,
  CATALOG.strategy_room_extended,
  CATALOG.decision_exposure_instrument,
  CATALOG.mandate_clarity_framework,
  CATALOG.intervention_path_selector,
  CATALOG.execution_risk_index,
  CATALOG.escalation_readiness_scorecard,
  CATALOG.structural_failure_diagnostic_canvas,
  CATALOG.team_alignment_gap_map,
  CATALOG.governance_drift_detector,
  CATALOG.strategic_priority_stack_builder,
  CATALOG.board_brief_builder,
].filter((p): p is CatalogProduct => Boolean(p?.active));

/** Active governed playbooks */
const PLAYBOOK_PRODUCTS: CatalogProduct[] = [
  CATALOG.execution_integrity_protocol,
  CATALOG.alignment_audit_playbook,
  CATALOG.drift_detection_framework,
].filter((p): p is CatalogProduct => Boolean(p?.active));

/** Retainer products — enquiry only */
const RETAINER_PRODUCTS: CatalogProduct[] = [
  CATALOG.retainer_core,
  CATALOG.retainer_operational,
  CATALOG.retainer_institutional,
].filter((p): p is CatalogProduct => Boolean(p));

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}20 30%, ${GOLD}20 70%, transparent 100%)`,
        margin: "48px 0",
      }}
    />
  );
}

function PricePill({ displayPrice }: { displayPrice: string }) {
  return (
    <span
      style={{
        ...mono,
        fontSize: "11px",
        letterSpacing: "0.10em",
        color: GOLD,
        background: `${GOLD}10`,
        border: `1px solid ${GOLD}30`,
        padding: "4px 10px",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      {displayPrice}
    </span>
  );
}

function FreePill() {
  return (
    <span
      style={{
        ...mono,
        fontSize: "11px",
        letterSpacing: "0.10em",
        color: "rgba(255,255,255,0.40)",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        padding: "4px 10px",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      Free
    </span>
  );
}

function ProductCard({ product, cta }: { product: CatalogProduct; cta?: React.ReactNode }) {
  const href = product.active && product.amount > 0
    ? product.cancelPath   // landing / product page
    : product.successPath;
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.015)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <p
          style={{
            ...serif,
            fontSize: "16px",
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {product.displayName}
        </p>
        {product.amount > 0
          ? <PricePill displayPrice={product.displayPrice} />
          : <FreePill />
        }
      </div>

      {/* Description */}
      {product.shortDescription && (
        <p
          style={{
            ...mono,
            fontSize: "9px",
            color: "rgba(255,255,255,0.38)",
            lineHeight: 1.65,
          }}
        >
          {product.shortDescription}
        </p>
      )}

      {/* Delivery metadata */}
      {product.estimatedCompletionMinutes && (
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.22)",
          }}
        >
          Est. {product.estimatedCompletionMinutes} min
          {product.dossierEligible ? " · PDF dossier eligible" : ""}
          {product.writesToDecisionMemory ? " · Writes to Decision Centre" : ""}
        </p>
      )}

      {/* CTA */}
      {cta ?? (
        product.active && (
          <Link
            href={href}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: `${GOLD}CC`,
              textDecoration: "none",
              marginTop: "4px",
              alignSelf: "flex-start",
              borderBottom: `1px solid ${GOLD}40`,
              paddingBottom: "1px",
            }}
          >
            {product.amount > 0 ? "View & access →" : "Start free →"}
          </Link>
        )
      )}
    </div>
  );
}

function RetainerCard({ product }: { product: CatalogProduct }) {
  const tierLabel: Record<string, string> = {
    CORE:          "Core",
    OPERATIONAL:   "Operational",
    INSTITUTIONAL: "Institutional",
  };
  const tier = tierLabel[product.tier] ?? product.tier;

  const tierDescription: Record<string, string> = {
    Core:          "Ongoing governed decision accountability for individual leaders and principals.",
    Operational:   "Retained oversight for operational teams and recurring decision programmes.",
    Institutional: "Institutional-grade governance retainer. Multi-seat, board-adjacent engagement.",
  };

  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        background: "rgba(201,169,110,0.025)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <p
          style={{
            ...serif,
            fontSize: "16px",
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {product.displayName}
        </p>
        <span
          style={{
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.30)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "4px 10px",
            flexShrink: 0,
          }}
        >
          By enquiry
        </span>
      </div>
      <p
        style={{
          ...mono,
          fontSize: "9px",
          color: "rgba(255,255,255,0.35)",
          lineHeight: 1.65,
        }}
      >
        {tierDescription[tier] ?? "Contracted monthly retainer engagement."}
      </p>
      <Link
        href="/oversight"
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: `${GOLD}99`,
          textDecoration: "none",
          marginTop: "4px",
          alignSelf: "flex-start",
          borderBottom: `1px solid ${GOLD}30`,
          paddingBottom: "1px",
        }}
      >
        Enquire →
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const paid = paidFeatures();
  const retainer = retainerFeatures();

  return (
    <>
      <Head>
        <title>Pricing — Abraham of London</title>
        <meta
          name="description"
          content="Access fees for governed decision instruments, executive reporting, strategy room sessions, and retained oversight engagements."
        />
      </Head>

      <div
        style={{
          background: BG,
          color: "rgba(255,255,255,0.85)",
          minHeight: "100vh",
          padding: "64px 24px 96px",
        }}
      >
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <header style={{ marginBottom: "56px" }}>
            <SectionLabel>Access structure</SectionLabel>
            <h1
              style={{
                ...serif,
                fontSize: "clamp(28px, 4vw, 44px)",
                color: "rgba(255,255,255,0.90)",
                lineHeight: 1.2,
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >
              Governed decision access
            </h1>
            <p
              style={{
                ...serif,
                fontSize: "16px",
                color: "rgba(255,255,255,0.50)",
                lineHeight: 1.75,
                maxWidth: "540px",
              }}
            >
              A structured access model across three tiers: free entry tools
              available without account, paid instruments and sessions that
              produce governed records, and retained oversight for ongoing
              decision accountability.
            </p>
          </header>

          {/* ── Mandatory disclaimer ─────────────────────────────────────── */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 18px",
              marginBottom: "48px",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.30)",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "rgba(255,255,255,0.45)", fontWeight: "normal" }}>Access note.</strong>{" "}
              All figures shown are access fees for governed decision instruments.
              They are not financial advice, investment recommendations, or regulated
              professional services. No outcome is guaranteed. Governed records produced
              by these instruments reflect the evidence submitted by the user and are
              not audited, certified, or independently verified.
            </p>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 1 — FREE ENTRY                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Tier 1 — Free entry</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              No account required
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              Anonymous, session-based. No signup. The governed finding is produced
              immediately. Create a free account to keep up to 3 active governed cases.
              Existing records remain readable even when cases later move out of active governance.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {FREE_ENTRY_PRODUCTS.map((p) => (
                <ProductCard key={p.code} product={p} />
              ))}
              {/* Decision Delay Exposure and Provenance demo are free tools */}
              <div
                style={{
                  border: "none",
                  background: "rgba(255,255,255,0.015)",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <p style={{ ...serif, fontSize: "16px", color: "rgba(255,255,255,0.82)", flex: 1 }}>
                    {FEATURES.decision_delay_exposure.displayName}
                  </p>
                  <FreePill />
                </div>
                <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65 }}>
                  {FEATURES.decision_delay_exposure.description}
                </p>
                <Link
                  href={FEATURES.decision_delay_exposure.upgradeHref}
                  style={{
                    ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                    color: `${GOLD}CC`, textDecoration: "none", marginTop: "4px", alignSelf: "flex-start",
                    borderBottom: `1px solid ${GOLD}40`, paddingBottom: "1px",
                  }}
                >
                  Run instrument →
                </Link>
              </div>
              <div
                style={{
                  border: "none",
                  background: "rgba(255,255,255,0.015)",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <p style={{ ...serif, fontSize: "16px", color: "rgba(255,255,255,0.82)", flex: 1 }}>
                    {FEATURES.provenance_demo.displayName}
                  </p>
                  <FreePill />
                </div>
                <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.38)", lineHeight: 1.65 }}>
                  {FEATURES.provenance_demo.description}
                </p>
                <Link
                  href={FEATURES.provenance_demo.upgradeHref}
                  style={{
                    ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                    color: `${GOLD}CC`, textDecoration: "none", marginTop: "4px", alignSelf: "flex-start",
                    borderBottom: `1px solid ${GOLD}40`, paddingBottom: "1px",
                  }}
                >
                  View demo →
                </Link>
              </div>
            </div>
          </section>

          <GoldDivider />

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 1B — PROFESSIONAL SUBSCRIPTION                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Tier 1B — Professional subscription</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              Unlimited governed case management
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              7-day trial available. Professional unlocks more active cases, Return Brief
              generation, client-safe evidence export, and organisation workspace.
              Existing records always remain readable.
            </p>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {/* Professional Monthly */}
              {CATALOG.professional && (
                <div
                  style={{
                    border: `1px solid ${GOLD}25`,
                    backgroundColor: `${GOLD}04`,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}99`, marginBottom: "8px" }}>
                    Professional
                  </p>
                  <p style={{ ...mono, fontSize: "22px", color: "rgba(255,255,255,0.90)", marginBottom: "4px" }}>
                    {CATALOG.professional.displayPrice}
                  </p>
                  <p style={{ ...mono, fontSize: "7.5px", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>
                    per month · cancel anytime
                  </p>
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)", marginBottom: "20px", flex: 1 }}>
                    {CATALOG.professional.shortDescription}
                  </p>
                  <Link
                    href={CATALOG.professional.successPath}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#0A0A0A",
                      backgroundColor: GOLD,
                      padding: "12px 20px",
                      textDecoration: "none",
                      display: "inline-block",
                      alignSelf: "flex-start",
                    }}
                  >
                    {CATALOG.professional.primaryCta}
                  </Link>
                </div>
              )}

              {/* Professional Annual */}
              {CATALOG.professional_annual && (
                <div
                  style={{
                    border: `1px solid ${GOLD}40`,
                    backgroundColor: `${GOLD}08`,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: "6.5px",
                      letterSpacing: "0.20em",
                      textTransform: "uppercase",
                      color: "#0A0A0A",
                      backgroundColor: GOLD,
                      padding: "3px 10px",
                      position: "absolute",
                      top: "-8px",
                      right: "16px",
                    }}
                  >
                    Best value
                  </span>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}99`, marginBottom: "8px" }}>
                    Professional Annual
                  </p>
                  <p style={{ ...mono, fontSize: "22px", color: "rgba(255,255,255,0.90)", marginBottom: "4px" }}>
                    {CATALOG.professional_annual.displayPrice}
                  </p>
                  <p style={{ ...mono, fontSize: "7.5px", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>
                    per year · two months free
                  </p>
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)", marginBottom: "20px", flex: 1 }}>
                    {CATALOG.professional_annual.shortDescription}
                  </p>
                  <Link
                    href={CATALOG.professional_annual.successPath}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#0A0A0A",
                      backgroundColor: GOLD,
                      padding: "12px 20px",
                      textDecoration: "none",
                      display: "inline-block",
                      alignSelf: "flex-start",
                    }}
                  >
                    {CATALOG.professional_annual.primaryCta}
                  </Link>
                </div>
              )}

              {/* Enterprise */}
              {CATALOG.enterprise && (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}99`, marginBottom: "8px" }}>
                    Enterprise
                  </p>
                  <p style={{ ...mono, fontSize: "22px", color: "rgba(255,255,255,0.90)", marginBottom: "4px" }}>
                    {CATALOG.enterprise.displayPrice}
                  </p>
                  <p style={{ ...mono, fontSize: "7.5px", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>
                    annual · custom pricing
                  </p>
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)", marginBottom: "20px", flex: 1 }}>
                    {CATALOG.enterprise.shortDescription}
                  </p>
                  <Link
                    href={CATALOG.enterprise.successPath}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: `${GOLD}CC`,
                      border: `1px solid ${GOLD}30`,
                      backgroundColor: "transparent",
                      padding: "12px 20px",
                      textDecoration: "none",
                      display: "inline-block",
                      alignSelf: "flex-start",
                    }}
                  >
                    {CATALOG.enterprise.primaryCta}
                  </Link>
                </div>
              )}
            </div>
          </section>

          <GoldDivider />

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 2A — PAID ONE-TIME: REPORTING & EXECUTION                */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Tier 2A — Reporting & execution</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              Governed sessions and reports
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              One-time access fees. Access is granted immediately upon payment.
              Each session produces a governed commitment record stored in your Decision Centre.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {[CATALOG.executive_reporting, CATALOG.strategy_room, CATALOG.strategy_room_extended]
                .filter((p): p is CatalogProduct => Boolean(p?.active))
                .map((p) => (
                  <ProductCard key={p.code} product={p} />
                ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 2B — DECISION INSTRUMENTS                                */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Tier 2B — Decision instruments</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              Structured decision instruments
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              Self-serve. Each instrument runs in-browser, writes to Decision Centre,
              and produces a governed PDF dossier on completion.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {ONE_TIME_PRODUCTS
                .filter((p) => !["executive_reporting", "strategy_room", "strategy_room_extended"].includes(p.code))
                .map((p) => (
                  <ProductCard key={p.code} product={p} />
                ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 2C — GOVERNED PLAYBOOKS                                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {PLAYBOOK_PRODUCTS.length > 0 && (
            <section style={{ marginBottom: "48px" }}>
              <SectionLabel>Tier 2C — Governed playbooks</SectionLabel>
              <h2
                style={{
                  ...serif,
                  fontSize: "22px",
                  color: "rgba(255,255,255,0.80)",
                  marginBottom: "6px",
                }}
              >
                Methodology-led frameworks
              </h2>
              <p
                style={{
                  ...mono,
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.32)",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                  maxWidth: "500px",
                }}
              >
                Facilitated decision frameworks. Each run produces a governed
                commitment record and writes conclusions to Decision Centre.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {PLAYBOOK_PRODUCTS.map((p) => (
                  <ProductCard key={p.code} product={p} />
                ))}
              </div>
            </section>
          )}

          <GoldDivider />

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TIER 3 — RETAINED OVERSIGHT                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Tier 3 — Retained oversight</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              Ongoing decision accountability
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "8px",
                maxWidth: "500px",
              }}
            >
              Monthly retainer engagements for organisations requiring sustained
              governed decision oversight. Contracted directly — not available
              via self-serve checkout. Enquire to discuss scope and access structure.
            </p>
            <p
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.22)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              Prices are not shown for contracted engagements. Fees are agreed
              based on scope, frequency, and organisational context.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1px",
                background: `${GOLD}10`,
              }}
            >
              {RETAINER_PRODUCTS.map((p) => (
                <RetainerCard key={p.code} product={p} />
              ))}
            </div>
          </section>

          <GoldDivider />

          {/* ── Feature coverage ─────────────────────────────────────────── */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Feature access map</SectionLabel>
            <h2
              style={{
                ...serif,
                fontSize: "22px",
                color: "rgba(255,255,255,0.80)",
                marginBottom: "6px",
              }}
            >
              What each tier unlocks
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.32)",
                lineHeight: 1.6,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              Platform features granted by access tier. OR logic applies — any
              qualifying entitlement grants access.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {paid.map((f) => (
                <div
                  key={f.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ ...serif, fontSize: "14px", color: "rgba(255,255,255,0.75)", marginBottom: "2px" }}>
                      {f.displayName}
                    </p>
                    <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.30)", lineHeight: 1.5 }}>
                      {f.description}
                    </p>
                  </div>
                  <Link
                    href={f.upgradeHref}
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: `${GOLD}BB`,
                      textDecoration: "none",
                      borderBottom: `1px solid ${GOLD}30`,
                      paddingBottom: "1px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Access →
                  </Link>
                </div>
              ))}
              {retainer.map((f) => (
                <div
                  key={f.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "rgba(201,169,110,0.02)",
                    border: `1px solid ${GOLD}12`,
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ ...serif, fontSize: "14px", color: "rgba(255,255,255,0.70)", marginBottom: "2px" }}>
                      {f.displayName}
                    </p>
                    <p style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>
                      {f.description}
                    </p>
                  </div>
                  <span
                    style={{
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.14em",
                      color: "rgba(255,255,255,0.22)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {f.accessLevel === "contracted" ? "By referral" : "By retainer"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer navigation ─────────────────────────────────────────── */}
          <nav
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "32px",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Decision Centre", href: "/decision-centre" },
              { label: "Strategy Room", href: "/strategy-room" },
              { label: "Decision Instruments", href: "/decision-instruments" },
              { label: "Oversight", href: "/oversight" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Closing disclaimer ──────────────────────────────────────── */}
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.10em",
              color: "rgba(255,255,255,0.18)",
              lineHeight: 1.8,
              marginTop: "32px",
              maxWidth: "600px",
            }}
          >
            Abraham of London provides governed decision instruments and structured advisory frameworks.
            Nothing on this platform constitutes legal, financial, investment, or regulated professional advice.
            Access fees are charged for methodology access and session facilitation, not for outcomes.
            Governed records are produced from user-submitted evidence and are not independently audited.
            Prices shown are in GBP and include VAT where applicable. Access is non-refundable once a
            session has been initiated.
          </p>
        </div>
      </div>
    </>
  );
}
