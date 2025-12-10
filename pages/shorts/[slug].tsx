// pages/shorts/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";import Head from "next/head";
import { getPublishedShorts, getShortBySlug } from "@/lib/contentlayer-helper";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

// We define a local, serialisable type instead of importing from contentlayer2
type ShortDoc = {
  _id: string;
  slug: string;
  title: string;
  body: { code: string };
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
};

type ShortPageProps = {
  short: ShortDoc;
};

const ShortPage: NextPage<ShortPageProps> = ({ short }) => {
  const MDXContent = useMDXComponent(short.body.code);

  const title = `${short.title} · Short`;
  const description =
    short.excerpt ||
    "A short, high-protein reflection from the Abraham of London ecosystem.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <main className="bg-white py-12 dark:bg-gray-950">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
                  <span className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700" />
                  <span>{short.readTime}</span>
                </>
              )}
              {short.theme && (
                <>
                  <span className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700" />
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

          <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-headings:text-gray-900 dark:prose-invert dark:text-gray-100">
            <MDXContent components={mdxComponents} />
          </div>

          <footer className="mt-10 border-t border-gray-200 pt-5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <p>
              If this helped you exhale even a little, the Canon goes further —
              into the structural patterns behind days like this.
            </p>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = getPublishedShorts();

  return {
    paths: shorts.map((short) => ({
      params: { slug: short.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  // Pull raw doc from helper
  const raw = getShortBySlug(slug);

  if (!raw) {
    return { notFound: true };
  }

  // Normalise to a serialisable object (no undefined)
  const short = {
    ...raw,
    title: raw.title ?? "Untitled short",
    excerpt: raw.excerpt ?? null,
    date: raw.date ?? null,
    tags: raw.tags ?? [],
    readTime:
      (raw as any).readTime ??
      (raw as any).readingTime ??
      null,
    theme: (raw as any).theme ?? null,
  };

  return {
    props: { short },
    revalidate: 1800, // 30 mins ISR if you want it
  };
};

export default ShortPage;