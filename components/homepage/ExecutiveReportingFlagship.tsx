"use client";

/* components/homepage/ExecutiveReportingFlagship.tsx
   Design: Institutional Monumentalism — sharp panels, softGold, correct token system

   This component may be superseded by FlagshipAdvisory in pages/index.tsx.
   Preserved here with full design-system alignment in case it is rendered
   via a different entry point (consulting page, etc.).

   Previous version had:
   - rounded-2xl / rounded-full on every card and button
   - bg-amber-500 filled primary CTA (amber-500 is action-only, not backgrounds)
   - bg-[#070707] wrong token (should be rgb(6 6 9) BASE or rgb(3 3 5) VOID)
   - RailLabel using amber-400/62 instead of softGold token
   - Surface component with implicit rounded corners
   - "Serious enough to matter. Structured enough to stand alone." — positioning
     copy that tells rather than shows
   - CORE_PROOFS as CheckCircle2 bullet list — feature listing format

   Rebuilt: Sharp panels throughout. Report output fields demonstrate the product.
   Copy states facts, not qualities.
*/

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Building2,
  Crown,
  Scale,
  Eye,
  Landmark,
  Calendar,
  Clock,
  Download,
  TrendingUp,
  Lock,
  ScanSearch,
} from "lucide-react";

const GOLD  = "#C9A96E";
const BASE  = "rgb(6 6 9)";
const VOID  = "rgb(3 3 5)";
const LIFT  = "rgb(10 14 20)";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ width: "1px", height: "20px", backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px", letterSpacing: "0.40em", textTransform: "uppercase",
        color: `${GOLD}BF`,
      }}>
        {children}
      </span>
    </div>
  );
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
    } />
  );
}

type BuyerFitItem = {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  body: string;
};

const BUYER_FIT: BuyerFitItem[] = [
  {
    icon: Building2,
    title: "Founders and leadership teams",
    body: "For situations where execution continues, but trust, clarity, and decision quality are beginning to erode.",
  },
  {
    icon: ShieldCheck,
    title: "Boards and senior operators",
    body: "For environments that need disciplined interpretation before escalation, correction, or mandate work.",
  },
  {
    icon: Landmark,
    title: "Institutions under exposure",
    body: "For cases where the cost of misreading the situation is already operational, reputational, or political.",
  },
];

// The actual 12 fields the report produces
const REPORT_FIELDS = [
  { label: "Headline",                 value: "One sentence, specific to this institution's condition" },
  { label: "Constitutional route",     value: "STRATEGY / DIAGNOSTIC / REJECT with confidence score" },
  { label: "Seriousness level",        value: "LOW / MODERATE / HIGH / CRITICAL with rationale" },
  { label: "Governance risk",          value: "Named failure mode, not a category" },
  { label: "Top 3 pressure points",    value: "Named, ranked, consequence if unaddressed" },
  { label: "Domain breakdown",         value: "Score and reading per assessed domain" },
  { label: "Decision options",         value: "2–3 options with trade-off map" },
  { label: "Correction priorities",    value: "Ordered by urgency and structural impact" },
  { label: "Escalation recommendation", value: "Specific route with structural justification" },
  { label: "7 / 30 / 90 sequence",    value: "Specific actions, not guidance" },
];

type QuarterlyReport = {
  id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  quarter: string;
  year: number;
  readingTime: number;
  pdfUrl?: string | null;
  keyFindings?: string[];
};

interface ExecutiveReportingFlagshipProps {
  latestReport?: QuarterlyReport | null;
  compact?: boolean;
}

