/* pages/lexicon/[slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetStaticPaths, GetStaticPropsContext, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";
import { normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";

type LexiconPageProps = {
  entry: {
    title: string;
    slug: string;
    description: string | null;
    category: string | null;
    date: string | null;
    tags: string[];
    relatedTerms: Array<{ title: string; slug: string }>;
  };
  bodyCode: string;
};

function lexiconBareSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");

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

function isLexiconDoc(doc: any): boolean {
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const source = String(doc?._raw?.sourceFilePath || "").toLowerCase();
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();
  const collectionSlug = String(doc?.collectionSlug || "").toLowerCase();
  const href = String(doc?.href || "").toLowerCase();
  const type = String(doc?.type || doc?.docKind || doc?.kind || "").toLowerCase();

  return (
    type === "lexicon" ||
    dir.includes("lexicon") ||
    flat.startsWith("lexicon/") ||
    source.startsWith("lexicon/") ||
    slug.startsWith("lexicon/") ||
    collectionSlug.startsWith("lexicon/") ||
    href.startsWith("/lexicon/")
  );
}

function relatedTermsFromDoc(doc: any): Array<{ title: string; slug: string }> {
  const raw =
    doc?.relatedTerms ||
    doc?.related ||
    doc?.terms ||
    doc?.seeAlso ||
    doc?.tags ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: any) => {
      const title =
        typeof item === "string"
          ? item
          : String(item?.title || item?.label || item?.name || item?.slug || "");
      const slug =
        typeof item === "string"
          ? item
          : String(item?.slug || item?.href || item?.title || item?.label || "");
      const bare = lexiconBareSlug(slug);
      return title.trim() && bare ? { title: title.trim(), slug: bare } : null;
    })
    .filter(Boolean) as Array<{ title: string; slug: string }>;
}

const LexiconEntryPage: NextPage<LexiconPageProps> = ({ entry, bodyCode }) => {
  return (
    <Layout
      title={`${entry.title} // Lexicon`}
      description={entry.description || `Lexicon entry: ${entry.title}`}
      canonicalUrl={`/lexicon/${entry.slug}`}
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black px-6 py-20 text-white md:px-10">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/lexicon"
            className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a96e]/80 transition hover:text-[#c9a96e]"
          >
            &larr; Lexicon
          </Link>

          <header className="mt-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#c9a96e]/80">
              LEXICON
            </p>
            <h1 className="mt-5 font-serif text-5xl font-light italic leading-tight text-white md:text-7xl">
              {entry.title}
            </h1>
            <div className="mt-8 h-px w-24 bg-[#c9a96e]" />
            {entry.description ? (
              <p className="mt-8 font-serif text-2xl font-light leading-[1.7] text-white/60">
                {entry.description}
              </p>
            ) : null}
          </header>

          <section className="lexicon-archive-body mt-14 font-serif text-xl font-light leading-[1.85] text-white/55">
            <ServerMDXRenderer code={bodyCode || ""} />
          </section>

          {entry.relatedTerms.length > 0 ? (
            <aside className="mt-16 border-t border-white/10 pt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a96e]/80">
                Related Terms
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {entry.relatedTerms.map((term) => (
                  <Link
                    key={`${term.slug}:${term.title}`}
                    href={`/lexicon/${term.slug}`}
                    className="border border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 transition hover:border-[#c9a96e]/60 hover:text-[#c9a96e]"
                  >
                    {term.title}
                  </Link>
                ))}
              </div>
            </aside>
          ) : null}
        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getAllLexicons, isDraftContent } = await import("@/lib/content/server");
  const docs = getAllLexicons() || [];
  const seen = new Set<string>();

  const paths = docs
    .filter((doc: any) => !isDraftContent(doc))
    .map((doc: any) => {
      const raw =
        doc?.urlSlug ||
        doc?.collectionSlug ||
        doc?.slug ||
        doc?._raw?.flattenedPath ||
        doc?._raw?.sourceFilePath ||
        "";
      const slug = lexiconBareSlug(raw);
      if (!slug || seen.has(slug)) return null;
      seen.add(slug);
      return { params: { slug } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const slug = lexiconBareSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`lexicon/${slug}`) ||
    getDocBySlug(`content/lexicon/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isLexiconDoc(doc)) {
    return { notFound: true };
  }

  const renderBody = getRenderableBody(doc);

  return {
    props: sanitizeData({
      entry: {
        title: doc.title || "Untitled Lexicon Entry",
        slug,
        description: doc.description || doc.excerpt || doc.summary || null,
        category: doc.category || "Lexicon",
        date: doc.date || null,
        tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
        relatedTerms: relatedTermsFromDoc(doc).filter((term) => term.slug !== slug),
      },
      bodyCode: String(renderBody?.code || ""),
    }),
    revalidate: 3600,
  };
};

export default LexiconEntryPage;
