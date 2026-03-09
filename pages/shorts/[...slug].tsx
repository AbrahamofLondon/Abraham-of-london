/* pages/shorts/[...slug].tsx — Catch-all (supports nested slugs, normalised) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { sanitizeData } from "@/lib/content/server";
import { getMdxDocumentBySlug } from "@/lib/server/mdx-collections";

type Props = { item: any };

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : String(param);
}

/**
 * Normalise any short slug to the content-relative form expected by the loader.
 *
 * Examples:
 *   "/shorts/when-x" -> "when-x"
 *   "shorts/when-x"  -> "when-x"
 *   "/when-x/"       -> "when-x"
 *   "when-x"         -> "when-x"
 */
function normalizeShortSlug(input: string): string {
  return String(input)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//, "");
}

const ShortsSlugPage: NextPage<Props> = ({ item }) => {
  const title = item?.title || "Short";
  const canonicalSlug = normalizeShortSlug(item?.slug || "");

  return (
    <Layout title={title} description={item?.description || item?.excerpt || ""}>
      <Head>
        <link
          rel="canonical"
          href={`https://www.abrahamoflondon.org/shorts/${canonicalSlug}`}
        />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/shorts"
            className="text-xs font-mono uppercase tracking-widest text-amber-400/80 hover:text-amber-300"
          >
            ← Back to Shorts
          </Link>

          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>

          <article className="prose prose-invert prose-lg mt-12 max-w-none">
            {item?.bodyCode ? (
              <SafeMDXRenderer code={item.bodyCode} />
            ) : (
              <div className="text-white/70">Content not compiled. (bodyCode missing)</div>
            )}
          </article>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const rawSlug = joinParamSlug(params?.slug as string | string[] | undefined);
  const slug = normalizeShortSlug(rawSlug);

  if (!slug) return { notFound: true };

  const doc = await getMdxDocumentBySlug("shorts", slug);
  if (!doc || (doc as any).draft === true) return { notFound: true };

  const item = {
    ...doc,
    // Always expose the clean, route-safe slug to the page
    slug: normalizeShortSlug((doc as any).slug || slug),
    bodyCode: (doc as any).body?.code ?? (doc as any).bodyCode ?? null,
  };

  return {
    props: sanitizeData({ item }),
    revalidate: 1800,
  };
};

export default ShortsSlugPage;