// pages/editorials/index.tsx
// Design: Institutional Monumentalism — matches platform design language throughout
// Typography: Cormorant Garamond display · JetBrains Mono labels
// Palette: #060609 base · #C9A96E softGold · sharp panels · zero rounded-full

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ScrollText,
  ArrowRight,
  BookOpen,
  Download,
  Eye,
  ChevronRight,
  FileText,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublicationCatalogue } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  items: PublicationRecord[];
  flagship: PublicationRecord | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = (d = 0.09) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/28 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px",
        letterSpacing: "0.40em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

/** Institutional panel — sharp 2px language, consistent with homepage */
function Panel({ children, className = "", gold = false }: {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: "rgb(5 5 7)",
        border: `1px solid ${gold ? `${GOLD}20` : "rgba(255,255,255,0.065)"}`,
        boxShadow: gold ? `0 0 80px -30px ${GOLD}18` : "0 28px 80px -40px rgba(0,0,0,0.90)",
      }}
    >
      {/* Top shimmer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{
        background: gold
          ? `linear-gradient(to right, transparent, ${GOLD}28, transparent)`
          : "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",
      }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse at top left, rgba(255,255,255,0.015), transparent 55%)",
      }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP PUBLICATION
// ─────────────────────────────────────────────────────────────────────────────

function FlagshipCard({ item }: { item: PublicationRecord }) {
  const previewHref = item.previewEnabled
    ? (item.previewPath || `/api/editorials/preview/${item.slug}`)
    : null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      <Panel gold>
        <div className="p-8 md:p-11 lg:p-13">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <Eyebrow>Flagship publication</Eyebrow>
            <div className="flex items-center gap-2.5">
              {item.category && (
                <span style={{
                  padding: "3px 12px",
                  border: `1px solid ${GOLD}28`,
                  backgroundColor: `${GOLD}09`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  color: `${GOLD}AA`,
                }}>
                  {item.category}
                </span>
              )}
              <span style={{
                padding: "3px 12px",
                border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
              }}>
                {item.tier}
              </span>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            {/* Left — title + CTA */}
            <div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2.0rem, 4vw, 3.4rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.030em",
                color: "rgba(255,255,255,0.94)",
              }}>
                {item.title}
              </h2>

              {item.subtitle && (
                <p style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.45)",
                  fontStyle: "italic",
                }}>
                  {item.subtitle}
                </p>
              )}

              {item.description && (
                <p style={{
                  marginTop: "0.85rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "48ch",
                }}>
                  {item.description}
                </p>
              )}

              {/* Meta strip */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                {[item.readingTime, item.date, item.author, item.contentId]
                  .filter(Boolean)
                  .map((val, i, arr) => (
                    <React.Fragment key={i}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.24)",
                      }}>
                        {val}
                      </span>
                      {i < arr.length - 1 && (
                        <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
                      )}
                    </React.Fragment>
                  ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={`/editorials/${item.slug}`}
                  className="group inline-flex items-center gap-2.5 transition-all duration-300"
                  style={{
                    padding: "12px 24px",
                    border: `1px solid ${GOLD}42`,
                    backgroundColor: `${GOLD}0E`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                >
                  Open publication
                  <ArrowRight style={{ width: "12px", height: "12px" }} />
                </Link>

                {item.pdfPath && (
                  <a
                    href={item.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "12px 24px",
                      border: "1px solid rgba(255,255,255,0.09)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      color: "rgba(255,255,255,0.50)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.75)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.50)"; }}
                  >
                    <Download style={{ width: "12px", height: "12px" }} />
                    PDF edition
                  </a>
                )}

                {previewHref && (
                  <a
                    href={previewHref}
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "12px 24px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.32)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.14)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.32)"; }}
                  >
                    <Eye style={{ width: "12px", height: "12px" }} />
                    Preview
                  </a>
                )}
              </div>
            </div>

            {/* Right — publication record */}
            <div style={{
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.012)",
              padding: "1.5rem",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.20)",
                marginBottom: "1.25rem",
              }}>
                Publication record
              </div>

              <div className="space-y-3">
                {[
                  { label: "Content ID", value: item.contentId },
                  { label: "Author",     value: item.author },
                  { label: "Tier",       value: item.tier },
                  { label: "Category",   value: item.category || "—" },
                  { label: "Version",    value: item.version || "—" },
                  { label: "Status",     value: item.status || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3"
                    style={{ paddingBottom: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px",
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.10em",
                      color: "rgba(255,255,255,0.55)",
                      textAlign: "right",
                      maxWidth: "60%",
                    }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Citation route */}
              <a
                href={`/api/editorials/citation/${item.slug}`}
                className="group mt-5 flex items-center justify-between transition-opacity hover:opacity-75"
                style={{ paddingTop: "0.75rem" }}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}>
                  Citation record
                </span>
                <ChevronRight style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.18)" }} />
              </a>
            </div>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLICATION CARD
// ─────────────────────────────────────────────────────────────────────────────

function PublicationCard({ item }: { item: PublicationRecord }) {
  const previewHref = item.previewEnabled
    ? (item.previewPath || `/api/editorials/preview/${item.slug}`)
    : null;

  return (
    <Link href={`/editorials/${item.slug}`} className="group block outline-none">
      <div
        className="relative overflow-hidden h-full transition-all duration-400"
        style={{
          backgroundColor: "rgb(5 5 7)",
          border: "1px solid rgba(255,255,255,0.062)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = `${GOLD}20`;
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(255,255,255,0.062)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Gold thread */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }}
        />

        <div className="p-7 md:p-8">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.40em",
              textTransform: "uppercase",
              color: `${GOLD}80`,
            }}>
              {item.category || "Editorial"}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
            }}>
              {item.tier}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.35rem, 1.8vw, 1.65rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.88)",
            transition: "color 350ms ease",
          }}
          className="group-hover:[color:rgba(255,255,255,1)]"
          >
            {item.title}
          </h2>

          {item.subtitle && (
            <p style={{
              marginTop: "0.65rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.95rem",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.35)",
              fontStyle: "italic",
            }}>
              {item.subtitle}
            </p>
          )}

          {item.description && (
            <p style={{
              marginTop: "0.75rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.92rem",
              lineHeight: 1.68,
              color: "rgba(255,255,255,0.35)",
              maxWidth: "32ch",
              transition: "color 350ms ease",
            }}
            className="group-hover:[color:rgba(255,255,255,0.48)]"
            >
              {item.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {[item.readingTime, item.date]
              .filter(Boolean)
              .map((val, i, arr) => (
                <React.Fragment key={i}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.20)",
                  }}>
                    {val}
                  </span>
                  {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>}
                </React.Fragment>
              ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}>
            <div className="flex items-center gap-2.5">
              {item.pdfPath && (
                <a
                  href={item.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                  }}
                >
                  <Download style={{ width: "10px", height: "10px" }} />
                  PDF
                </a>
              )}
              {previewHref && (
                <a
                  href={previewHref}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                  }}
                >
                  <Eye style={{ width: "10px", height: "10px" }} />
                  Preview
                </a>
              )}
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              transition: "color 350ms ease",
            }}
            className="group-hover:[color:rgba(201,169,110,0.70)]"
            >
              Open
              <ArrowRight style={{ width: "10px", height: "10px" }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const EditorialLibrary: NextPage<Props> = ({ items, flagship }) => {
  const [activeCategory, setActiveCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [items]);

  const supporting = items.filter(item => item.slug !== flagship?.slug);

  const filteredSupporting = React.useMemo(() => {
    if (!activeCategory) return supporting;
    return supporting.filter(i => i.category === activeCategory);
  }, [supporting, activeCategory]);

  return (
    <Layout
      title="Editorials | Abraham of London"
      description="Flagship editorials, strategic papers, books, previews, and formal publications from Abraham of London."
      canonicalUrl="/editorials"
      fullWidth
      headerTransparent
    >
      <Head>
        <title>Editorials | Abraham of London</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "-5%", top: "-10%",
              width: "700px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
              filter: "blur(130px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40" style={{
              background: `linear-gradient(to top, ${BASE}, transparent)`,
            }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>

          <div className="absolute inset-x-0 top-0 h-px" style={{
            background: `linear-gradient(to right, transparent, ${GOLD}25, transparent)`,
          }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <Eyebrow>Editorial canon</Eyebrow>
              </motion.div>

              <motion.h1 variants={fadeUp} style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(3.5rem, 8vw, 8.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.050em",
                color: "rgba(255,255,255,0.94)",
              }}>
                Editorials<span style={{ color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>.</span>
              </motion.h1>

              <motion.p variants={fadeUp} style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.42)",
                maxWidth: "46ch",
              }}>
                Canonical essays, flagship editorials, strategic papers, and formal publications.
                Written property, not content. Each record carries a page, a citation, and a preserved
                place in the institutional archive.
              </motion.p>

              {/* Stats */}
              <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "2.2rem",
                      lineHeight: 1,
                      color: "rgba(255,255,255,0.80)",
                    }}>
                      {items.length}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.34em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}>
                      publications indexed
                    </span>
                  </div>
                  {categories.length > 0 && (
                    <>
                      <div className="h-4 w-px bg-white/[0.08]" />
                      <div className="flex items-center gap-2.5">
                        <span style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "2.2rem",
                          lineHeight: 1,
                          color: "rgba(255,255,255,0.80)",
                        }}>
                          {categories.length}
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.25)",
                        }}>
                          categories
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>

            <div className="pb-16 md:pb-20" />
          </div>
        </section>

        {/* ── CATEGORY FILTER ───────────────────────────────────────────── */}
        {categories.length > 1 && (
          <div style={{
            backgroundColor: "rgba(0,0,0,0.40)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}>
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="flex items-center gap-2 overflow-x-auto py-3.5 hide-scrollbar">
                {["All", ...categories].map(cat => {
                  const isActive = cat === "All" ? activeCategory === "" : activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat === "All" ? "" : cat)}
                      style={{
                        flexShrink: 0,
                        padding: "5px 14px",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        border: `1px solid ${isActive ? `${GOLD}35` : "rgba(255,255,255,0.07)"}`,
                        backgroundColor: isActive ? `${GOLD}0D` : "transparent",
                        color: isActive ? `${GOLD}CC` : "rgba(255,255,255,0.28)",
                        cursor: "pointer",
                        transition: "all 250ms ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.30em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.18)",
                  }}>
                    {filteredSupporting.length + (flagship && (!activeCategory || flagship.category === activeCategory) ? 1 : 0)} / {items.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">

            {/* Flagship */}
            {flagship && (!activeCategory || flagship.category === activeCategory || activeCategory === "") && (
              <div className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: `linear-gradient(to right, ${GOLD}45, transparent)` }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}>
                    Flagship
                  </span>
                </div>
                <FlagshipCard item={flagship} />
              </div>
            )}

            {/* Separator */}
            {flagship && filteredSupporting.length > 0 && (
              <div className="mb-10 mt-2">
                <GoldRule soft />
              </div>
            )}

            {/* Supporting publications */}
            {filteredSupporting.length > 0 && (
              <>
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: `linear-gradient(to right, ${GOLD}35, transparent)` }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.20)",
                  }}>
                    {activeCategory || "All publications"}
                  </span>
                </div>

                <motion.div
                  variants={stagger(0.07)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredSupporting.map(item => (
                    <motion.div key={item.slug} variants={fadeUp}>
                      <PublicationCard item={item} />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {/* Empty */}
            {!flagship && filteredSupporting.length === 0 && (
              <div style={{
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(255,255,255,0.01)",
                padding: "4rem 2rem",
                textAlign: "center",
              }}>
                <FileText style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.18)", margin: "0 auto 1rem" }} />
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.25rem",
                  color: "rgba(255,255,255,0.40)",
                  fontStyle: "italic",
                }}>
                  No publications indexed yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        <section style={{
          backgroundColor: VOID,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <GoldRule />
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
                fontStyle: "italic",
                lineHeight: 1.68,
                color: "rgba(255,255,255,0.28)",
                maxWidth: "40ch",
                marginTop: "1rem",
              }}>
                Each publication is a formal record in the institutional archive — not content to
                be consumed, but written property to be cited and returned to.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 22px",
                    border: `1px solid ${GOLD}28`,
                    backgroundColor: `${GOLD}08`,
                    color: `${GOLD}BB`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}48`; el.style.backgroundColor = `${GOLD}12`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}28`; el.style.backgroundColor = `${GOLD}08`; }}
                >
                  Enter the canon
                  <ChevronRight style={{ width: "12px", height: "12px" }} />
                </Link>
                <Link
                  href="/artifacts"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 22px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    color: "rgba(255,255,255,0.32)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.14)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.32)"; }}
                >
                  Artifacts
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const items   = getPublicationCatalogue();
  const flagship = items.find(item => item.slug === "ultimate-purpose-of-man") || items[0] || null;
  return { props: { items, flagship }, revalidate: 1800 };
};

export default EditorialLibrary;