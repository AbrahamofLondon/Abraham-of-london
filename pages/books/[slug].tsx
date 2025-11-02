// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components"; // The correct component map
import { getAllContent, getContentBySlug } from "@/lib/mdx"; // The unified data functions
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "books";

// Define the shape of the props returned by getStaticProps
type Props = { 
  source: Awaited<ReturnType<typeof serialize>>; 
  frontmatter: PostMeta & { pdfPath?: string | null };
};


// ----------------------------------------------------
// ✅ CRITICAL FIX 1: getStaticPaths (Resolves the Fatal Build Crash)
// ----------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  // Use the unified content fetcher to get all slugs for the 'books' type
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));

  return {
    paths: paths,
    fallback: false, // Prevents loading dynamic pages that don't exist
  };
};

// ----------------------------------------------------
// ✅ CRITICAL FIX 2: getStaticProps (Ensures Data Fetching and Serialization)
// ----------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  // Use the raw frontmatter to construct a JSON-safe object
  const frontmatter = {
    ...rawFrontmatter,
    // Ensure critical string/optional fields are explicitly null if undefined (Serialization safety)
    title: rawFrontmatter.title ?? 'Untitled Book',
    author: rawFrontmatter.author ?? null,
    date: rawFrontmatter.date ?? null,
    excerpt: rawFrontmatter.excerpt ?? null,
    coverImage: rawFrontmatter.coverImage ?? null,
    summary: rawFrontmatter.summary ?? null, 
    pdfPath: (rawFrontmatter as any).pdfPath ?? null,
    
    // Clean any accidental undefineds for serialization integrity
    ...Object.fromEntries(
        Object.entries(rawFrontmatter).filter(([key, value]) => value !== undefined)
        .map(([key, value]) => [key, value === undefined ? null : value])
    )
  };


  if (!content) {
    return { notFound: true };
  }

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { 
    props: { source: mdxSource, frontmatter: frontmatter },
    revalidate: 3600, // Regenerate page every hour
  };
};

// ----------------------------------------------------
// Page Component 
// ----------------------------------------------------
export default function BookPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} by {frontmatter.author} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt || frontmatter.title} />
      </Head>
      <article className="container mx-auto px-4 py-12">
        <header className="mb-10 flex flex-col items-start gap-6 md:flex-row">
          {frontmatter.coverImage && (
            <div className="relative w-full flex-shrink-0 overflow-hidden rounded-lg shadow-2xl md:w-80 aspect-[2/3]">
              <Image
                src={frontmatter.coverImage}
                alt={`Cover of ${frontmatter.title}`}
                width={1024}
                height={1536}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          )}
          <div className="flex-grow">
            <h1 className="mb-2 text-4xl font-serif font-bold text-deep-forest">{frontmatter.title}</h1>
            <p className="mb-4 text-xl text-soft-charcoal">
              By {frontmatter.author}
            </p>
          </div>
        </header>
        <section className="prose prose-lg max-w-none border-t border-gray-200 pt-8">
          <MDXRemote {...source} components={mdxComponents} />
        </section>
      </article>
    </Layout>
  );
}