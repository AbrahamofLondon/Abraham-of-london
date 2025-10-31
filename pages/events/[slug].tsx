// pages/events/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import { mdxComponents } from "@/components/mdx-components"; // ✅ Correct named import
import { getContentSlugs, getContentBySlug } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "events";

export default function EventPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      });
    } catch (e) { return dateString; }
  };

  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} | Event Details</title>
      </Head>
      <main className="container mx-auto px-4 py-12">
        {frontmatter.coverImage && (
          <div className="mb-8 aspect-w-16 aspect-h-9 relative overflow-hidden rounded-lg shadow-lg">
            <Image
              src={frontmatter.coverImage}
              alt={`Cover image for ${frontmatter.title}`}
              layout="fill"
              className="object-cover"
              priority
            />
          </div>
        )}
        <header className="border-b pb-6 mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">{frontmatter.title}</h1>
          <div className="text-lg text-gray-600 space-y-1">
            <p><strong>Date:</strong> {formatDate(frontmatter.date!)}</p>
            <p><strong>Location:</strong> {frontmatter.location}</p>
          </div>
        </header>
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
    revalidate: 60,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs(CONTENT_TYPE);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};