// pages/print/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import path from "path";
import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// 🏆 DEFINITIVE FIX: Import the default export and alias it to resolve compilation issues.
import mdxComponentMap from '@/components/mdx-components';
const MDXComponents = mdxComponentMap;

// 🔑 CRITICAL FIX: Re-import BrandFrame because it is used directly in the JSX as a wrapper.
import BrandFrame from "@/components/print/BrandFrame";

const DIR = path.join(process.cwd(), "content", "print");

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = listSlugs(DIR);
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug);
  // NOTE: This function (loadMdxBySlug) must handle the Date serialization internally or the error will return.
  const { frontmatter, mdxSource } = await loadMdxBySlug(DIR, slug);
  return { props: { slug, frontmatter, mdxSource } };
};

type Props = { slug: string; frontmatter: any; mdxSource: any };

export default function PrintDoc({ slug, frontmatter, mdxSource }: Props) {
  return (
    <>
      <Head>
        <title>{frontmatter?.title ? `${frontmatter.title} | Print` : `Print | ${slug}`}</title>
        <meta name="robots" content="noindex,follow" />
      </Head>
      
      {/* This usage requires the component to be imported directly above */}
      <BrandFrame>
        <article className="prose lg:prose-lg dark:prose-invert mx-auto">
          {/* Passing the fixed MDX component map */}
          <MDXRemote {...mdxSource} components={MDXComponents} />
        </article>
      </BrandFrame>
    </>
  );
}