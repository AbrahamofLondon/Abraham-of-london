// pages/shorts/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer2/hooks";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import type { Short } from "contentlayer2/generated";
import { allShorts } from "contentlayer2/generated";

type ShortPageProps = {
  short: Short;
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
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:type"
          content="article"
        />
        <meta
          property="og:url"
          content={`https://www.abrahamoflondon.org/shorts/${short.slug}`}
        />
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
  const shorts = allShorts.filter((s) => s.published !== false);

  return {
    paths: shorts.map((short) => ({
      params: { slug: short.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ShortPageProps> = async (ctx) => {
  const slug = ctx.params?.slug as string | undefined;

  if (!slug) {
    return { notFound: true };
  }

  const short =
    allShorts.find((s) => s.slug === slug && s.published !== false) || null;

  if (!short) {
    return { notFound: true };
  }

  return {
    props: { short },
    revalidate: 1800,
  };
};

export default ShortPage;