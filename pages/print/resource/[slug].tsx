// pages/print/resource/[slug].tsx (CLEANED VERSION - DELETE EVERYTHING AFTER THIS LINE)
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
  // Rely on the robustness built into lib/mdx.ts to find only valid content slugs
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));
  return { paths: paths, fallback: false };
};

// ----------------------------------------------------
// CRITICAL FIX: getStaticProps
// ----------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  if (!content) {
    return { notFound: true };
  }

  // Ensure ALL fields are serialized safely by relying on the null coalescing 
  const frontmatter = {
    ...rawFrontmatter,
    title: rawFrontmatter.title ?? 'Untitled Resource',
    excerpt: rawFrontmatter.excerpt ?? '', 
    subtitle: rawFrontmatter.subtitle ?? '', 

    // Final JSON-safe operation. This uses the null-coalesced raw data.
    ...JSON.parse(JSON.stringify(rawFrontmatter)),
  };

  const mdxSource = await serialize(content, { scope: frontmatter });

  return { props: { source: mdxSource, frontmatter: frontmatter }, revalidate: 3600 };
};


export default function PrintResourcePage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
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