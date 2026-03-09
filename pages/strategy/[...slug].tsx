/* pages/strategy/[...slug].tsx — Strategy detail (catch-all, nested slugs, PAGES ROUTER SAFE) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

type Props = { item: any };

function jsonSafe<T>(v: T): T {
  // Deterministic, strips undefined, avoids Next serialization landmines.
  return JSON.parse(JSON.stringify(v, (_k, val) => (val === undefined ? null : val)));
}

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : String(param);
}

function cleanPathish(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

const StrategySlugPage: NextPage<Props> = ({ item }) => {
  const title = safeStr(item?.title, "Strategy");
  const desc = safeStr(item?.description || item?.excerpt, "");
  const og = safeStr(item?.coverImage, "") || undefined;

  const slug = cleanPathish(item?.slug || "");
  const canonical = `${SITE}/strategy/${encodeURIComponent(slug)}`;

  const code = safeStr(item?.bodyCode || item?.body?.code || item?.bodyCodeRaw || "", "");

  return (
    <Layout title={title} description={desc} ogImage={og}>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/strategy"
            className="text-xs font-mono uppercase tracking-widest text-amber-400/80 hover:text-amber-300"
          >
            ← Back to Strategy
          </Link>

          <h1 className="mt-6 text-4xl md:text-5xl font-serif font-bold tracking-tight">{title}</h1>

          {item?.excerpt ? (
            <p className="mt-6 text-white/70 leading-relaxed border-l-2 border-amber-500/40 pl-5">
              {String(item.excerpt)}
            </p>
          ) : null}

          <article className="prose prose-invert prose-lg max-w-none mt-12">
            {code ? (
              <SafeMDXRenderer code={code} />
            ) : (
              <div className="text-white/70">Content not compiled. (body code missing)</div>
            )}
          </article>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Optional: prebuild strategy paths to reduce blocking SSR hits.
  // This stays build-safe because the import is inside the function.
  try {
    const { getPublishedStrategies } = await import("@/lib/server/strategies-data");
    const list = await getPublishedStrategies();

    const paths = (list || [])
      .map((s: any) => cleanPathish(s?.slug || ""))
      .filter(Boolean)
      .map((slug) => ({ params: { slug: slug.split("/").filter(Boolean) } }));

    // Dedup
    const seen = new Set<string>();
    const deduped = paths.filter((p) => {
      const key = p.params.slug.join("/");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { paths: deduped, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanPathish(joinParamSlug(params?.slug as any));
  if (!slug) return { notFound: true, revalidate: 300 };

  // ✅ Server-only module imported ONLY inside SSG
  const { getStrategyBySlug } = await import("@/lib/server/strategies-data");

  const doc = await getStrategyBySlug(slug);
  if (!doc || (doc as any).draft === true || (doc as any).published === false) {
    return { notFound: true, revalidate: 300 };
  }

  // Ensure compiled MDX code is present under item.bodyCode
  const bodyCode =
    safeStr((doc as any)?.body?.code, "") ||
    safeStr((doc as any)?.bodyCode, "") ||
    "";

  const item = {
    ...doc,
    slug, // canonical route slug
    bodyCode, // what the page renders
  };

  return {
    props: jsonSafe({ item }),
    revalidate: 1800,
  };
};

export default StrategySlugPage;