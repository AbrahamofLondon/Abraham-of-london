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
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";
import ArticleHero from "@/components/ArticleHero";

type PageMeta = PostMeta & {
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  accessLevel?: string;
  lockMessage?: string | null;
  slug?: string;
};

type PageProps = {
  meta: PageMeta;
  mdxSource: MDXRemoteSerializeResult;
};

// Remove unused variable - fix warning
// const PRIMARY_COLLECTION = 'Post';
const FALLBACK_COLLECTIONS = ["Print", "Resource"] as const;

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith("innerCircleAccess=true"));
}

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
    accessLevel,
    lockMessage,
    slug,
  } = meta;

  const [hasAccess, setHasAccess] = React.useState(false);
  const [checkedAccess, setCheckedAccess] = React.useState(false);

  React.useEffect(() => {
    setHasAccess(hasInnerCircleCookie());
    setCheckedAccess(true);
  }, []);

  const displaySubtitle = excerpt || description || undefined;
  const primaryCategory =
    category ||
    (Array.isArray(tags) && tags.length > 0 ? String(tags[0]) : "Article");

  const canonicalTitle = title || "Abraham of London";
  const displayDescription = description || excerpt || "";

  const isInnerCircle = accessLevel === "inner-circle";
  const isLocked = isInnerCircle && (!checkedAccess || !hasAccess);

  const effectiveSlug = slug || "";
  const returnToPath = `/${effectiveSlug}`;
  const joinUrl = `/inner-circle?returnTo=${encodeURIComponent(
    returnToPath,
  )}`;

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

      {isInnerCircle && (
        <section className="mx-auto w-full max-w-3xl px-4 pt-4 lg:px-0">
          <div className="rounded-xl border border-softGold/70 bg-black/70 px-4 py-3 text-sm text-softGold">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-softGold/80">
              Inner Circle
            </p>
            <p className="mt-1 text-cream">
              {lockMessage ||
                "This piece is catalogued as part of the Inner Circle canon. Full content is reserved for Inner Circle members."}
            </p>
          </div>
        </section>
      )}

      <main>
        <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 lg:px-0">
          <div
            className="
              prose prose-lg max-w-none
              prose-headings:font-serif
              prose-headings:text-slate-100
              prose-p:text-slate-100 prose-p:leading-relaxed
              prose-strong:text-slate-100 prose-strong:font-semibold
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-ul:text-slate-100 prose-ol:text-slate-100
              prose-blockquote:border-l-softGold prose-blockquote:text-slate-100
              prose-hr:border-t border-white/10
              prose-img:rounded-xl prose-img:shadow-lg
            "
          >
            {isInnerCircle && isLocked ? (
              <div className="rounded-2xl border border-softGold/60 bg-black/70 px-6 py-10 text-center">
                <h3 className="mb-3 font-serif text-2xl text-slate-50">
                  Inner Circle Content
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-100">
                  {lockMessage ||
                    "This article is reserved for Inner Circle members. Unlock access to read the full piece and its strategic implications."}
                </p>
                <a
                  href={joinUrl}
                  className="inline-block rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-black transition hover:bg-softGold/90"
                >
                  Join the Inner Circle
                </a>
              </div>
            ) : (
              <MDXRemote {...mdxSource} components={mdxComponents} />
            )}
          </div>
        </article>
      </main>
    </Layout>
  );
}

export default ContentPage;

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const allItems: unknown[] = [];

    const posts = await getAllPosts();
    allItems.push(...posts);

    for (const key of FALLBACK_COLLECTIONS) {
      const items = getAllContent(key) ?? [];
      allItems.push(...items);
    }

    const seen = new Set<string>();
    const paths = allItems
      .filter((item: unknown) => {
        const itemWithSlug = item as { slug?: unknown };
        return itemWithSlug?.slug;
      })
      .map((item: unknown) => {
        const itemWithSlug = item as { slug: unknown };
        return String(itemWithSlug.slug);
      })
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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error generating static paths for /[slug]:", err);
    return { paths: [], fallback: "blocking" };
  }
};

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

    const postCandidate = await getPostBySlug(slug);
    if (postCandidate) {
      data = postCandidate as PageMeta & { content?: string };
    }

    if (!data) {
      for (const key of FALLBACK_COLLECTIONS) {
        const candidate = getContentBySlug(key, slug, {
          withContent: true,
        }) as (PageMeta & { content?: string }) | null;

        if (candidate) {
          data = candidate;
          break;
        }
      }
    }

    if (!data) {
      return { notFound: true };
    }

    const { content, ...meta } = data;

    if (!meta.title) return { notFound: true };

    const jsonSafeMeta = JSON.parse(
      JSON.stringify(meta),
    ) as PageMeta;

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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /[slug]:", err);
    return { notFound: true };
  }
};