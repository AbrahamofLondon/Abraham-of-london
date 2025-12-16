import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllPrints } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { print: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return d?.slug ?? d?._raw?.flattenedPath?.split("/").pop() ?? "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllPrints();
  const paths = docs.map((d) => ({ params: { slug: docSlug(d) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const docs = getAllPrints();
  const print = docs.find((d) => docSlug(d) === slug);
  if (!print) return { notFound: true };

  const raw = print?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { print, source }, revalidate: 1800 };
};

const PrintPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  print,
  source,
}) => {
  const title = print.title ?? "Print";
  return (
    <Layout title={title}>
      <Head>
        {print.excerpt && <meta name="description" content={print.excerpt} />}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Print
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

export default PrintPage;