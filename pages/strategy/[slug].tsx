// pages/strategy/[slug].tsx
import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

// Helper function to remove undefined values from an object
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key as keyof T] = obj[key];
    }
  });
  return result;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function StrategyPage({
  frontmatter,
  mdxSource,
}: InferGetStaticPropsType<typeof getStaticProps>): JSX.Element {
  const safeFrontmatter = frontmatter ?? ({} as PostMeta);
  const title = safeFrontmatter.title ?? "Strategy Note";

  // Safe local narrow for description
  const fm = safeFrontmatter as PostMeta & { description?: string | null };
  const description = fm.excerpt ?? fm.description ?? title;

  return (
    <Layout title={title} className="bg-charcoal">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20 text-cream">
        <article className="prose prose-invert prose-lg max-w-none">
          <h1 className="mb-8 font-serif text-4xl font-semibold text-cream">
            {title}
          </h1>

          {safeFrontmatter.date && (
            <p className="mb-6 text-sm text-softGold/70">
              {new Date(safeFrontmatter.date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}

          <MDXRemote {...mdxSource} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Static Generation
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllContent("strategy") ?? [];

  // Exclude placeholder / sample docs from being built
  const paths =
    posts
      .filter(
        (p) =>
          p &&
          typeof p.slug === "string" &&
          p.slug !== "sample-strategy" && // <- kill the placeholder
          !p.draft
      )
      .map((p) => ({
        params: { slug: p.slug },
      })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{
  frontmatter: PostMeta;
  mdxSource: MDXRemoteSerializeResult;
}> = async ({ params }) => {
  const slug = String(params?.slug);

  // Hard guard: never build the sample page
  if (!slug || slug === "sample-strategy") {
    return { notFound: true };
  }

  const file = getContentBySlug("strategy", slug);

  if (!file) {
    return { notFound: true };
  }

  const rawFrontmatter = (file.meta ?? {}) as PostMeta;

  // Clean the frontmatter object to remove undefined values
  const cleanFrontmatter = removeUndefined({
    title: rawFrontmatter.title,
    slug: rawFrontmatter.slug ?? slug,
    excerpt: rawFrontmatter.excerpt,
    description: rawFrontmatter.description,
    date: rawFrontmatter.date,
    tags: rawFrontmatter.tags ?? [],
    draft: rawFrontmatter.draft ?? false,
    featured: rawFrontmatter.featured ?? false,
    // add other PostMeta fields here if you use them
  });

  // Build a TS-safe scope object for MDX
  const scope: Record<string, unknown> = { ...cleanFrontmatter };

  const mdxSource = await serialize(file.content, {
    scope,
  });

  return {
    props: {
      frontmatter: cleanFrontmatter as PostMeta,
      mdxSource,
    },
    revalidate: 60,
  };
};