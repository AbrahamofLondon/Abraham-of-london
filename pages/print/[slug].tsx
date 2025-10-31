// pages/print/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

// ✅ FIX: Use the new unified content library
import { getContentSlugs, getContentBySlug } from "@/lib/mdx"; 

// ✅ FIX: Use a NAMED IMPORT { mdxComponents }
import { mdxComponents } from '@/components/mdx-components';
import BrandFrame from "@/components/print/BrandFrame";
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "print"; 

export default function PrintDocPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{`${frontmatter.title} | Print View`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <BrandFrame
        title={frontmatter.title}
        subtitle={frontmatter.subtitle}
        author={frontmatter.author}
        date={frontmatter.date ? new Date(frontmatter.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
      >
        <article className="prose prose-lg dark:prose-invert mx-auto">
          {/* ✅ FIX: Pass the correctly imported components map */}
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </BrandFrame>
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  source: any;
  frontmatter: PostMeta;
}> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  const mdxSource = await serialize(content || '');

  return {
    props: {
      source: mdxSource,
      frontmatter: finalFrontmatter,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs(CONTENT_TYPE);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};