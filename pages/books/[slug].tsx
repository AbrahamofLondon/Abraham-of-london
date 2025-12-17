import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { getAllBooks, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { book: any; source: MDXRemoteSerializeResult };

const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks().filter((b: any) => !isDraft(b));

  const paths = books
    .map((b: any) => normalizeSlug(b))
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const books = getAllBooks().filter((b: any) => !isDraft(b));
  const book = books.find((b: any) => normalizeSlug(b) === slug);
  if (!book) return { notFound: true };

  const raw = String(book?.body?.raw ?? "");

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { book, source }, revalidate: 1800 };
};

const BookPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ book, source }) => {
  const title = String(book?.title ?? "Book");
  const desc = String(book?.description ?? book?.excerpt ?? "");
  const canonicalUrl = `${SITE}/books/${normalizeSlug(book)}`;

  return (
    <Layout title={title} description={desc} canonicalUrl={canonicalUrl} ogImage={book?.coverImage ?? undefined} ogType="article">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-serif text-3xl text-cream">{title}</h1>

        <article className="prose prose-invert mt-8">
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default BookPage;