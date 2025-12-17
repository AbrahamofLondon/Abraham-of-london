import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getAllPrints, 
  getPrintBySlug, 
  normalizeSlug 
} from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { print: any; source: any };

export const getStaticPaths: GetStaticPaths = async () => {
  // Use robust helper to fetch all published prints
  const docs = getAllPrints();
  
  const paths = docs
    .map((d) => {
      const slug = normalizeSlug(d);
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  // Use robust helper for consistent by-slug lookup
  const print = getPrintBySlug(slug);
  
  if (!print) return { notFound: true };

  const raw = print?.body?.raw ?? "";
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
    console.error(`[Print Serialize Error] ${slug}:`, err);
    source = await serialize("Content for this print is being prepared.");
  }

  return { props: { print, source }, revalidate: 1800 };
};

const PrintPage: NextPage<Props> = ({ print, source }) => {
  const title = print.title ?? "Print";

  return (
    <Layout title={title}>
      <Head>
        {print.excerpt && <meta name="description" content={print.excerpt} />}
        <title>{title} | Prints | Abraham of London</title>
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-10 space-y-4 border-b border-gold/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Exclusive Print
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {print.price && (
            <p className="text-lg font-medium text-gold/90">{print.price}</p>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold prose-img:rounded-2xl">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>

        {/* Optional: Add a 'Contact for Purchase' or 'Download' area if applicable */}
      </main>
    </Layout>
  );
};

export default PrintPage;