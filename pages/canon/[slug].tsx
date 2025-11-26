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

  // Optional: formatted date for display
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
      <article className="mx-auto max-w-3xl py-10 md:py-16 prose prose-invert prose-lg prose-headings:font-serif prose-headings:text-cream prose-strong:text-cream prose-a:text-softGold">
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
  // Assumes your MDX helper knows about the "canon" folder
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

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
    },
  });

  return {
    props: {
      meta,
      mdxSource,
    },
  };
};