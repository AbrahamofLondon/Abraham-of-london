// pages/strategy/[slug].tsx - SIMPLIFIED
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getDocumentBySlug } from "@/lib/contentlayer-helper";
import type { DocumentTypes } from "@/lib/contentlayer-helper";

interface StrategyPageProps {
  frontmatter: {
    slug: string;
    title: string;
    excerpt?: string;
    description?: string;
    date?: string;
    author?: string;
    category?: string;
    tags?: string[];
    readTime?: string;
    coverImage?: string | { src?: string } | null;
  };
  mdxSource: MDXRemoteSerializeResult;
}

export default function StrategyPage({ frontmatter, mdxSource }: StrategyPageProps) {
  const title = frontmatter.title || "Strategy";
  const description = frontmatter.excerpt || frontmatter.description || title;

  return (
    <Layout title={title} className="bg-charcoal">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <meta name="keywords" content={frontmatter.tags.join(", ")} />
        )}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://abrahamoflondon.com/strategy/${frontmatter.slug}`} />
        {frontmatter.coverImage && (
          <meta property="og:image" content={
            typeof frontmatter.coverImage === 'string' 
              ? frontmatter.coverImage 
              : (frontmatter.coverImage as any)?.src || ''
          } />
        )}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20 text-cream">
        <article className="prose prose-invert prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="mb-4 font-serif text-4xl font-semibold text-cream">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-cream/70">
              {frontmatter.date && (
                <time dateTime={frontmatter.date}>
                  {new Date(frontmatter.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              
              {frontmatter.readTime && (
                <span>· {frontmatter.readTime} min read</span>
              )}
              
              {frontmatter.author && (
                <span>· By {frontmatter.author}</span>
              )}
            </div>

            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="mt-8">
            <MDXRemote {...mdxSource} components={mdxComponents} />
          </div>
        </article>
      </main>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // In a real implementation, you'd get all strategy slugs
  // For now, return empty array for fallback
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<StrategyPageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    
    if (!slug) {
      return { notFound: true };
    }

    const doc = getDocumentBySlug(slug, "Strategy") as DocumentTypes;
    
    if (!doc || doc.draft) {
      return { notFound: true };
    }

    const frontmatter = {
      slug: doc.slug || slug,
      title: doc.title || "Strategy",
      excerpt: doc.excerpt || "",
      description: doc.description || doc.excerpt || "",
      date: doc.date,
      author: (doc as any).author,
      category: (doc as any).category,
      tags: doc.tags || [],
      readTime: (doc as any).readTime,
      coverImage: doc.coverImage,
    };

    const content = doc.body?.raw || "";
    
    if (!content.trim()) {
      return { notFound: true };
    }

    const mdxSource = await serialize(content, {
      mdxOptions: {
        development: process.env.NODE_ENV === "development",
      },
      parseFrontmatter: false,
    });

    return {
      props: {
        frontmatter,
        mdxSource,
      },
      revalidate: 60 * 60 * 24, // 24 hours
    };
  } catch (error) {
    console.error("Error generating strategy page:", error);
    return { notFound: true };
  }
};