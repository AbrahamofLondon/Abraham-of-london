/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/playbooks/[slug].tsx
// Institutional reading chamber for a single playbook.
// Cleaned up:
// - removed illegal duplicate import
// - removed duplicate file content corruption
// - hardened slug lookup
// - safer adjacent navigation
// - cleaner MDX fallback logic
// - sharper metadata handling
// - preserved the design language you were aiming for

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { allPlaybooks } from "contentlayer/generated";
import type { Playbook } from "contentlayer/generated";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  Layers,
  AlertTriangle,
  CheckSquare,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PlaybookPageProps {
  playbook: Playbook;
  renderCode: string;
  adjacent: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 22)";
const VOID = "rgb(3 3 5)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeSlug(input: unknown): string {
  return safeString(input).replace(/^\/+|\/+$/g, "");
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = safeString(code).trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /\bjsx_runtime\b/.test(s) ||
    /\bvar\s+\w+\s*=\s*Object\.create/.test(s)
  );
}

function pickRenderablePlaybookCode(playbook: Playbook): string {
  const compiled = safeString((playbook as any)?.body?.code);
  const raw = safeString((playbook as any)?.body?.raw);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) return compiled;
  if (raw) return raw;
  return compiled || "";
}

function difficultyColor(d?: string): string {
  switch ((d ?? "").toLowerCase()) {
    case "executive":
      return "rgba(168,85,247,0.80)";
    case "advanced":
      return `${GOLD}CC`;
    case "intermediate":
      return "rgba(99,179,237,0.75)";
    default:
      return "rgba(134,239,172,0.65)";
  }
}

function typeColor(t?: string): string {
  switch ((t ?? "").toLowerCase()) {
    case "diagnostic":
      return `${GOLD}BB`;
    case "execution":
      return "rgba(134,239,172,0.70)";
    case "correction":
      return "rgba(252,165,165,0.70)";
    case "leadership":
      return "rgba(147,197,253,0.70)";
    default:
      return "rgba(255,255,255,0.45)";
  }
}

