import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllCanons, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { canon: any; source: any };
const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllCanons()
    .filter((d) => !isDraft(d))
    .map((d) => ({ params: { slug: normalizeSlug(d) } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawDoc = getAllCanons().find((d) => normalizeSlug(d) === slug);

  if (!rawDoc || isDraft(rawDoc)) return { notFound: true };

  // SURGICAL FLATTENING
  const canon = {
    title: rawDoc.title || "Canon",
    excerpt: rawDoc.excerpt || null,
    slug: slug,
    body: { raw: String(rawDoc.body.raw) }
  };

  try {
    const mdxSource = await serialize(canon.body.raw, {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
    });

    return { 
      props: { 
        canon, 
        source: JSON.parse(JSON.stringify(mdxSource)) 
      }, 
      revalidate: 1800 
    };
  } catch (err) {
    return { notFound: true };
  }
};

export default CanonPage;