// pages/strategy/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import { mdxComponents } from "@/components/mdx-components"; // ✅ Correct named import
import { getContentSlugs, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "strategy"; // Set for this page

export default function StrategyPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} | Strategy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <div className="border-b pb-4 mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">{frontmatter.title}</h1>
          {frontmatter.date && (
            <p className="text-lg text-gray-600">
              Date: {new Date(frontmatter.date).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
        <div className="prose prose-lg max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </div>
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  const mdxSource = await serialize(content || '');
  return { 
    props: { source: mdxSource, frontmatter: finalFrontmatter },
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs(CONTENT_TYPE);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};