// pages/canon/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllCanons, getCanonDocBySlug } from "@/lib/canon";
import type { Canon } from "@/lib/canon";

type Props = {
  canon: {
    title: string;
    excerpt: string | null;
    subtitle: string | null;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

function cleanSlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");
}

function safeTitle(v: unknown): string {
  const s = String(v ?? "").trim();
  return s || "Canon";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const canons: Canon[] = getAllCanons();

  const paths = canons
    .filter((c) => c && c.draft !== true && c.draft !== "true")
    .map((c) => cleanSlug(c.slug || c._raw?.flattenedPath?.split("/").pop()))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  console.log(`📚 Canon: Generated ${paths.length} paths`);

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  const rawDoc = getCanonDocBySlug(slug);

  if (!rawDoc) {
    console.warn(`⚠️ Canon not found for slug: ${slug}`);
    return { notFound: true, revalidate: 60 };
  }

  if (rawDoc.draft === true || rawDoc.draft === "true") {
    // hard block draft pages from being published
    return { notFound: true, revalidate: 60 };
  }

  const canon = {
    title: safeTitle(rawDoc.title),
    excerpt: rawDoc.excerpt ? String(rawDoc.excerpt) : null,
    subtitle: rawDoc.subtitle ? String(rawDoc.subtitle) : null,
    slug,
  };

  // Contentlayer2 exposes raw MDX via body.raw (your earlier usage)
  const raw = String(rawDoc?.body?.raw ?? "");
  let source: MDXRemoteSerializeResult;

  try {
    source = await serialize(raw || "Content is being prepared.", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`❌ Failed to serialize MDX for canon: ${canon.title}`, err);
    source = await serialize("Content is being prepared.");
  }

  return {
    props: { canon, source },
    revalidate: 1800,
  };
};

const CanonPage: NextPage<Props> = ({ canon, source }) => {
  const title = canon.title || "Canon";
  const canonicalUrl = `${SITE}/canon/${canon.slug}`;

  return (
    <Layout title={title} canonicalUrl={canonicalUrl}>
      <Head>
        <title>{title} | Abraham of London</title>

        {canon.excerpt ? <meta name="description" content={canon.excerpt} /> : null}
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={title} />
        {canon.excerpt ? <meta property="og:description" content={canon.excerpt} /> : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {canon.excerpt ? <meta name="twitter:description" content={canon.excerpt} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon
          </p>

          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>

          {canon.subtitle ? <p className="text-lg text-gray-300">{canon.subtitle}</p> : null}
          {canon.excerpt ? <p className="text-sm text-gray-300">{canon.excerpt}</p> : null}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;