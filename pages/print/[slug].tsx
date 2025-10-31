// pages/print/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

// ✅ FIX: Use the new unified content library for consistency and reliability
import { getContentSlugs, getContentBySlug } from "@/lib/mdx";

// ✅ FIX: Use a named import for the component map
import { mdxComponents } from "@/components/mdx-components";
import BrandFrame from "@/components/print/BrandFrame";
import type { PostMeta } from "@/types/post";

// Define the content type for this page (e.g., 'print', 'downloads', etc.)
const CONTENT_TYPE = "print"; 

// --- [ Component Rendering ] ---

export default function PrintDocPage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{`${frontmatter.title} | Print View`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Pass frontmatter props to BrandFrame for the header/footer */}
      <BrandFrame
        title={frontmatter.title}
        subtitle={frontmatter.subtitle}
        author={frontmatter.author}
        date={frontmatter.date ? new Date(frontmatter.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
      >
        <article className="prose prose-lg dark:prose-invert mx-auto">
          {/* Pass the correctly imported component map */}
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </BrandFrame>
    </>
  );
}

// --- [ Data Fetching ] ---

export const getStaticProps: GetStaticProps<{
  source: any;
  frontmatter: PostMeta;
}> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  // Ensure all frontmatter properties are serializable (null instead of undefined)
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