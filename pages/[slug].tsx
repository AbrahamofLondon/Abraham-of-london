// pages/[slug].tsx
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";
import ArticleHero from "@/components/ArticleHero";

type CoverAspect = "book" | "wide" | "square";
type CoverFit = "cover" | "contain";

type PageMeta = PostMeta & {
  coverAspect?: CoverAspect;
  coverFit?: CoverFit;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

const COLLECTION_KEY = "pages";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------

function ContentPage({ meta, mdxSource }: PageProps): JSX.Element {
  const {
    slug,
    title,
    description,
    excerpt,
    category,
    tags,
    date,
    readTime,
    coverImage,
    coverAspect,
    coverFit,
  } = meta;

  const displaySubtitle = excerpt || description || undefined;

  const primaryCategory =
    category ||
    (Array.isArray(tags) && tags.length > 0 ? String(tags[0]) : "Article");

  const canonicalTitle = title || "Abraham of London";
  const displayDescription = description || excerpt || "";
  const canonicalPath = slug ? `/${slug}` : "";
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return (
    <Layout title={canonicalTitle}>
      <Head>
        <title>{canonicalTitle} | Abraham of London</title>
        {displayDescription && (
          <meta name="description" content={displayDescription} />
        )}
        {canonicalPath && (
          <link rel="canonical" href={canonicalUrl} />
        )}
      </Head>

      <ArticleHero
        title={title}
        subtitle={displaySubtitle}
        category={primaryCategory}
        date={date}
        readTime={readTime}
        coverImage={coverImage as string | undefined}
        coverAspect={coverAspect}
        coverFit={coverFit}
      />

      <main>
        <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 lg:px-0">
          <div
            className={`
              prose prose-lg prose-invert prose-lux max-w-none
              prose-headings:font-serif prose-headings:text-cream
              prose-p:text-slate-100 prose-p:leading-relaxed
              prose-strong:text-cream prose-strong:font-semibold
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-ul:text-slate-100 prose-ol:text-slate-100
              prose-blockquote:border-l-softGold prose-blockquote:text-slate-100
              prose-hr:border-t prose-hr:border-white/10
              prose-img:rounded-xl prose-img:shadow-lg
            `}
          >
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </div>
        </article>
      </main>
    </Layout>
  );
}

export default ContentPage;

// -----------------------------------------------------------------------------
// SSG – paths
// -----------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const items = getAllContent(COLLECTION_KEY) ?? [];

    const paths =
      items
        .filter((item: any) => item?.slug)
        .map((item: any) => ({
          params: { slug: String(item.slug) },
        })) ?? [];

    return {
      paths,
      fallback: "blocking",
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error generating static paths for /[slug]:", err);
    return { paths: [], fallback: "blocking" };
  }
};

// -----------------------------------------------------------------------------
// SSG – props
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slugParam = params?.slug;
    const slug =
      typeof slugParam === "string"
        ? slugParam
        : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

    if (!slug) return { notFound: true };

    const data = getContentBySlug(COLLECTION_KEY, slug, {
      withContent: true,
    }) as (PageMeta & { content?: string }) | null;

    if (!data) return { notFound: true };

    const { content = "", ...meta } = data;

    if (!meta.title) return { notFound: true };

    // Ensure meta is JSON-serialisable
    const jsonSafeMeta = JSON.parse(JSON.stringify(meta)) as PageMeta;

    const mdxSource = await serialize(content, {
      scope: jsonSafeMeta as unknown as Record<string, unknown>,
    });

    return {
      props: {
        meta: { ...jsonSafeMeta, slug },
        mdxSource,
      },
      revalidate: 3600,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /[slug]:", err);
    return { notFound: true };
  }
};