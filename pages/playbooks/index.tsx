/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/playbooks/index.tsx
// Institutional Monumentalism
// Fixed properly:
// - removes brittle generic-doc inference
// - uses Contentlayer's dedicated allPlaybooks collection directly
// - normalizes slugs consistently with [slug].tsx
// - filters draft/unpublished entries safely
// - keeps the same visual language but makes the data path sound

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, ScanSearch } from "lucide-react";
import type { Playbook } from "contentlayer/generated";

import Layout from "@/components/Layout";
import PlaybookCard from "@/components/playbooks/PlaybookCard";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type PlaybookItem = {
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  playbookType: string | null;
  estimatedTime: string | null;
  tier: string | null;
  phases: string[];
  tags: string[];
};

type PlaybooksPageProps = {
  items: PlaybookItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeStr(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeSlug(value: unknown): string {
  return safeStr(value)
    .replace(/^\/+|\/+$/g, "")
    .replace(/^playbooks\//i, "");
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => safeStr(v))
    .filter(Boolean);
}

function isPublishedPlaybook(doc: Playbook): boolean {
  const anyDoc = doc as any;
  return anyDoc?.draft !== true && anyDoc?.published !== false;
}

function mapPlaybook(doc: Playbook): PlaybookItem {
  const anyDoc = doc as any;

  return {
    slug: normalizeSlug(anyDoc.urlSlug || doc.slug),
    title: safeStr(doc.title, "Untitled Playbook"),
    description: safeStr(doc.description || anyDoc.summary || anyDoc.excerpt) || null,
    difficulty: safeStr(anyDoc.difficulty) || null,
    playbookType: safeStr(anyDoc.playbookType || anyDoc.category || anyDoc.theme) || null,
    estimatedTime: safeStr(anyDoc.estimatedTime || anyDoc.readingTime) || null,
    tier: safeStr(anyDoc.tier) || null,
    phases: safeStringArray(anyDoc.phases),
    tags: safeStringArray(anyDoc.tags),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
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
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent"
      }
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8.5px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

export const getStaticProps: GetStaticProps<PlaybooksPageProps> = async () => {
  console.log("[PAGE_DATA] pages/playbooks/index.tsx getStaticProps START");
  try {
  try {
  try {
    const { getAllPlaybooks } = await import("@/lib/content/server");
    const allPlaybooks = getAllPlaybooks() as unknown as Playbook[];
    const items = allPlaybooks
      .filter(isPublishedPlaybook)
      .map(mapPlaybook)
      .filter((item) => Boolean(item.slug))
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      props: { items },
      revalidate: 1800,
    };
  } catch {
    return {
      props: { items: [] },
      revalidate: 1800,
    };
  }

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/playbooks/index.tsx getStaticProps END");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const PlaybooksPage: NextPage<PlaybooksPageProps> = ({ items }) => {
  const reduceMotion = useReducedMotion();
  const [activeType, setActiveType] = React.useState<string>("");

  const types = React.useMemo(() => {
    const set = new Set(items.map((i) => i.playbookType).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = React.useMemo(() => {
    if (!activeType) return items;
    return items.filter((i) => i.playbookType === activeType);
  }, [items, activeType]);

  return (
    <Layout
      title="Playbooks | Abraham of London"
      description="Execution-grade operating systems for diagnosing drift, restoring alignment, and enforcing execution discipline."
      canonicalUrl="/playbooks"
      fullWidth
      headerTransparent
    >
      <Head>
        <title>Playbooks | Abraham of London</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                left: "-5%",
                top: "-10%",
                width: "700px",
                height: "600px",
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

          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: "1px",
              background: `linear-gradient(to right, transparent, ${GOLD}25, transparent)`,
            }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <Eyebrow>Execution systems</Eyebrow>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(3.5rem, 8vw, 8.5rem)",
                  lineHeight: 0.88,
                  letterSpacing: "-0.050em",
                  color: "rgba(255,255,255,0.94)",
                }}
              >
                Playbooks
                <span style={{ color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.45)",
                  maxWidth: "46ch",
                }}
              >
                These are not guides. They are structured operating systems for
                diagnosing drift, correcting failure modes, restoring alignment,
                and enforcing execution discipline.
              </motion.p>

              <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "2.2rem",
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.80)",
                      }}
                    >
                      {items.length}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      playbooks indexed
                    </span>
                  </div>

                  <div className="h-4 w-px bg-white/[0.08]" />

                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "2.2rem",
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.80)",
                      }}
                    >
                      {types.length}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      categories
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <div className="pb-16 md:pb-20" />
          </div>
        </section>

        {/* ── FILTER STRIP ──────────────────────────────────────────────── */}
        {types.length > 1 && (
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.40)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}
          >
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-3.5">
                {["All", ...types].map((type) => {
                  const isActive = type === "All" ? activeType === "" : activeType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveType(type === "All" ? "" : type)}
                      style={{
                        flexShrink: 0,
                        padding: "5px 14px",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        border: `1px solid ${
                          isActive ? `${GOLD}35` : "rgba(255,255,255,0.07)"
                        }`,
                        backgroundColor: isActive ? `${GOLD}0D` : "transparent",
                        color: isActive ? `${GOLD}CC` : "rgba(255,255,255,0.28)",
                        cursor: "pointer",
                        transition: "all 250ms ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {type}
                    </button>
                  );
                })}

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    {filtered.length} / {items.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GRID ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
            <div className="mb-10 flex items-center gap-3">
              <div
                className="h-px w-8"
                style={{ background: `linear-gradient(to right, ${GOLD}45, transparent)` }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                {activeType ? `${activeType} playbooks` : "All playbooks"}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                  padding: "4rem 2rem",
                  textAlign: "center",
                }}
              >
                <ScanSearch
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "rgba(255,255,255,0.18)",
                    margin: "0 auto 1rem",
                  }}
                />
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.25rem",
                    color: "rgba(255,255,255,0.40)",
                    fontStyle: "italic",
                  }}
                >
                  No playbooks indexed yet.
                </p>
              </div>
            ) : (
              <motion.div
                variants={stagger(0.08)}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                {filtered.map((item) => (
                  <motion.div key={item.slug} variants={fadeUp}>
                    <PlaybookCard
                      title={item.title}
                      description={item.description}
                      href={`/playbooks/${encodeURIComponent(item.slug)}`}
                      playbookType={item.playbookType}
                      difficulty={item.difficulty}
                      estimatedTime={item.estimatedTime}
                      tier={item.tier}
                      phases={item.phases}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
            <div className="flex flex-col items-center gap-5 text-center">
              <GoldRule />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1rem, 1.4vw, 1.20rem)",
                  fontStyle: "italic",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.32)",
                  maxWidth: "38ch",
                  marginTop: "1rem",
                }}
              >
                If a playbook surfaces a problem that requires direct intervention,
                the diagnostics system is the appropriate next step.
              </p>

              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 22px",
                    border: `1px solid ${GOLD}30`,
                    backgroundColor: `${GOLD}08`,
                    color: `${GOLD}BB`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}50`;
                    el.style.backgroundColor = `${GOLD}12`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}30`;
                    el.style.backgroundColor = `${GOLD}08`;
                  }}
                >
                  Enter diagnostics
                  <ChevronRight style={{ width: "12px", height: "12px" }} />
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="group inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 22px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.14)";
                    el.style.color = "rgba(255,255,255,0.60)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.color = "rgba(255,255,255,0.35)";
                  }}
                >
                  Strategy Room
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PlaybooksPage;