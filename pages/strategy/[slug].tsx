// pages/strategy/[slug].tsx
import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug, type RawContentEntry } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

const COLLECTION = "strategy";

type Props = {
  source: Awaited<ReturnType<typeof serialize>>;
  frontmatter: PostMeta;
};

// ------------------------------------------------------------------
// getStaticPaths
// ------------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  const allContent = getAllContent(COLLECTION);

  const paths =
    allContent?.map((item) => ({
      params: { slug: String(item.slug).toLowerCase() },
    })) ?? [];

  return { paths, fallback: false };
};

// ------------------------------------------------------------------
// getStaticProps
// ------------------------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam
      : Array.isArray(slugParam)
      ? slugParam[0]
      : "";

  if (!slug) return { notFound: true };

  const entry = getContentBySlug(COLLECTION, slug, {
    withContent: true,
  }) as RawContentEntry | null;

  if (!entry || !entry.content) {
    return { notFound: true };
  }

  const { content, ...rawFrontmatter } = entry;

  const frontmatter = JSON.parse(JSON.stringify(rawFrontmatter)) as PostMeta;
  const mdxSource = await serialize(content, { scope: frontmatter });

  return {
    props: {
      source: mdxSource,
      frontmatter,
    },
    revalidate: 3600,
  };
};

// ------------------------------------------------------------------
// Page Component
// ------------------------------------------------------------------
export default function StrategyPage({
  source,
  frontmatter,
}: InferGetStaticPropsType<typeof getStaticProps>): JSX.Element {
  const title = frontmatter.title ?? "Strategy Note";
  const description = frontmatter.excerpt ?? frontmatter.description ?? title;

  return (
    <Layout title={title} className="bg-charcoal">
      <Head>
        <title>{title} | Abraham of London</title>
        {description && <meta name="description" content={description} />}
      </Head>

      <main>
        <article className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 lg:px-0">
          <header className="mb-8">
            {frontmatter.date && (
              <p className="text-sm text-gray-400">
                {new Date(frontmatter.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            <h1 className="mt-2 font-serif text-3xl font-light text-cream sm:text-4xl">
              {title}
            </h1>
            {frontmatter.excerpt && (
              <p className="mt-3 max-w-2xl text-base text-gray-300">
                {frontmatter.excerpt}
              </p>
            )}
          </header>

          <div
            className="
              prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-cream
              prose-p:text-gray-200 prose-p:leading-relaxed
              prose-strong:text-cream prose-strong:font-semibold
              prose-a:text-softGold prose-a:no-underline hover:prose-a:underline
              prose-ul:text-gray-200 prose-ol:text-gray-200
              prose-blockquote:border-l-softGold prose-blockquote:text-gray-100
              prose-hr:border-t border-white/10
              prose-img:rounded-xl prose-img:shadow-lg
            "
          >
            <MDXRemote {...source} components={mdxComponents} />
          </div>
        </article>
      </main>
    </Layout>
  );
}