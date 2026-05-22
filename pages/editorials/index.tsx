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

// All color references use --ds-* tokens from design-system.css

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ width: 1, height: 18, backgroundColor: "var(--ds-accent-soft)", display: "inline-block" }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "var(--ds-accent)",
        }}
      >
        {children}
      </span>
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

const EditorialLibrary: NextPage<Props> = ({ items, flagship, series }) => {
  const [activeCategory, setActiveCategory] = React.useState("");

  const categories = React.useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [items]);

  const supporting = React.useMemo(
    () => items.filter((item) => item.slug !== flagship?.slug),
    [items, flagship?.slug]
  );

  const filteredSupporting = React.useMemo(() => {
    if (!activeCategory) return supporting;
    return supporting.filter((i) => i.category === activeCategory);
  }, [supporting, activeCategory]);

  const showFlagship = flagship && (!activeCategory || flagship.category === activeCategory);

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

      <main style={{ backgroundColor: "var(--ds-background)", minHeight: "100vh", color: "white" }}>
        <section style={{ backgroundColor: "var(--ds-background-muted)", borderBottom: "1px solid var(--ds-border)" }}>
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-20 lg:px-10 lg:pb-10 lg:pt-24">
            <Eyebrow>EDITORIALS · PUBLISHED ARGUMENTS</Eyebrow>

            <h1
              className="mt-6 max-w-3xl font-serif italic"
              style={{
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                lineHeight: 0.98,
                color: "var(--ds-text)",
              }}
            >
              The public intellectual record.
            </h1>

            <p
              className="mt-5 font-mono text-[8px] uppercase tracking-[0.34em]"
              style={{ color: "var(--ds-text-subtle)" }}
            >
              Long-form arguments, formal publication records, and preserved public reasoning.
            </p>
            <p
              className="mt-3 max-w-2xl text-sm leading-6"
              style={{ color: "var(--ds-text-muted)" }}
            >
              This layer gives operators the reasoning behind the diagnostic system before they act on the signal.
            </p>

            <div className="mt-6 h-px w-full" style={{ backgroundColor: "var(--ds-border)" }} />

            {categories.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
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
            ) : null}
          </div>
        </section>

        {series.length > 0 ? (
          <section
            className="border-b py-10 lg:py-12"
            style={{ borderBottomColor: "var(--ds-border)" }}
          >
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <div className="mb-5 font-mono text-[7.5px] uppercase tracking-[0.34em]" style={{ color: "var(--ds-accent)" }}>
                Editorial Series
              </div>

              <div className="divide-y" style={{ borderTop: "1px solid var(--ds-border)", borderBottom: "1px solid var(--ds-border)" }}>
                {series.map((item) => (
                  <Link
                    key={item.id}
                    href={`/editorials/series/${item.slug}`}
                    className="group grid gap-4 py-6 transition-colors md:grid-cols-[minmax(0,1fr)_auto]"
                    style={{ borderColor: "var(--ds-border)" }}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 font-mono text-[7px] uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
                        <span>{item.partCount} parts</span>
                        <span style={{ color: "var(--ds-border)" }}>·</span>
                        <span>{item.status}</span>
                      </div>
                      <h2
                        className="mt-3 w-fit border-b border-transparent font-serif text-[1.8rem] leading-none transition-colors duration-200 group-hover:border-[#C9963A]/70 group-hover:text-white"
                        style={{ color: "var(--ds-text)", fontWeight: 300 }}
                      >
                        {item.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--ds-text-muted)" }}>
                        {item.descriptor}
                      </p>
                    </div>
                    <div className="self-center font-mono text-[7.5px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-accent)" }}>
                      Open series
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            {showFlagship ? (
              <div className="mb-10 border-b pb-8" style={{ borderBottomColor: "var(--ds-border)" }}>
                <div className="mb-4 font-mono text-[7px] uppercase tracking-[0.34em]" style={{ color: "var(--ds-accent)" }}>
                  Flagship publication
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-[7px] font-mono uppercase tracking-[0.28em]" style={{ color: "var(--ds-text-subtle)" }}>
                      <span>{formatDate(flagship.date)}</span>
                      <span style={{ color: "var(--ds-border)" }}>·</span>
                      <span style={{ color: "var(--ds-accent)" }}>{flagship.category || "Editorial"}</span>
                      <span style={{ color: "var(--ds-border)" }}>·</span>
                      <span>{readTime(flagship.readingTime)}</span>
                    </div>

                    <h2 className="mt-4 max-w-4xl font-serif text-[2rem] italic" style={{ color: "var(--ds-text)", lineHeight: 1.02, fontWeight: 300 }}>
                      {flagship.title}
                    </h2>

                    {(flagship.subtitle || flagship.description) ? (
                      <p className="mt-3 max-w-3xl text-[13px] leading-[1.55rem]" style={{ color: "var(--ds-text-muted)" }}>
                        {flagship.description || flagship.subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="border px-5 py-5" style={{ borderColor: "var(--ds-border)", backgroundColor: "var(--ds-panel)" }}>
                    <div className="font-mono text-[7px] uppercase tracking-[0.32em]" style={{ color: "var(--ds-text-subtle)" }}>
                      Publication record
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Content ID", flagship.contentId || "—"],
                        ["Author", flagship.author || "—"],
                        ["Tier", flagship.tier || "—"],
                        ["Version", flagship.version || "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-3 border-b pb-2" style={{ borderBottomColor: "var(--ds-border)" }}>
                          <span className="font-mono text-[6.5px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text-subtle)" }}>{label}</span>
                          <span className="font-mono text-[7px] uppercase tracking-[0.16em]" style={{ color: "var(--ds-text-muted)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/editorials/${flagship.slug}`}
                        className="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[7.5px] uppercase tracking-[0.28em]"
                        style={{ borderColor: "var(--ds-accent-soft)", color: "var(--ds-accent)", backgroundColor: "var(--ds-accent-soft)" }}
                      >
                        Open publication
                      </Link>
                      {flagship.pdfPath ? (
                        <a
                          href={flagship.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[7.5px] uppercase tracking-[0.28em]"
                          style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
                        >
                          <Download className="h-3 w-3" />
                          PDF edition
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {filteredSupporting.length > 0 ? (
              <div>
                {filteredSupporting.map((item) => (
                  <EditorialRow key={item.slug} item={item} />
                ))}
              </div>
            ) : null}

            {!showFlagship && filteredSupporting.length === 0 ? (
              <div className="border px-6 py-16 text-center" style={{ borderColor: "var(--ds-border)" }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em]" style={{ color: "var(--ds-text-subtle)" }}>
                  No publications indexed yet
                </p>
              </div>
            ) : null}
          </div>
        </section>
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
