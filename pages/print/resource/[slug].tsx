// pages/print/resource/[slug].tsx (ABSOLUTELY ROBUST FINAL VERSION)
import * as React from 'react';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import BrandFrame from "@/components/print/BrandFrame";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "resources";

type Props = { 
  source: Awaited<ReturnType<typeof serialize>>; 
  frontmatter: PostMeta;
};

// ----------------------------------------------------
// CRITICAL FIX: getStaticPaths
// ----------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  // Relies on robust file discovery in lib/mdx.ts
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));
  return { paths: paths, fallback: false };
};

// ----------------------------------------------------
// ✅ CRITICAL FIX: getStaticProps (Robustness Ensured)
// ----------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  if (!content) {
    return { notFound: true };
  }

  // 1. Ensure Next.js serialization rules are met (undefined -> null)
  const jsonSafeFrontmatter = JSON.parse(JSON.stringify(rawFrontmatter));

  // 2. Apply explicit string coalescing over the safe object to prevent component crashes (like .toLowerCase)
  const frontmatter = {
    ...jsonSafeFrontmatter,
    title: jsonSafeFrontmatter.title ?? 'Untitled Resource',
    excerpt: jsonSafeFrontmatter.excerpt ?? '', 
    subtitle: jsonSafeFrontmatter.subtitle ?? '', 
    // Add any other fields used directly in the component that MUST be strings here
  } as PostMeta; // Type assertion since types are now safe

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { props: { source: mdxSource, frontmatter: frontmatter }, revalidate: 3600 };
};


export default function PrintResourcePage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  // Use the safely coerced properties directly
  const subtitleText = frontmatter.subtitle || frontmatter.excerpt || ''; 
  
  return (
    <BrandFrame
      title={frontmatter.title}
      subtitle={subtitleText}
      pageSize="A4" 
    >
      <div className="prose max-w-none">
        <MDXRemote {...source} components={mdxComponents} />
      </div>
    </BrandFrame>
  );
}