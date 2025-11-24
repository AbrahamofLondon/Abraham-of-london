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

// These are the *actual* Contentlayer types you have.
const PRIMARY_COLLECTION = "Post";
const FALLBACK_COLLECTIONS = ["Print", "Resource"] as const;
const COLLECTIONS = [PRIMARY_COLLECTION, ...FALLBACK_COLLECTIONS];

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
          <div className="prose prose-lg max-w-none prose-img:rounded-xl prose-img:shadow-lg">
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
    const allItems: any[] = [];

    // Gather slugs from Post, Print, Resource
    for (const key of COLLECTIONS) {
      try {
        const items = getAllContent(key) ?? [];
        allItems.push(...items);
      } catch {
        // if lib/mdx throws for a collection key, ignore and move on
      }
    }

    const seen = new Set<string>();
    const paths =
      allItems
        .filter((item) => item?.slug)
        .map((item) => String(item.slug))
        .filter((slug) => {
          if (seen.has(slug)) return false;
          seen.add(slug);
          return true;
        })
        .map((slug) => ({ params: { slug } }));

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

    let data: (PageMeta & { content?: string }) | null = null;

    // Try Post first, then Print, then Resource
    for (const key of COLLECTIONS) {
      try {
        const candidate = getContentBySlug(key, slug, {
          withContent: true,
        }) as (PageMeta & { content?: string }) | null;

        if (candidate) {
          data = candidate;
          break;
        }
      } catch {
        // lib/mdx may throw for unknown collection keys – ignore
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