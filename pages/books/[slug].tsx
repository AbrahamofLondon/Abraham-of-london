import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { getAllBooks } from "@/lib/contentlayer-helper";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = {
  book: any;
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks();

  const paths = books.map((book) => ({
    params: {
      slug:
        book.slug ??
        book._raw?.flattenedPath?.split("/").pop() ??
        "",
    },
  }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const books = getAllBooks();

  const book = books.find((b) => {
    const s =
      b.slug ?? b._raw?.flattenedPath?.split("/").pop();
    return s === slug;
  });

  if (!book) return { notFound: true };

  const raw = book.body?.raw ?? "";

  const source = await serialize(raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    },
  });

  return {
    props: { book, source },
    revalidate: 1800,
  };
};

const BookPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ book, source }) => (
  <Layout title={book.title}>
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-cream">
        {book.title}
      </h1>

      <article className="prose prose-invert mt-8">
        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </main>
  </Layout>
);

export default BookPage;