import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllBooks, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";

type Props = { book: any; source: any };
const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllBooks()
    .filter((b) => !isDraft(b))
    .map((b) => ({ params: { slug: normalizeSlug(b) } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawDoc = getAllBooks().find((b) => normalizeSlug(b) === slug);

  if (!rawDoc || isDraft(rawDoc)) return { notFound: true };

  const book = {
    title: rawDoc.title || "Book",
    excerpt: rawDoc.excerpt || null,
    coverImage: rawDoc.coverImage || null,
    slug: slug,
    body: { raw: String(rawDoc.body.raw) }
  };

  try {
    const mdxSource = await serialize(book.body.raw);
    return { 
      props: { 
        book, 
        source: JSON.parse(JSON.stringify(mdxSource)) 
      }, 
      revalidate: 1800 
    };
  } catch (err) {
    return { notFound: true };
  }
};

export default BookPage;