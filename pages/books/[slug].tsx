import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  getAllBooks,
  normalizeSlug,
  isDraft,
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = {
  book: {
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    slug: string;
  };
  source: any;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllBooks()
    .filter((b) => !isDraft(b))
    .map((b) => ({ params: { slug: normalizeSlug(b) } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "").toLowerCase();
  const raw = getAllBooks().find((b) => normalizeSlug(b) === slug);

  if (!raw || isDraft(raw)) return { notFound: true };

  const mdxSource = await serialize(raw.body.raw, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
    },
  });

  return {
    props: {
      book: {
        title: raw.title ?? "Book",
        excerpt: raw.excerpt ?? null,
        coverImage: raw.coverImage ?? null,
        slug,
      },
      source: mdxSource,
    },
    revalidate: 1800,
  };
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  return (
    <Layout title={book.title} description={book.excerpt ?? undefined}>
      <Head>
        <title>{book.title} | Abraham of London</title>
      </Head>

      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-6 font-serif text-4xl font-semibold">
          {book.title}
        </h1>

        <MDXRemote {...source} components={mdxComponents} />
      </article>
    </Layout>
  );
};

export default BookPage;