function titleCase(input?: string): string {
  const value = safeString(input);
  if (!value) return "Playbook";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allPlaybooks
    .map((p) => normalizeSlug(p.slug))
    .filter(Boolean)
    .filter((slug) => !slug.includes("/"))
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PlaybookPageProps> = async ({ params }) => {
  const slug = normalizeSlug(params?.slug);

  const stablePlaybooks = [...allPlaybooks].filter((p) => normalizeSlug(p.slug));
  const playbook = stablePlaybooks.find((p) => normalizeSlug(p.slug) === slug);

  if (!playbook) {
    return { notFound: true };
  }

  const sorted = [...stablePlaybooks].sort((a, b) =>
    safeString(a.title).localeCompare(safeString(b.title)),
  );

  const idx = sorted.findIndex((p) => normalizeSlug(p.slug) === slug);
  const prevItem = idx > 0 ? sorted[idx - 1] : null;
  const nextItem = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  return {
    props: {
      playbook,
      renderCode: pickRenderablePlaybookCode(playbook),
      adjacent: {
        prev: prevItem
          ? { slug: normalizeSlug(prevItem.slug), title: safeString(prevItem.title) }
          : null,
        next: nextItem
          ? { slug: normalizeSlug(nextItem.slug), title: safeString(nextItem.title) }
          : null,
      },
    },
    revalidate: 3600,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const PlaybookPage: NextPage<PlaybookPageProps> = ({ playbook, renderCode, adjacent }) => {
  const reduceMotion = useReducedMotion();

  const typeLabel = titleCase(playbook.playbookType);
  const isArchitect = safeString(playbook.tier).toLowerCase() === "architect";

  return (
    <Layout
      title={`${playbook.title} | Abraham of London`}
      description={playbook.description || "Institutional playbook"}
      canonicalUrl={`/playbooks/${normalizeSlug(playbook.slug)}`}
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        {/* ── COVER ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                right: "-5%",
                top: "-15%",
                width: "550px",
                height: "550px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${GOLD}10 0%, ${GOLD}04 30%, transparent 65%)`,
                filter: "blur(130px)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
            />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>

          {isArchitect && (
            <div
              style={{
                backgroundColor: `${GOLD}12`,
                borderBottom: `1px solid ${GOLD}20`,
                padding: "0.50rem 0",
              }}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-12">
                <div className="flex items-center gap-2.5">
                  <Lock style={{ width: "9px", height: "9px", color: `${GOLD}AA` }} />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.40em",
                      textTransform: "uppercase",
                      color: `${GOLD}CC`,
                    }}
                  >
                    Architect Tier — Restricted Circulation
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${GOLD}25, transparent)`,
            }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-28 md:pt-36" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="flex items-center gap-2"
            >
              <Link
                href="/playbooks"
                className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                <ArrowLeft style={{ width: "11px", height: "11px" }} />
                Playbooks
              </Link>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "10px" }}>/</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}
              >
                {typeLabel}
              </span>
            </motion.div>

            <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.85,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="mb-6 flex flex-wrap items-center gap-2.5">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: typeColor(playbook.playbookType),
                      }}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  {playbook.difficulty && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{
                        border: "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: "rgba(255,255,255,0.015)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                          color: difficultyColor(playbook.difficulty),
                        }}
                      >
                        {playbook.difficulty}
                      </span>
                    </div>
                  )}
                </div>

                <h1
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(2.2rem, 5vw, 4.0rem)",
                    lineHeight: 0.94,
                    letterSpacing: "-0.035em",
                    color: "rgba(255,255,255,0.94)",
                  }}
                >
                  {playbook.title}
                </h1>

                {playbook.description && (
                  <p
                    style={{
                      marginTop: "1.25rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.45)",
                      maxWidth: "46ch",
                      fontStyle: "italic",
                    }}
                  >
                    {playbook.description}
                  </p>
                )}

                {(playbook as any).framework && (
                  <div
                    style={{
                      marginTop: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      className="h-px w-6"
                      style={{ background: `linear-gradient(to right, ${GOLD}50, transparent)` }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: `${GOLD}90`,
                      }}
                    >
                      Framework
                    </span>
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.05rem",
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {(playbook as any).framework}
                    </span>
                  </div>
                )}

                {playbook.estimatedTime && (
                  <div
                    style={{
                      marginTop: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Clock style={{ width: "11px", height: "11px", color: "rgba(255,255,255,0.20)" }} />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.28)",
                      }}
                    >
                      {playbook.estimatedTime}
                    </span>
                  </div>
                )}

                {playbook.tags?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {playbook.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: "3px 10px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: "rgba(255,255,255,0.015)",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.26)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, delay: 0.14 }}
                className="space-y-3"
              >
                {playbook.phases?.length > 0 && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: LIFT,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Layers style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.38em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.25)",
                          }}
                        >
                          Execution phases
                        </span>
                      </div>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {playbook.phases.map((phase, i) => (
                        <div
                          key={`${phase}-${i}`}
                          className="flex items-center gap-3"
                          style={{ padding: "0.75rem 1.25rem" }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "1.5rem",
                              lineHeight: 1,
                              color: `${GOLD}30`,
                              minWidth: "28px",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.95rem",
                              color: "rgba(255,255,255,0.70)",
                            }}
                          >
                            {phase}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {playbook.signals?.length > 0 && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.015)",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          style={{ width: "11px", height: "11px", color: "rgba(252,165,165,0.60)" }}
                        />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.38em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.22)",
                          }}
                        >
                          Detection signals
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: "0.75rem 1.25rem" }}>
                      {playbook.signals.map((signal, i) => (
                        <div
                          key={`${signal}-${i}`}
                          className="flex items-start gap-2.5 py-2"
                          style={{
                            borderBottom:
                              i < playbook.signals.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(252,165,165,0.45)",
                              marginTop: "6px",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.90rem",
                              lineHeight: 1.55,
                              color: "rgba(255,255,255,0.50)",
                            }}
                          >
                            {signal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {playbook.outputs?.length > 0 && (
                  <div
                    style={{
                      border: `1px solid ${GOLD}18`,
                      backgroundColor: `${GOLD}06`,
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem 1.25rem",
                        borderBottom: `1px solid ${GOLD}12`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare style={{ width: "11px", height: "11px", color: `${GOLD}80` }} />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.38em",
                            textTransform: "uppercase",
                            color: `${GOLD}90`,
                          }}
                        >
                          Deliverable outputs
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: "0.75rem 1.25rem" }}>
                      {playbook.outputs.map((output, i) => (
                        <div
                          key={`${output}-${i}`}
                          className="flex items-start gap-2.5 py-1.5"
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              width: "18px",
                              height: "1px",
                              background: `${GOLD}55`,
                              marginTop: "8px",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.90rem",
                              lineHeight: 1.55,
                              color: "rgba(255,255,255,0.62)",
                            }}
                          >
                            {output}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {playbook.prerequisites?.length > 0 && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.05)",
                      backgroundColor: "rgba(255,255,255,0.01)",
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.36em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Prerequisites
                    </div>
                    {playbook.prerequisites.map((req, i) => (
                      <div
                        key={`${req}-${i}`}
                        className="flex items-start gap-2 py-1.5"
                      >
                        <ChevronRight
                          style={{
                            width: "10px",
                            height: "10px",
                            color: "rgba(255,255,255,0.18)",
                            flexShrink: 0,
                            marginTop: "3px",
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.40)",
                          }}
                        >
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <div style={{ paddingBottom: "4rem" }} />
          </div>
        </section>

        {/* ── DOCUMENT BODY ─────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div
            className="mx-auto px-6 lg:px-12"
            style={{
              maxWidth: "800px",
              paddingTop: "4rem",
              paddingBottom: "5rem",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.70 }}
            >
              <div className="playbook-body">
                <SafeMDXRenderer code={renderCode} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── ADJACENT NAVIGATION ───────────────────────────────────────── */}
        {(adjacent.prev || adjacent.next) && (
          <section
            style={{
              backgroundColor: VOID,
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
              <div className="grid gap-4 sm:grid-cols-2">
                {adjacent.prev ? (
                  <Link
                    href={`/playbooks/${adjacent.prev.slug}`}
                    className="group flex items-center gap-4 transition-opacity hover:opacity-75"
                    style={{
                      padding: "1.25rem 1.5rem",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.01)",
                    }}
                  >
                    <ArrowLeft
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "rgba(255,255,255,0.25)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Previous
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.05rem",
                          color: "rgba(255,255,255,0.60)",
                        }}
                      >
                        {adjacent.prev.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {adjacent.next ? (
                  <Link
                    href={`/playbooks/${adjacent.next.slug}`}
                    className="group flex items-center justify-end gap-4 text-right transition-opacity hover:opacity-75"
                    style={{
                      padding: "1.25rem 1.5rem",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.01)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Next
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.05rem",
                          color: "rgba(255,255,255,0.60)",
                        }}
                      >
                        {adjacent.next.title}
                      </div>
                    </div>
                    <ArrowRight
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "rgba(255,255,255,0.25)",
                        flexShrink: 0,
                      }}
                    />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {/* ── ESCALATION CLOSE ──────────────────────────────────────────── */}
        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-5xl px-6 py-14 lg:px-12">
            <div
              style={{
                border: `1px solid ${GOLD}20`,
                backgroundColor: `${GOLD}07`,
                padding: "2rem 2.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "1rem",
                }}
              >
                If this playbook surfaces a real problem
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.45)",
                  fontStyle: "italic",
                  maxWidth: "48ch",
                  marginBottom: "1.5rem",
                }}
              >
                A playbook identifies the pattern. Diagnostics establish the signal.
                The Strategy Room exists for situations where the diagnosis is complete
                and the mandate is serious.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: `1px solid ${GOLD}35`,
                    backgroundColor: `${GOLD}0D`,
                    color: `${GOLD}BB`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}55`;
                    el.style.backgroundColor = `${GOLD}14`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}35`;
                    el.style.backgroundColor = `${GOLD}0D`;
                  }}
                >
                  Enter diagnostics
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.40)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.16)";
                    el.style.color = "rgba(255,255,255,0.65)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.08)";
                    el.style.color = "rgba(255,255,255,0.40)";
                  }}
                >
                  Strategy Room
                </Link>

                <Link
                  href="/playbooks"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "11px 22px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.50)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "rgba(255,255,255,0.25)";
                  }}
                >
                  All playbooks
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .playbook-body {
          font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
          font-weight: 300;
          font-size: clamp(1rem, 1.2vw, 1.08rem);
          line-height: 1.82;
          color: rgba(255, 255, 255, 0.62);
        }

        .playbook-body h1 {
          margin-top: 3.5rem;
          margin-bottom: 1.25rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
          font-weight: 300;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          line-height: 1.0;
          letter-spacing: -0.028em;
          color: rgba(255, 255, 255, 0.94);
        }

        .playbook-body h2 {
          margin-top: 3rem;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
          font-weight: 300;
          font-size: clamp(1.35rem, 2.2vw, 1.85rem);
          line-height: 1.05;
          letter-spacing: -0.020em;
          color: rgba(255, 255, 255, 0.88);
        }

        .playbook-body h3 {
          margin-top: 2rem;
          margin-bottom: 0.65rem;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.70rem;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(201, 169, 110, 0.72);
        }

        .playbook-body h4 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.65rem;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.30);
        }

        .playbook-body p {
          margin: 1.25rem 0;
          color: rgba(255, 255, 255, 0.62);
        }

        .playbook-body blockquote {
          margin: 2rem 0;
          padding: 1.25rem 1.5rem;
          border-left: 2px solid rgba(201, 169, 110, 0.55);
          background: rgba(201, 169, 110, 0.06);
          font-style: italic;
          color: rgba(255, 255, 255, 0.72);
        }

        .playbook-body ul {
          margin: 1.5rem 0;
          padding: 0;
          list-style: none;
        }

        .playbook-body ul li {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.60);
        }

        .playbook-body ul li::before {
          content: '';
          flex-shrink: 0;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(201, 169, 110, 0.55);
          margin-top: 0.58rem;
        }

        .playbook-body ol {
          margin: 1.5rem 0;
          padding: 0;
          list-style: none;
          counter-reset: ol-counter;
        }

        .playbook-body ol li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.60);
          counter-increment: ol-counter;
        }

        .playbook-body ol li::before {
          content: counter(ol-counter, decimal-leading-zero);
          flex-shrink: 0;
          font-family: 'Cormorant Garamond', Georgia, ui-serif, serif;
          font-weight: 300;
          font-size: 1.5rem;
          line-height: 1;
          color: rgba(201, 169, 110, 0.28);
          min-width: 28px;
        }

        .playbook-body strong {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
        }

        .playbook-body em {
          color: rgba(255, 255, 255, 0.72);
          font-style: italic;
        }

        .playbook-body hr {
          margin: 2.5rem 0;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.07),
            transparent
          );
          border: none;
        }

        .playbook-body code {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 0.875em;
          color: rgba(201, 169, 110, 0.85);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15rem 0.35rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </Layout>
  );
};

export default PlaybookPage;