import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Download } from "lucide-react";

import Layout from "@/components/Layout";
import { getPublicationCatalogue } from "@/lib/editorial/catalogue";
import {
  getEditorialSeriesCatalogue,
  type EditorialSeries,
} from "@/lib/editorial/series";
import type { PublicationRecord } from "@/lib/editorial/types";

type Props = {
  items: PublicationRecord[];
  flagship: PublicationRecord | null;
  series: EditorialSeries[];
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";

const FLAGSHIP_GOVERNING_CLAIM =
  "Man was not made merely to exist, consume, choose, or express himself. He was made to receive order, embody it, and return glory to its source. Purpose precedes preference. Order precedes freedom. Mandate precedes ambition.";

const serif = "'Cormorant Garamond', Georgia, ui-serif, serif";
const mono  = "'JetBrains Mono', ui-monospace, monospace";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase tracking-[0.34em]"
      style={{ fontSize: "7.5px", color: "var(--ds-accent)" }}
    >
      {children}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Undated";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readTime(value?: string | null) {
  return value || "Read";
}

// ─── Publication record row ───────────────────────────────────────────────────

function EditorialRow({ item }: { item: PublicationRecord }) {
  return (
    <Link
      href={`/editorials/${item.slug}`}
      className="group grid gap-2 border-b py-5 transition-colors duration-200 md:grid-cols-[8rem_8rem_1fr_5rem]"
      style={{ borderBottomColor: "var(--ds-border)" }}
    >
      <div className="font-mono text-[7.5px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
        {formatDate(item.date)}
      </div>
      <div className="font-mono text-[7px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-accent)" }}>
        {item.category || "Editorial"}
      </div>
      <div className="min-w-0">
        <h2 className="font-serif text-[1.15rem] italic transition-colors duration-200 group-hover:text-white" style={{ color: "var(--ds-text)" }}>
          {item.title}
        </h2>
        <p className="mt-1 truncate text-[12px] leading-[1.2rem]" style={{ color: "var(--ds-text-muted)" }}>
          {item.description || item.subtitle || "Published editorial record."}
        </p>
      </div>
      <div className="text-left md:text-right font-mono text-[7px] uppercase tracking-[0.26em]" style={{ color: "var(--ds-text-subtle)" }}>
        {readTime(item.readingTime)}
      </div>
    </Link>
  );
}

// ─── Applied essay series ─────────────────────────────────────────────────────

const APPLIED_SERIES = [
  {
    slug: "the-burden-changes-hands",
    title: "The Burden Changes Hands",
    description:
      "Seven essays on memory, custody, records, authorship, and the intelligence organisations build over time.",
    href: "/blog/series/the-burden-changes-hands",
    partCount: 7,
    displayStatus: "Complete",
    relationNote: "What institutions carry.",
  },
  {
    slug: "the-science-of-inherited-selves",
    title: "The Science of Inherited Selves",
    description:
      "Eight essays on inheritance, attachment, family memory, trauma, love, marriage, responsibility, and the courage to interrupt what should not be passed on.",
    href: "/blog/series/the-science-of-inherited-selves",
    partCount: 8,
    displayStatus: "In progress",
    relationNote: "What persons, families, and generations carry.",
  },
] as const;

type AppliedSeriesEntry = (typeof APPLIED_SERIES)[number];

