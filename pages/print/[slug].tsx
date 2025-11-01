// pages/print/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

// ✅ Import the unified functions to fetch content across categories
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import mdxComponents from "@/components/mdx-components";
import BrandFrame from "@/components/print/BrandFrame";
import type { PostMeta } from "@/types/post";

// Define all possible content types that might need a generic print view
const CONTENT_TYPES_FOR_PRINT = ["downloads", "books", "blog", "resources", "strategy"];

// --- [ Component Rendering ] ---

export default function PrintDocPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  // Determine which field to use for subtitle in the BrandFrame
  const subtitle = frontmatter.subtitle || frontmatter.category || frontmatter.location || frontmatter.excerpt;

  return (
    <>
      <Head>
        <title>{`${frontmatter.title} | Print View`}</title>
        {/* Set to noindex/nofollow for print views */}
        <meta name="robots" content="noindex, nofollow" /> 
      </Head>
      
      <BrandFrame
        title={frontmatter.title}
        subtitle={subtitle}
        author={frontmatter.author}
        date={frontmatter.date ? new Date(frontmatter.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
      >
        <article className="prose prose-lg dark:prose-invert mx-auto">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </BrandFrame>
    </>
  );
}

// --- [ Data Fetching ] ---

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  let frontmatter: Partial<PostMeta> = {};
  let content = "";
  let foundContentType = "";

  // Iterate through all content folders until the slug is found
  for (const type of CONTENT_TYPES_FOR_PRINT) {
    const data = getContentBySlug(type, slug, { withContent: true });
    if (data.content) {
      frontmatter = data;
      content = data.content;
      foundContentType = type;
      break;
    }
  }

  if (!content) {
    return { notFound: true };
  }
  
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  
  // Serialize content, exposing frontmatter fields to MDX content
  const mdxSource = await serialize(content || '', { scope: finalFrontmatter });
  
  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};


export const getStaticPaths: GetStaticPaths = async () => {
  let candidates: PostMeta[] = [];

  // 1. Gather all content from all specified source directories
  for (const type of CONTENT_TYPES_FOR_PRINT) {
    candidates.push(...getAllContent(type));
  }
  
  // 2. Filter for content explicitly marked as printable/downloadable
  const printableCandidates = candidates.filter((p: any) => 
    p?.slug && (p?.download || p?.print === true || p?.printable === true || p?.content || p?.category === 'Resources')
  );

  // 3. De-dupe slugs (this resolves the Conflicting Paths error)
  const slugs = Array.from(new Set(printableCandidates.map((p: any) => String(p.slug))));

  // 4. Generate paths
  return {
    paths: slugs.map((slug) => ({ params: { slug: slug.toLowerCase() } })),
    fallback: "blocking", // Use blocking fallback for safety
  };
};