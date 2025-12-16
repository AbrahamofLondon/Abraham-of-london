import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getPublishedShorts } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { short: any; source: MDXRemoteSerializeResult };

function docSlug(d: any): string {
  return d?.slug ?? d?._raw?.flattenedPath?.split("/").pop() ?? "";
}

// THEME → COVER MAPPING (your exact themes)
const SHORT_THEME_COVERS: Record<string, string> = {
  "inner-life": "/assets/images/shorts/default-cover-1.jpg",
  "outer-life": "/assets/images/shorts/default-cover-2.jpg",
  "hard-truths": "/assets/images/shorts/default-cover-3.jpg",
  "gentle": "/assets/images/shorts/default-cover.jpg",
  "purpose": "/assets/images/shorts/cover-linkedin.jpg",
  "relationships": "/assets/images/shorts/cover-instagram.jpg",
  "faith": "/assets/images/shorts/cover.jpg",
};

// Global fallback you demanded
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

function resolveShortCover(short: any): string {
  // explicit coverImage always wins if provided
  const explicit = typeof short?.coverImage === "string" ? short.coverImage.trim() : "";
  if (explicit) return explicit.startsWith("/") ? explicit : `/${explicit}`;

  const theme = String(short?.theme ?? "").trim().toLowerCase();
  return SHORT_THEME_COVERS[theme] ?? SHORT_GLOBAL_FALLBACK;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getPublishedShorts();
  const paths = docs.map((d) => ({ params: { slug: docSlug(d) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const docs = getPublishedShorts();
  const short = docs.find((d) => docSlug(d) === slug);
  if (!short) return { notFound: true };

  const raw = short?.body?.raw ?? "";
  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return { props: { short, source }, revalidate: 1800 };
};

const ShortPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  short,
  source,
}) => {
  const title = short.title ?? "Short";
  const cover = resolveShortCover(short);

  return (
    <Layout title={title} ogImage={cover}>
      <Head>
        {short.excerpt && <meta name="description" content={short.excerpt} />}
        <meta property="og:title" content={title} />
        {short.excerpt && <meta property="og:description" content={short.excerpt} />}
        {cover ? <meta property="og:image" content={cover} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Short · {short.theme ?? "General"}
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
          {short.excerpt ? <p className="text-sm text-gray-300">{short.excerpt}</p> : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default ShortPage;