function AppliedSeriesCard({ item }: { item: AppliedSeriesEntry }) {
  return (
    <Link
      href={item.href}
      className="group block border py-5 px-5 transition-colors duration-200"
      style={{
        borderColor: "rgba(201,150,58,0.14)",
        backgroundColor: "rgba(201,150,58,0.02)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="font-mono text-[6.5px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
          {item.partCount}-Part Series
        </span>
        <span style={{ color: "var(--ds-border)" }}>·</span>
        <span className="font-mono text-[6.5px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-accent)" }}>
          {item.displayStatus}
        </span>
      </div>
      <h3
        className="font-serif italic mb-2 transition-colors duration-200 group-hover:text-white"
        style={{ fontWeight: 300, fontSize: "1.18rem", lineHeight: 1.08, color: "var(--ds-text)" }}
      >
        {item.title}
      </h3>
      <p className="text-[12px] leading-[1.55rem] mb-3" style={{ color: "var(--ds-text-muted)", maxWidth: "52ch" }}>
        {item.description}
      </p>
      <div className="font-mono text-[6.5px] uppercase tracking-[0.26em] italic mb-4" style={{ color: "var(--ds-text-subtle)" }}>
        {item.relationNote}
      </div>
      <div className="font-mono text-[7px] uppercase tracking-[0.26em]" style={{ color: "var(--ds-accent)" }}>
        Read the series →
      </div>
    </Link>
  );
}

// ─── Editorial series card (uniform — no lead overrides) ─────────────────────

function EditorialSeriesCard({ item }: { item: EditorialSeries }) {
  return (
    <div
      className="border py-7 px-6 transition-colors duration-200"
      style={{ borderColor: "var(--ds-border)", backgroundColor: "transparent" }}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
          {item.partCount}-Part Series
        </span>
        <span style={{ color: "var(--ds-border)" }}>·</span>
        <span className="font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
          {item.status === "PUBLISHED" ? "Complete" : item.partCount > 0 && item.parts.length === 0 ? "Scheduled" : "In progress"}
        </span>
      </div>
      <h2
        className="font-serif italic mb-3"
        style={{ fontWeight: 300, fontSize: "1.4rem", lineHeight: 1.05, color: "var(--ds-text)" }}
      >
        {item.title}
      </h2>
      <p className="text-sm leading-[1.65rem] mb-5" style={{ color: "var(--ds-text-muted)", maxWidth: "56ch" }}>
        {item.descriptor}
      </p>
      <div className="flex flex-wrap items-center gap-5">
        <Link
          href={`/editorials/series/${item.slug}`}
          className="inline-flex items-center border px-4 py-2 font-mono text-[7.5px] uppercase tracking-[0.28em] transition-colors duration-200"
          style={{
            borderColor: "var(--ds-accent-soft)",
            color: "var(--ds-accent)",
            backgroundColor: "var(--ds-accent-soft)",
          }}
        >
          Enter the series
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EditorialLibrary: NextPage<Props> = ({ items, flagship, series }) => {
  const [activeCategory, setActiveCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [items]);

  const supporting = React.useMemo(
    () => items.filter((item) => item.slug !== flagship?.slug),
    [items, flagship?.slug],
  );

  const filteredSupporting = React.useMemo(() => {
    if (!activeCategory) return supporting;
    return supporting.filter((i) => i.category === activeCategory);
  }, [supporting, activeCategory]);

  return (
    <Layout
      title="Editorials | Abraham of London"
      description="Flagship editorials, strategic papers, books, previews, and formal publications from Abraham of London."
      canonicalUrl="/editorials"
      fullWidth
      headerTransparent
      className="ds-surface-essays"
    >
      <Head>
        <title>Editorials | Abraham of London</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── FLAGSHIP HERO ────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            minHeight: "88vh",
            backgroundColor: VOID,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Atmosphere */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                left: "-8%",
                top: "-20%",
                width: "700px",
                height: "640px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${GOLD}08 0%, ${GOLD}03 35%, transparent 65%)`,
                filter: "blur(140px)",
              }}
            />
            {/* Bottom scrim */}
            <div
              className="absolute inset-x-0 bottom-0 h-52"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
            />
            {/* Grain */}
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>

          {/* Top gold rule */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${GOLD}25, transparent)`,
            }}
          />

          {/* Content — centred column */}
          <div
            className="relative z-10 flex flex-col flex-1 items-center justify-center text-center px-6"
            style={{ paddingTop: "8rem", paddingBottom: "6rem" }}
          >
            <div style={{ maxWidth: "900px", width: "100%" }}>

              {/* Status mark */}
              <div style={{
                fontFamily: mono,
                fontSize: "7.5px",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
                marginBottom: "1.25rem",
              }}>
                Flagship Editorial · CB-ED-001
              </div>

              {/* Gold rule */}
              <div style={{
                width: "48px",
                height: "1px",
                background: `linear-gradient(to right, transparent, ${GOLD}50, transparent)`,
                margin: "0 auto 2.25rem",
              }} />

              {/* Title */}
              <h1 style={{
                fontFamily: serif,
                fontWeight: 300,
                fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.95)",
                marginBottom: "1.1rem",
              }}>
                {flagship?.title ?? "The Ultimate Purpose of Man"}
              </h1>

              {/* Subtitle */}
              {flagship?.subtitle && (
                <p style={{
                  fontFamily: serif,
                  fontWeight: 300,
                  fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
                  lineHeight: 1.5,
                  color: `${GOLD}99`,
                  fontStyle: "italic",
                  marginBottom: "1.75rem",
                }}>
                  {flagship.subtitle}
                </p>
              )}

              {/* Governing claim */}
              <p style={{
                fontFamily: serif,
                fontWeight: 300,
                fontSize: "clamp(0.98rem, 1.2vw, 1.08rem)",
                lineHeight: 1.80,
                color: "rgba(255,255,255,0.42)",
                maxWidth: "54ch",
                margin: "0 auto 2rem",
              }}>
                {FLAGSHIP_GOVERNING_CLAIM}
              </p>

              {/* Meta strip */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                fontFamily: mono,
                fontSize: "7px",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
                marginBottom: "2.25rem",
              }}>
                {flagship?.date && <span>{formatDate(flagship.date)}</span>}
                {flagship?.date && flagship?.readingTime && (
                  <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
                )}
                {flagship?.readingTime && <span>{flagship.readingTime}</span>}
                {flagship?.readingTime && flagship?.version && (
                  <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
                )}
                {flagship?.version && <span>v{flagship.version}</span>}
              </div>

              {/* CTAs */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}>
                {flagship && (
                  <Link
                    href={`/editorials/${flagship.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "13px 28px",
                      border: `1px solid ${GOLD}50`,
                      backgroundColor: `${GOLD}14`,
                      color: GOLD,
                      fontFamily: mono,
                      fontSize: "8.5px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}75`;
                      el.style.backgroundColor = `${GOLD}20`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}50`;
                      el.style.backgroundColor = `${GOLD}14`;
                    }}
                  >
                    Open the editorial →
                  </Link>
                )}
                {flagship?.pdfPath && (
                  <a
                    href={flagship.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "13px 28px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: "transparent",
                      color: "rgba(255,255,255,0.40)",
                      fontFamily: mono,
                      fontSize: "8.5px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.20)";
                      el.style.color = "rgba(255,255,255,0.65)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.10)";
                      el.style.color = "rgba(255,255,255,0.40)";
                    }}
                  >
                    <Download style={{ width: "11px", height: "11px" }} />
                    Download PDF
                  </a>
                )}
              </div>

              {/* Convergence label */}
              <div style={{
                marginTop: "3.5rem",
                fontFamily: mono,
                fontSize: "7px",
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.14)",
              }}>
                The convergence text beneath the Canon
              </div>

            </div>
          </div>
        </section>

        {/* ── ESTATE HIERARCHY STRIP ───────────────────────────────────── */}
        <section style={{
          backgroundColor: BASE,
          borderTop: `1px solid ${GOLD}15`,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              padding: "0.85rem 0",
              fontFamily: mono,
              fontSize: "7.5px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
            }}>
              {(
                [
                  { label: "Canon",               active: false },
                  { label: "Flagship Editorial",  active: true  },
                  { label: "Editorial Series",    active: false },
                  { label: "Applied Essay Series", active: false },
                  { label: "Publication Record",  active: false },
                ] as const
              ).map((node, i, arr) => (
                <React.Fragment key={node.label}>
                  <span style={{ color: node.active ? GOLD : "rgba(255,255,255,0.22)" }}>
                    {node.label}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ color: "rgba(255,255,255,0.10)" }}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Editorial Series ─────────────────────────────────────── */}
        {series.length > 0 ? (
          <section className="py-10 lg:py-12" style={{ borderBottom: "1px solid var(--ds-border)" }}>
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="mb-6">
                <SectionLabel>Editorial Series</SectionLabel>
              </div>
              <div className="space-y-4">
                {series.map((item) => (
                  <EditorialSeriesCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── 3. Applied Essay Series ─────────────────────────────────── */}
        <section className="py-10 lg:py-12" style={{ borderBottom: "1px solid var(--ds-border)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="mb-2">
              <SectionLabel>Applied Essay Series</SectionLabel>
            </div>
            <p
              className="mb-6 font-mono text-[7px] uppercase tracking-[0.28em] leading-5"
              style={{ color: "var(--ds-text-subtle)", maxWidth: "58ch" }}
            >
              The Burden Changes Hands explores what institutions carry.
              {" "}The Science of Inherited Selves explores what persons, families, and generations carry.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {APPLIED_SERIES.map((item) => (
                <AppliedSeriesCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Publication Record ───────────────────────────────────── */}
        {filteredSupporting.length > 0 ? (
          <section className="py-10 lg:py-12">
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="mb-6">
                <SectionLabel>Publication Record</SectionLabel>
              </div>
              {categories.length > 1 && (
                <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("")}
                    className="font-mono text-[8px] uppercase tracking-[0.3em]"
                    style={{
                      color: activeCategory === "" ? "var(--ds-text)" : "var(--ds-text-muted)",
                      textDecoration: activeCategory === "" ? "underline" : "none",
                      textUnderlineOffset: "0.35rem",
                    }}
                  >
                    All
                  </button>
                  {categories.map((category) => {
                    const active = activeCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className="font-mono text-[8px] uppercase tracking-[0.3em]"
                        style={{
                          color: active ? "var(--ds-accent)" : "var(--ds-text-muted)",
                          textDecoration: active ? "underline" : "none",
                          textUnderlineOffset: "0.35rem",
                        }}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              )}
              <div>
                {filteredSupporting.map((item) => (
                  <EditorialRow key={item.slug} item={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {series.length === 0 && filteredSupporting.length === 0 && !flagship ? (
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="border px-6 py-16 text-center" style={{ borderColor: "var(--ds-border)" }}>
              <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text-subtle)" }}>
                No publications indexed yet
              </p>
            </div>
          </div>
        ) : null}

      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const items = getPublicationCatalogue();
  const flagship = items.find((item) => item.slug === "ultimate-purpose-of-man") || items[0] || null;
  const series = getEditorialSeriesCatalogue();
  return { props: { items, flagship, series }, revalidate: 1800 };
};

export default EditorialLibrary;
