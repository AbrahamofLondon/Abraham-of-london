/* pages/lexicon/index.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { normalizeSlug } from "@/lib/content/shared";

type LexiconIndexProps = {
  entries: Array<{
    title: string;
    slug: string;
    description: string | null;
  }>;
};

function lexiconBareSlug(input: unknown): string {
  const raw = String(input ?? "");

  const s = normalizeSlug(raw)
    .replace(/^content\//i, "")
    .replace(/^vault\//i, "")
    .replace(/^lexicon\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "");

  if (!s || s.includes("..")) return "";

  const parts = s.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

const LexiconIndexPage: NextPage<LexiconIndexProps> = ({ entries }) => {
  return (
    <Layout
      title="Lexicon // Abraham of London"
      description="Public lexicon of Abraham of London terms."
      canonicalUrl="/lexicon"
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <main className="min-h-screen bg-black px-6 py-20 text-white md:px-10">
        <section className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#c9a96e]/80">
            LEXICON
          </p>
          <h1 className="mt-5 font-serif text-5xl font-light italic leading-tight text-white md:text-7xl">
            Lexicon
          </h1>
          <div className="mt-8 h-px w-24 bg-[#c9a96e]" />
          <p className="mt-8 max-w-2xl font-serif text-2xl font-light leading-[1.7] text-white/55">
            Terms of order, authority, legacy, and governance used throughout
            the Abraham of London archive.
          </p>

          <div className="mt-14 divide-y divide-white/10 border-y border-white/10">
            {entries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/lexicon/${entry.slug}`}
                className="grid gap-3 py-7 transition hover:bg-white/[0.025] md:grid-cols-[220px_1fr] md:gap-10"
              >
                <h2 className="font-serif text-3xl font-light italic leading-tight text-white">
                  {entry.title}
                </h2>
                <p className="font-serif text-xl font-light leading-[1.85] text-white/55">
                  {entry.description || "Lexicon entry from the Abraham of London archive."}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const { getAllLexicons, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const entries = (getAllLexicons() || [])
    .filter((doc: any) => !isDraftContent(doc))
    .map((doc: any) => {
      const raw =
        doc?.urlSlug ||
        doc?.collectionSlug ||
        doc?.slug ||
        doc?._raw?.flattenedPath ||
        doc?._raw?.sourceFilePath ||
        "";

      return {
        title: doc.title || "Untitled Lexicon Entry",
        slug: lexiconBareSlug(raw),
        description: doc.description || doc.excerpt || doc.summary || null,
      };
    })
    .filter((entry: any) => entry.slug)
    .sort((a: any, b: any) => a.title.localeCompare(b.title));

  return {
    props: sanitizeData({ entries }),
    revalidate: 3600,
  };
};

export default LexiconIndexPage;
