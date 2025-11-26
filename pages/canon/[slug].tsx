// pages/canon/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { ParsedUrlQuery } from "querystring";
import * as React from "react";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import SiteLayout from "@/components/SiteLayout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

interface Params extends ParsedUrlQuery {
  slug: string;
}

interface CanonPageProps {
  meta: PostMeta;
  mdxSource: MDXRemoteSerializeResult;
}

// ----------------------------------------------------------------------
// Page component
// ----------------------------------------------------------------------

const CanonPage: NextPage<CanonPageProps> = ({ meta, mdxSource }) => {
  const { title, excerpt, description, date } = meta;

  const metaDescription =
    excerpt ||
    description ||
    "Canon document from Abraham of London.";

  const displayDate =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <SiteLayout pageTitle={title} metaDescription={metaDescription}>
      <article className="prose prose-invert prose-lg mx-auto max-w-3xl py-10 md:py-16 prose-headings:font-serif prose-headings:text-cream prose-strong:text-cream prose-a:text-softGold">
        <header className="mb-8 border-b border-gray-700 pb-4">
          <h1 className="font-serif text-3xl font-bold text-cream md:text-4xl">
            {title}
          </h1>
          {displayDate && (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">
              {displayDate}
            </p>
          )}
        </header>

        <MDXRemote {...mdxSource} components={mdxComponents} />
      </article>
    </SiteLayout>
  );
};

export default CanonPage;

// ----------------------------------------------------------------------
// Static generation
// ----------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  // This assumes /content/canon/*.mdx and that getAllContent knows "canon"
  const canonItems = await getAllContent("canon");

  const paths =
    canonItems?.map((doc: { slug: string }) => ({
      params: { slug: doc.slug },
    })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<CanonPageProps, Params> = async ({
  params,
}) => {
  if (!params?.slug) {
    return { notFound: true };
  }

  const doc = await getContentBySlug("canon", params.slug);

  if (!doc) {
    return { notFound: true };
  }

  const { meta, content } = doc;

  // 🔧 Strip import lines from MDX before serialisation (Callout, Divider, etc.)
  const rawContent = content ?? "";
  const cleanContent = rawContent
    .replace(
      /^import\s+.*?\s+from\s+["'][^"']+["'];?\s*$/gm,
      "",
    )
    .trim();

  const mdxSource = await serialize(cleanContent, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [],
    },
  });

  // Defensive: ensure meta is JSON-serialisable
  const safeMeta = JSON.parse(JSON.stringify(meta)) as PostMeta;

  return {
    props: {
      meta: safeMeta,
      mdxSource,
    },
  };
};