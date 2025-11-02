// pages/strategy/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "strategy";

type Props = { 
  source: Awaited<ReturnType<typeof serialize>>; 
  frontmatter: PostMeta;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));

  return { paths: paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  if (!content) {
    return { notFound: true };
  }

  // Ensure ALL fields are serialized safely
  const frontmatter = JSON.parse(JSON.stringify(rawFrontmatter)); 

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { props: { source: mdxSource, frontmatter: frontmatter }, revalidate: 3600 };
};

export default function StrategyPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout pageTitle={frontmatter.title}>
      <Head>
        <title>{frontmatter.title} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt || frontmatter.title} />
      </Head>
      <article className="container mx-auto px-4 py-12 prose max-w-none">
        <h1>{frontmatter.title}</h1>
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </Layout>
  );
}