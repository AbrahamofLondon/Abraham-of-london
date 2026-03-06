/* pages/strategy/[...slug].tsx — Catch-all (supports nested slugs) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { sanitizeData } from "@/lib/content/server";
import { getStrategyBySlug } from "@/lib/server/strategies-data";

type Props = { item: any };

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : String(param);
}

const StrategySlugPage: NextPage<Props> = ({ item }) => {
  const title = item?.title || "Strategy";

  return (
    <Layout title={title} description={item?.description || item?.excerpt || ""} ogImage={item?.coverImage || undefined}>
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/strategy/${item.slug}`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link href="/strategy" className="text-xs font-mono uppercase tracking-widest text-amber-400/80 hover:text-amber-300">
            ← Back to Strategy
          </Link>

          <h1 className="mt-6 text-4xl md:text-5xl font-serif font-bold tracking-tight">{title}</h1>

          {item?.excerpt ? (
            <p className="mt-6 text-white/70 leading-relaxed border-l-2 border-amber-500/40 pl-5">
              {item.excerpt}
            </p>
          ) : null}

          <article className="prose prose-invert prose-lg max-w-none mt-12">
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
  const slug = joinParamSlug(params?.slug as any).trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return { notFound: true };

  const doc = await getStrategyBySlug(slug);
  if (!doc || (doc as any).draft === true) return { notFound: true };

  const item = {
    ...doc,
    slug,
    bodyCode: (doc as any).body?.code ?? (doc as any).bodyCode ?? null,
  };

  return { props: sanitizeData({ item }), revalidate: 1800 };
};

export default StrategySlugPage;