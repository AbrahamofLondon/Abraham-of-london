/* pages/shorts/[...slug].tsx — Catch-all (supports nested slugs, normalised) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { getAllCombinedDocs, normalizeSlug } from "@/lib/content/server";
import { cleanSlugForURL } from "@/lib/shorts/brand";

type Props = {
  item: {
    title: string;
    description: string;
    excerpt?: string;
    slug: string;
    bodyCode: string | null;
  };
};

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : String(param);
}

function safeStartsWith(v: unknown, prefix: string) {
  return typeof v === "string" && v.startsWith(prefix);
}

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function toShortUrlSlug(input: unknown) {
  return cleanSlugForURL(normalizeSlug(safeString(input)));
}

function toShortRouteParamSlug(input: unknown) {
  return toShortUrlSlug(input).replace(/^shorts\//, "");
}

const ShortsSlugPage: NextPage<Props> = ({ item }) => {
  const title = item?.title || "Short";
  const canonicalSlug = toShortRouteParamSlug(item?.slug || "");

  return (
    <Layout
      title={title}
      description={item?.description || item?.excerpt || ""}
      fullWidth
      headerTransparent={false}
      minimalHeader
      showFooter={false}
      enableVaultSearch={false}
    >
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
              <div className="space-y-2 text-white/70">
                <div>Content not compiled. (bodyCode missing)</div>
                <div className="text-xs font-mono text-white/40">
                  slug: {item?.slug || "unknown"}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allDocuments = getAllCombinedDocs() || [];
  const shorts = allDocuments.filter(
    (d: any) =>
      safeStartsWith(d?.slug, "shorts/") ||
      safeStartsWith(d?._raw?.flattenedPath, "shorts/")
  );

  const paths = shorts.map((s: any) => {
    const raw = s?.slug || s?._raw?.flattenedPath || "";
    const clean = toShortRouteParamSlug(raw);
    const slugArray = clean.split("/").filter(Boolean);
    return { params: { slug: slugArray } };
  });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const rawParam = joinParamSlug(params?.slug);
  const targetSlug = toShortRouteParamSlug(rawParam);
  if (!targetSlug) return { notFound: true };

  const allDocuments = getAllCombinedDocs() || [];
  const shorts = allDocuments.filter(
    (d: any) =>
      safeStartsWith(d?.slug, "shorts/") ||
      safeStartsWith(d?._raw?.flattenedPath, "shorts/")
  );

  const doc = shorts.find((d: any) => {
    const raw = d?.slug || d?._raw?.flattenedPath || "";
    const clean = toShortRouteParamSlug(raw);
    return clean === targetSlug;
  });

  if (!doc || (doc as any).draft === true) return { notFound: true };

  const bodyCode = (doc as any).body?.code ?? (doc as any).bodyCode ?? null;

  const item = {
    title: doc?.title ?? "Short",
    description: doc?.description ?? doc?.excerpt ?? "",
    excerpt: doc?.excerpt ?? "",
    slug: targetSlug,
    bodyCode,
  };

  return {
    props: { item },
    revalidate: 1800,
  };
};

export default ShortsSlugPage;