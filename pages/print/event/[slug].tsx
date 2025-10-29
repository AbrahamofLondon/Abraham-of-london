// pages/print/event/[slug].tsx
import fs from 'fs';
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import path from "path";
import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";
import { mdxComponents } from "@/lib/mdx-components";
import BrandFrame from "@/components/print/BrandFrame";
import { allResources } from 'contentlayer/generated';

const DIR = path.join(process.cwd(), "content", "print", "event");

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

export default function PrintEvent({ slug, frontmatter, mdxSource }: Props) {
  return (
    <>
      <Head>
        <title>{frontmatter?.title ? `${frontmatter.title} | Print` : `Print Event | ${slug}`}</title>
      </Head>
      <BrandFrame>
        <article className="prose lg:prose-lg dark:prose-invert mx-auto">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </article>
      </BrandFrame>
    </>
  );
}
