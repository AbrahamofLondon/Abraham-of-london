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
  const { title, excerpt, coverImage, date } = meta;
  const metaDescription =
    excerpt || meta.description || "Canon document from Abraham of London.";

  return (
    <SiteLayout
      pageTitle={title}
      metaDescription={metaDescription}
      coverImage={coverImage}
      date={date}
    >
      <article className="prose prose-invert prose-lg max-w-3xl mx-auto py-10 md:py-16 prose-headings:font-serif prose-headings:text-cream prose-strong:text-cream prose-a:text-softGold">
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
  // assumes your MDX helper already knows about the "canon" folder
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