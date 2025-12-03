// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import ArticleHero from "@/components/ArticleHero";
import mdxComponents from "@/components/mdx-components";

import { getAllBooks, getBookBySlug } from "@/lib/content";
import type { Book } from "contentlayer/generated";

type Props = {
  meta: {
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    date?: string | null;
    coverImage?: string | null;
    tags?: string[];
  };
  source: MDXRemoteSerializeResult;
};

const BookPage: NextPage<Props> = ({ meta, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading book…">
        <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
          <p className="text-sm text-gray-300">Loading volume…</p>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={meta.title} description={meta.excerpt ?? undefined}>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <ArticleHero
          title={meta.title}
          subtitle={meta.subtitle ?? undefined}
          date={meta.date ?? undefined}
          tags={meta.tags}
          readTime={undefined}
          coverImage={meta.coverImage ?? undefined}
          coverAspect="book"
          coverFit="cover"
        />

        <article className="prose prose-invert prose-lg mt-10 max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default BookPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks();
  return {
    paths: books.map((b) => ({ params: { slug: b.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const slug = context.params?.slug as string;
  const book = getBookBySlug(slug);

  if (!book) return { notFound: true };

  const mdxSource = await serialize(book.body.raw, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  const meta: Props["meta"] = {
    slug: book.slug,
    title: book.title,
    subtitle: (book as Book & { subtitle?: string }).subtitle ?? null,
    excerpt: book.excerpt ?? null,
    date: book.date ?? null,
    coverImage: book.coverImage ?? null,
    tags: book.tags ?? [],
  };

  return {
    props: {
      meta,
      source: mdxSource,
    },
    revalidate: 3600,
  };
};