// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
// ✅ CRITICAL FIX: Use the correct lowercase import name
import mdxComponents from "@/components/mdx-components"; 
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "books";

export default function BookPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} by {frontmatter.author} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt} />
      </Head>
      <article className="container mx-auto px-4 py-12">
        <header className="mb-10 flex flex-col items-start gap-6 md:flex-row">
          {frontmatter.coverImage && (
            <div className="relative w-full flex-shrink-0 overflow-hidden rounded-lg shadow-2xl md:w-80">
              <Image
                src={frontmatter.coverImage}
                alt={`Cover of ${frontmatter.title}`}
                width={1024}
                height={1536}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}
          <div className="flex-grow">
            <h1 className="mb-2 text-4xl font-serif font-bold text-deep-forest">{frontmatter.title}</h1>
            <p className="mb-4 text-xl text-soft-charcoal">
              By {frontmatter.author}
            </p>
            {frontmatter.date && (
              <p className="mb-2 text-sm text-gray-500">
                Published: {new Date(frontmatter.date).toLocaleDateString("en-GB", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            )}
          </div>
        </header>
        <section className="prose prose-lg max-w-none border-t border-gray-200 pt-8">
          {/* ✅ FIX: Use lowercase mdxComponents */}
          <MDXRemote {...source} components={mdxComponents} />
        </section>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  const mdxSource = await serialize(content || '', { scope: finalFrontmatter });
  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allContent = getAllContent(CONTENT_TYPE);
  // ✅ FIX: Ensure slugs are lowercase for consistency across deployment
  const slugs = allContent.map(item => item.slug.toLowerCase());

  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};