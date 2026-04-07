/* pages/editorials/index.tsx — EDITORIAL LIBRARY (Production Grade) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ScrollText,
  ArrowRight,
  BookOpen,
  Download,
  Eye,
  Quote,
  ExternalLink,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublicationCatalogue } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

type Props = {
  items: PublicationRecord[];
  flagship: PublicationRecord | null;
};

function Hairline() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[30px] border border-white/12 bg-white/[0.04]",
        "shadow-[0_35px_95px_-60px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        {children}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300">
      {children}
    </div>
  );
}

function PublicationCard({ item }: { item: PublicationRecord }) {
  const previewHref =
    item.previewEnabled && item.previewPath
      ? item.previewPath
      : item.previewEnabled
        ? `/api/editorials/preview/${item.slug}`
        : null;

  return (
    <Panel>
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <Flag>
            <BookOpen className="h-3.5 w-3.5" />
            {item.category || "Editorial"}
          </Flag>

          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
            {item.tier}
          </span>
        </div>

        <h2 className="mt-6 font-serif text-2xl leading-tight text-white">
          {item.title}
        </h2>

        {item.subtitle ? (
          <p className="mt-3 text-sm leading-relaxed text-white/58">
            {item.subtitle}
          </p>
        ) : null}

        {item.description ? (
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {item.description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/38">
          {item.readingTime ? <span>{item.readingTime}</span> : null}
          {item.date ? <span>{item.date}</span> : null}
          <span>{item.author}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/editorials/${item.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/85 transition-all hover:bg-white/[0.10]"
          >
            Open Page
            <ArrowRight className="h-4 w-4" />
          </Link>

          {item.pdfPath ? (
            <a
              href={item.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300 transition-all hover:bg-amber-500/18"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          ) : null}

          {previewHref ? (
            <a
              href={previewHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/[0.10]"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

const EditorialLibrary: NextPage<Props> = ({ items, flagship }) => {
  const supporting = items.filter((item) => item.slug !== flagship?.slug);

  return (
    <Layout
      title="Editorials | Abraham of London"
      description="Books, flagship editorials, strategic papers, previews, citations, and formal publications."
      canonicalUrl="/editorials"
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <title>Editorials | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden border-b border-white/5 px-6 pb-20 pt-28 md:pt-36">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.07),transparent_40%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.36em] text-amber-300/90">
              <ScrollText className="h-4 w-4" />
              Editorial Canon
            </div>

            <h1 className="mt-6 max-w-5xl font-serif text-5xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
              Books, Editorials
              <span className="ml-3 italic text-amber-200/90">& Papers.</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/65">
              Canonical essays, flagship editorials, preview routes, citation-grade pages,
              and formal publications. This is written property, not content sludge.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          {flagship ? (
            <div className="mb-16">
              <div className="mb-6 text-[10px] font-mono uppercase tracking-[0.34em] text-white/50">
                Flagship Publication
              </div>

              <Panel>
                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="border-b border-white/8 p-7 md:p-10 lg:border-b-0 lg:border-r">
                    <Flag>
                      <Quote className="h-3.5 w-3.5" />
                      Featured Record
                    </Flag>

                    <h2 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.04] text-white md:text-5xl">
                      {flagship.title}
                    </h2>

                    {flagship.subtitle ? (
                      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-amber-100/78">
                        {flagship.subtitle}
                      </p>
                    ) : null}

                    {flagship.description ? (
                      <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/72">
                        {flagship.description}
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
                      {flagship.category ? <span>{flagship.category}</span> : null}
                      {flagship.readingTime ? <span>{flagship.readingTime}</span> : null}
                      {flagship.date ? <span>{flagship.date}</span> : null}
                      <span>{flagship.author}</span>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href={`/editorials/${flagship.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300 transition-all hover:bg-amber-500/18"
                      >
                        Open Publication
                        <ArrowRight className="h-4 w-4" />
                      </Link>

                      {flagship.pdfPath ? (
                        <a
                          href={flagship.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.32em] text-white/85 transition-all hover:bg-white/[0.10]"
                        >
                          <Download className="h-4 w-4" />
                          Open PDF
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-7 md:p-10">
                    <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/50">
                      Surfaces
                    </div>

                    <div className="mt-5 space-y-5">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/85">
                          Page
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-white/68">
                          Every publication receives a proper page, not just a file link.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/85">
                          Citation
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-white/68">
                          Each record carries structured citation metadata and an endpoint.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/85">
                          Preview
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-white/68">
                          Editorials can be previewed without forcing the user straight into a binary.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/editorials/${flagship.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/[0.08]"
                        >
                          Detail Page
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <a
                          href={`/api/editorials/citation/${flagship.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/[0.08]"
                        >
                          Citation JSON
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          ) : null}

          <div className="mb-8">
            <Hairline />
          </div>

          {supporting.length === 0 && !flagship ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
                No publications indexed
              </p>
            </div>
          ) : supporting.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {supporting.map((item) => (
                <PublicationCard key={item.slug} item={item} />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const items = getPublicationCatalogue();
  const flagship =
    items.find((item) => item.slug === "ultimate-purpose-of-man") || items[0] || null;

  return {
    props: {
      items,
      flagship,
    },
    revalidate: 1800,
  };
};

export default EditorialLibrary;