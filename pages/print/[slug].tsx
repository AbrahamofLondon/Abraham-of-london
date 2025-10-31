// pages/print/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import path from "path";
import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// definitive: alias the default map
import mdxComponentMap from "@/components/mdx-components";
const MDXComponents = mdxComponentMap;

// wrapper used directly in JSX
import BrandFrame from "@/components/print/BrandFrame";

const DIR = path.join(process.cwd(), "content", "print");

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = listSlugs(DIR);
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug);
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

      <BrandFrame>
        <article className="prose lg:prose-lg dark:prose-invert mx-auto">
          <MDXRemote {...mdxSource} components={MDXComponents} />
        </article>
      </BrandFrame>
    </>
  );
}
