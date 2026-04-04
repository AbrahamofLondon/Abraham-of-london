/* pages/editorials/index.tsx — EDITORIAL LIBRARY (Flagship Presentation) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ScrollText,
  ArrowRight,
  BookOpen,
  FileText,
  Download,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPublicationCatalogue } from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";

type Props = {
  items: PublicationRecord[];
};

const EditorialLibrary: NextPage<Props> = ({ items }) => {
  return (
    <Layout
      title="Editorials | Abraham of London"
      description="Books, flagship editorials, strategic papers, and institutional publications."
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
              Canonical essays, flagship editorials, strategic papers, and formal publications.
              This is written property, not content sludge.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          {items.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
                No publications indexed
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="group rounded-[2rem] border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05]"
                >
                  <div className="p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85">
                        <BookOpen className="h-3.5 w-3.5" />
                        {item.category || "Editorial"}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
                        {item.tier}
                      </span>
                    </div>

                    <h2 className="mt-6 font-serif text-2xl leading-tight text-white transition-colors group-hover:text-amber-100">
                      {item.title}
                    </h2>

                    {item.subtitle ? (
                      <p className="mt-3 text-sm leading-relaxed text-white/55">
                        {item.subtitle}
                      </p>
                    ) : null}

                    {item.description ? (
                      <p className="mt-4 text-sm leading-relaxed text-white/68">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                      <span>{item.readingTime || "—"}</span>
                      <span className="h-1 w-1 rounded-full bg-white/15" />
                      <span>{item.date || "—"}</span>
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      items: getPublicationCatalogue(),
    },
    revalidate: 1800,
  };
};

export default EditorialLibrary;