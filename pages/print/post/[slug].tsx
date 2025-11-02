// pages/print/post/[slug].tsx (Apply to all print/[slug] files)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from '@/components/mdx-components'; // The correct component map
import { getAllContent, getContentBySlug } from "@/lib/mdx"; // The core data functions
import BrandFrame from "@/components/print/BrandFrame"; // Assuming this is correct

const CONTENT_TYPE = "blog"; // Change this for post/resource/book accordingly

interface PrintPageProps {
  source: MDXRemoteSerializeResult;
  frontmatter: any;
}

export default function PrintPage({ source, frontmatter }: PrintPageProps) {
  // CRITICAL: The page component MUST NOT use Contentlayer hooks, only standard React and MDXRemote.
  
  return (
    <BrandFrame
      title={frontmatter.title}
      subtitle={frontmatter.subtitle || frontmatter.excerpt}
      pageSize="A4" 
    >
      <div className="prose max-w-none print:text-black">
        {/* CRITICAL FIX: Using standard MDXRemote rendering */}
        <MDXRemote {...source} components={mdxComponents} />
      </div>
    </BrandFrame>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
  
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  // Ensure 'summary' is null, not undefined, if missing (Fixes serialization crash)
  if (finalFrontmatter.summary === undefined) finalFrontmatter.summary = null;

  const mdxSource = await serialize(content || '', { scope: finalFrontmatter });
  
  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allContent = getAllContent(CONTENT_TYPE);
  const slugs = allContent.map(item => item.slug.toLowerCase());

  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};