export default function ExecutiveReportingFlagship({
  latestReport,
  compact = false,
}: ExecutiveReportingFlagshipProps) {
  const reduceMotion = useReducedMotion();

  const quarterDisplay = latestReport
    ? `${String(latestReport.quarter).toUpperCase()} ${latestReport.year}`
    : null;

  // Compact variant — used when embedded in a section that already has context
  if (compact) {
    return (
      <section style={{ backgroundColor: VOID, padding: "5rem 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <Eyebrow>Executive Reporting</Eyebrow>

              <div
                style={{
                  marginTop: "1.5rem",
                  display: "inline-flex", alignItems: "center", gap: "0.75rem",
                  border: `1px solid ${GOLD}20`,
                  backgroundColor: `${GOLD}08`,
                  padding: "8px 16px",
                }}
              >
                <Crown style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                  color: `${GOLD}BB`,
                }}>
                  Flagship interpretation layer
                </span>
              </div>

              <h2 style={{
                marginTop: "1.75rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 0.96, letterSpacing: "-0.028em",
                color: "rgba(255,255,255,0.92)",
              }}>
                From diagnostic reading
                <span style={{ display: "block", color: "rgba(255,255,255,0.35)" }}>
                  to decision-grade output.
                </span>
              </h2>

              <p style={{
                marginTop: "1.25rem", maxWidth: "46ch",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.08rem", lineHeight: 1.72,
                color: "rgba(255,255,255,0.48)",
              }}>
                The governed layer between raw diagnostic reading and private mandate work.
                A 22-field intake produces a 12-field board-grade report.
              </p>

              <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/diagnostics/executive-reporting"
                  className="group inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "13px 24px",
                    border: `1px solid ${GOLD}42`,
                    backgroundColor: `${GOLD}0E`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                >
                  Open Executive Reporting
                  <ArrowRight style={{ width: "12px", height: "12px" }} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "13px 24px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.42)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.70)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.42)"; }}
                >
                  <ScanSearch style={{ width: "12px", height: "12px" }} />
                  Begin diagnostics
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              <div style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: LIFT,
                height: "100%",
                padding: "2rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)", marginBottom: "1.5rem",
                }}>
                  Report output fields
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {REPORT_FIELDS.slice(0, 6).map((field, i) => (
                    <div key={i} style={{ padding: "0.65rem 0", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)", flexShrink: 0, minWidth: "90px",
                        marginTop: "1px",
                      }}>
                        {field.label}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55,
                        color: "rgba(255,255,255,0.45)", fontStyle: "italic",
                      }}>
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Full variant
  return (
    <section style={{ backgroundColor: BASE, padding: "6rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">

          {/* Left — positioning + product fields */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <Eyebrow>Executive Reporting</Eyebrow>

            <div
              style={{
                marginTop: "1.5rem", display: "inline-flex",
                alignItems: "center", gap: "0.75rem",
                border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}08`,
                padding: "8px 16px",
              }}
            >
              <Crown style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}>
                Flagship bridge product
              </span>
            </div>

            <h2 style={{
              marginTop: "2rem", maxWidth: "14ch",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
              lineHeight: 0.95, letterSpacing: "-0.030em",
              color: "rgba(255,255,255,0.93)",
            }}>
              The disciplined bridge between signal and intervention.
            </h2>

            <p style={{
              marginTop: "1.5rem", maxWidth: "46ch",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "1.08rem", lineHeight: 1.72,
              color: "rgba(255,255,255,0.46)",
            }}>
              A 22-field structured intake. Returns a 12-field board-grade report.
              Built for founders, boards, and leadership teams who need disciplined
              interpretation before escalation.
            </p>

            {/* Report output fields — show what it produces */}
            <div style={{
              marginTop: "2.5rem",
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: LIFT,
            }}>
              <div style={{
                padding: "0.85rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}>
                  Report output — all 10 fields
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {REPORT_FIELDS.map((field, i) => (
                  <div key={i} style={{ padding: "0.70rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)", flexShrink: 0, minWidth: "110px",
                      marginTop: "1px",
                    }}>
                      {field.label}
                    </span>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.55,
                      color: "rgba(255,255,255,0.45)", fontStyle: "italic",
                    }}>
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System position note */}
            <div style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              border: "1px solid rgba(255,255,255,0.055)",
              backgroundColor: "rgba(255,255,255,0.015)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)", marginBottom: "0.5rem",
              }}>
                Position in the system
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.68,
                color: "rgba(255,255,255,0.50)",
              }}>
                Diagnostics surfaces the signal. Executive Reporting interprets it precisely.
                Strategy Room intervenes when the report reveals material consequence and
                warrants governed advisory attention.
              </p>
            </div>

            {/* Metric strip */}
            <div className="grid grid-cols-3 divide-x" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)", margin: "1.5rem 0" }}>
              {[
                { label: "Role",   value: "Interpret" },
                { label: "Output", value: "Report PDF" },
                { label: "Bias",   value: "Decision fit" },
              ].map((m, i) => (
                <div key={i} style={{ padding: "1rem 1.25rem", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px", letterSpacing: "0.30em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)", marginBottom: "0.4rem",
                  }}>
                    {m.label}
                  </div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "1.15rem",
                    color: "rgba(255,255,255,0.75)",
                  }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center gap-2.5 transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  border: `1px solid ${GOLD}44`,
                  backgroundColor: `${GOLD}10`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}18`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}10`; }}
              >
                Open Executive Reporting
                <ArrowRight style={{ width: "13px", height: "13px" }} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/diagnostics"
                className="inline-flex items-center gap-2.5 transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.40)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.68)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.40)"; }}
              >
                <ScanSearch style={{ width: "13px", height: "13px" }} />
                Begin diagnostics
              </Link>
            </div>
          </motion.div>

          {/* Right — buyer fit + latest report */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <div style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: LIFT,
              padding: "2rem",
              height: "100%",
            }}>
              {/* Buyer fit */}
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)", marginBottom: "1.5rem",
              }}>
                Buyer fit
              </div>

              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.055)", marginBottom: "2rem" }}>
                {BUYER_FIT.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} style={{ padding: "1.25rem 0", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <Icon style={{ width: "16px", height: "16px", color: `${GOLD}90`, marginTop: "3px", flexShrink: 0 }} />
                      <div>
                        <div style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.20,
                          color: "rgba(255,255,255,0.80)", marginBottom: "0.35rem",
                        }}>
                          {item.title}
                        </div>
                        <p style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65,
                          color: "rgba(255,255,255,0.40)",
                        }}>
                          {item.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Latest report — if available */}
              {latestReport ? (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    marginBottom: "1rem",
                  }}>
                    <TrendingUp style={{ width: "13px", height: "13px", color: `${GOLD}90` }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      Latest release · {quarterDisplay}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "1.15rem", lineHeight: 1.15,
                    color: "rgba(255,255,255,0.80)", marginBottom: "0.5rem",
                  }}>
                    {latestReport.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65,
                    color: "rgba(255,255,255,0.38)", marginBottom: "1rem",
                  }}>
                    {latestReport.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                    <Link
                      href={`/artifacts/${latestReport.slug}`}
                      className="inline-flex items-center gap-1.5 transition-all duration-300"
                      style={{
                        padding: "8px 16px",
                        border: `1px solid ${GOLD}32`,
                        backgroundColor: `${GOLD}0A`,
                        color: `${GOLD}CC`,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}50`; el.style.backgroundColor = `${GOLD}12`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}32`; el.style.backgroundColor = `${GOLD}0A`; }}
                    >
                      <Eye style={{ width: "11px", height: "11px" }} />
                      Open report
                    </Link>
                    {latestReport.pdfUrl && (
                      <a
                        href={latestReport.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 transition-all duration-300"
                        style={{
                          padding: "8px 16px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: "rgba(255,255,255,0.015)",
                          color: "rgba(255,255,255,0.42)",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase",
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.68)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.42)"; }}
                      >
                        <Download style={{ width: "11px", height: "11px" }} />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem",
                  border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06`,
                  padding: "1.25rem",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <Lock style={{ width: "14px", height: "14px", color: `${GOLD}AA`, flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
                        color: `${GOLD}90`, marginBottom: "0.5rem",
                      }}>
                        Commercial position
                      </div>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65,
                        color: "rgba(255,255,255,0.52)",
                      }}>
                        Premium enough to matter. Restrained enough to build trust before escalation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}