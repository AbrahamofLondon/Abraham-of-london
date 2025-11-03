// pages/strategy/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
// Assuming the unified data fetcher is now correctly robust in lib/mdx.ts
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "strategy";

type Props = { 
  source: Awaited<ReturnType<typeof serialize>>; 
  frontmatter: PostMeta;
};

// ------------------------------------------------------------------
// ✅ FIX: getStaticPaths (Ensures we only build paths for discoverable content)
// ------------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  // Relying on getAllContent to only return PostMeta objects for successfully read files
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));

  return { paths: paths, fallback: false };
};

// ------------------------------------------------------------------
// ✅ FIX: getStaticProps (Ensures serialization safety)
// ------------------------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  // This call now relies on the robust file system checks in the updated lib/mdx.ts
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  if (!content) {
    // If the content file exists but is empty, or if getContentBySlug returned a minimal object (safe state)
    // then this slug should not have been requested by getStaticPaths, but we handle it anyway.
    return { notFound: true };
  }

  // CRITICAL FIX: Ensure ALL fields are serialized safely by relying on the null coalescing 
  // already implemented in the lib/mdx.ts function.
  const frontmatter = JSON.parse(JSON.stringify(rawFrontmatter)); 

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { props: { source: mdxSource, frontmatter: frontmatter }, revalidate: 3600 };
};

// ------------------------------------------------------------------
// Page Component
// ------------------------------------------------------------------
export default function StrategyPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout pageTitle={frontmatter.title}>
      <Head>
        <title>{frontmatter.title} | Abraham of London</title>
        {/* Use optional chaining or null coalescing on excerpt, though getStaticProps should clean it */}
        <meta name="description" content={frontmatter.excerpt ?? frontmatter.title} />
      </Head>
      <article className="container mx-auto px-4 py-12 prose max-w-none">
        <h1>{frontmatter.title}</h1>
        {/* CRITICAL: MDXRemote must be called with a valid source, guaranteed by the content check above */}
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </Layout>
  );
}
