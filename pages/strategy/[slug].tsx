import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllStrategies, 
  getStrategyBySlug, 
  normalizeSlug 
} from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { strategy: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  // Use the robust helper to get all published strategies
  const docs = getAllStrategies();
  
  const paths = docs
    .map((d) => {
      const slug = normalizeSlug(d);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  // Use the robust helper to find by slug
  const strategy = getStrategyBySlug(slug);
  
  if (!strategy) return { notFound: true };

  const raw = strategy?.body?.raw ?? "";
  let source;
  
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`[Strategy Serialize Error] ${slug}:`, err);
    source = await serialize("This strategy framework is currently being updated.");
  }

  return { props: { strategy, source }, revalidate: 1800 };
};

const StrategyPage: NextPage<Props> = ({ strategy, source }) => {
  const title = strategy.title ?? "Strategy Framework";

  return (
    <Layout title={title}>
      <Head>
        {strategy.excerpt && <meta name="description" content={strategy.excerpt} />}
        <title>{title} | Strategy | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-12 space-y-3 border-b border-gold/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Strategic Framework
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {strategy.subtitle && (
            <p className="text-lg text-gray-400 font-light italic">{strategy.subtitle}</p>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold prose-strong:text-gold/90">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default StrategyPage;
