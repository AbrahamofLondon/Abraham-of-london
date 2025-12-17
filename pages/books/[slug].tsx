// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllBooks } from "@/lib/contentlayer-helper";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { book: any; source: MDXRemoteSerializeResult };

function bookSlug(b: any): string {
  return b?.slug ?? b?._raw?.flattenedPath?.split("/").pop() ?? "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks();

  const paths = books
    .map((b) => {
      const slug =
        b.slug ??
        b?._raw?.flattenedPath?.split("/").pop() ??
        "";

      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const books = getAllBooks();
  const book = books.find((b) => bookSlug(b) === slug);
  if (!book) return { notFound: true };

  const raw = book.body?.raw ?? "";

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(String(raw), {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (e) {
    console.error(`[books serialize failed] slug=${slug}`, e);
    source = await serialize("This book page is being prepared.");
  }

  return { props: { book, source }, revalidate: 1800 };
};

const BookPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ book, source }) => (
  <Layout title={book.title ?? "Book"}>
    <Head>{book.excerpt && <meta name="description" content={book.excerpt} />}</Head>

    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-cream">{book.title}</h1>

      <article className="prose prose-invert mt-8">
        <SafeMDXRemote source={source} components={mdxComponents} />
      </article>
    </main>
  </Layout>
);

export default BookPage;