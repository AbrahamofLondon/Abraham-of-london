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

type PageMeta = PostMeta & {
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

const PRIMARY_COLLECTION = "posts"; // assume posts are the main root slugs

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------

function ContentPage({ meta, mdxSource }: PageProps): JSX.Element {
  const {
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

  return (
    <Layout title={canonicalTitle}>
      <Head>
        <title>{canonicalTitle} | Abraham of London</title>
        {displayDescription && (
          <meta name="description" content={displayDescription} />
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
              prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-slate-900
              prose-p:text-slate-800 prose-p:leading-relaxed
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-ul:text-slate-800 prose-ol:text-slate-800
              prose-blockquote:border-l-softGold prose-blockquote:text-slate-900
              prose-hr:border-t border-white/10
              prose-img:rounded-xl prose-img:shadow-lg

              dark:prose-headings:text-slate-50
              dark:prose-p:text-slate-100
              dark:prose-strong:text-slate-50
              dark:prose-ul:text-slate-100
              dark:prose-ol:text-slate-100
              dark:prose-blockquote:text-slate-50
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
    const items = getAllContent(PRIMARY_COLLECTION) ?? [];

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

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params,
}) => {
  try {
    const slugParam = params?.slug;
    const slug =
      typeof slugParam === "string"
        ? slugParam
        : Array.isArray(slugParam)
        ? slugParam[0]
        : "";

    if (!slug) return { notFound: true };

    // Try multiple collections defensively; ignore failures.
    const collectionsToTry = [
      "posts",     // main blog / insights
      "pages",     // essays / flat pages
      "prints",    // long-form PDFs (if any)
      "resources", // misc resources
    ];

    let data: (PageMeta & { content?: string }) | null = null;

    for (const key of collectionsToTry) {
      try {
        const candidate = getContentBySlug(key, slug, {
          withContent: true,
        }) as (PageMeta & { content?: string }) | null;

        if (candidate) {
          data = candidate;
          break;
        }
      } catch {
        // unknown collection key or other internal error – try next
      }
    }

    if (!data) {
      return { notFound: true };
    }

    const { content, ...meta } = data;

    if (!meta.title) return { notFound: true };

    const jsonSafeMeta = JSON.parse(JSON.stringify(meta)) as PageMeta;

    const mdxSource = await serialize(content || "", {
      scope: jsonSafeMeta as unknown as Record<string, unknown>,
    });

    return {
      props: {
        meta: jsonSafeMeta,
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