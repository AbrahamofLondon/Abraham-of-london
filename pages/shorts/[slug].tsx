import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer/hooks";
import { allShorts, type Short } from "contentlayer/generated";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { useShortInteractions } from "@/hooks/useShortInteractions";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ShortPageProps = {
  short: {
    slug: string;
    title: string;
    body: { code: string };
    excerpt?: string | null;
    date?: string | null;
    readTime?: string | null;
    tags?: string[];
    theme?: string | null;
  };
};

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

const ShortSlugPage: NextPage<ShortPageProps> = ({ short }) => {
  const MDXContent = useMDXComponent(short.body.code);

  const {
    likes,
    saves,
    userLiked,
    userSaved,
    loading,
    handleLike,
    handleSave,
  } = useShortInteractions(short.slug);

  const title = `${short.title} · Short`;
  const description =
    short.excerpt ??
    "A short, high-signal reflection from the Abraham of London Canon.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="bg-white dark:bg-gray-950 py-12">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

          {/* HEADER */}
          <header className="mb-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
              Short · High-Protein
            </p>

            <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">
              {short.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {short.date && (
                <span>
                  {new Date(short.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </span>
              )}

              {short.readTime && (
                <>
                  <span className="h-px w-4 bg-gray-300 dark:bg-gray-700" />
                  <span>{short.readTime}</span>
                </>
              )}

              {short.theme && (
                <>
                  <span className="h-px w-4 bg-gray-300 dark:bg-gray-700" />
                  <span>{short.theme}</span>
                </>
              )}
            </div>

            {short.excerpt && (
              <p className="max-w-2xl text-sm text-gray-700 dark:text-gray-300">
                {short.excerpt}
              </p>
            )}
          </header>

          {/* INTERACTION BAR */}
          <div className="sticky top-20 z-10 mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white/90 p-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  userLiked
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-label={userLiked ? "Unlike this short" : "Like this short"}
              >
                ♥ {likes}
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  userSaved
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-label={userSaved ? "Unsave this short" : "Save this short"}
              >
                ⟡ {saves}
              </button>
            </div>

            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({
                    title: short.title,
                    text: description,
                    url,
                  });
                } else {
                  navigator.clipboard.writeText(url);
                }
              }}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="Share this short"
            >
              Share
            </button>
          </div>

          {/* CONTENT */}
          <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-headings:text-gray-900 dark:prose-invert dark:text-gray-100">
            <MDXContent components={mdxComponents} />
          </div>

          {/* TAGS */}
          {short.tags && short.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {short.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-10 border-t border-gray-200 pt-5 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If this helped you breathe, the Canon goes deeper — into the
              structures behind days like this.
            </p>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION                                                          */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allShorts
    .filter((s) => !s.draft && typeof s.slug === "string" && s.slug.length > 0)
    .map((s) => ({
      params: { slug: s.slug },
    }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ShortPageProps> = async ({
  params,
}) => {
  const slug = String(params?.slug ?? "");

  const raw = allShorts.find(
    (s) => !s.draft && String(s.slug) === slug
  );

  if (!raw) {
    return { notFound: true };
  }

  return {
    props: {
      short: {
        slug: raw.slug,
        title: raw.title ?? "Untitled short",
        body: raw.body,
        excerpt: raw.excerpt ?? null,
        date: raw.date ?? null,
        readTime: raw.readTime ?? (raw as any).readingTime ?? null,
        tags: raw.tags ?? [],
        theme: (raw as any).theme ?? null,
      },
    },
    revalidate: 60,
  };
};

export default ShortSlugPage;