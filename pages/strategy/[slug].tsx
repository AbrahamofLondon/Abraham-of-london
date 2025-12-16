import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllStrategies } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { strategy: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return d?.slug ?? d?._raw?.flattenedPath?.split("/").pop() ?? "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllStrategies();
  const paths = docs.map((d) => ({ params: { slug: docSlug(d) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const docs = getAllStrategies();
  const strategy = docs.find((d) => docSlug(d) === slug);
  if (!strategy) return { notFound: true };

  const raw = strategy?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { strategy, source }, revalidate: 1800 };
};

const StrategyPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  strategy,
  source,
}) => {
  const title = strategy.title ?? "Strategy";

  return (
    <Layout title={title}>
      <Head>
        {strategy.excerpt && <meta name="description" content={strategy.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Strategy
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default StrategyPage;