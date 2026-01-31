import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";

type Props = { book: any | null };

function normalize(input: string): string {
  return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export const getStaticPaths: GetStaticPaths = async () => {
  let allBooks: any[] = [];
  try {
    // Priority 1: Contentlayer 2 Generated path
    const gen = await import(".contentlayer/generated");
    allBooks = gen.allBooks || [];
  } catch {
    try {
      // Priority 2: Compatibility layer
      const compat = await import("@/lib/contentlayer-compat");
      allBooks = compat.allBooks || [];
    } catch {
      allBooks = [];
    }
  }

  const paths = allBooks
    .map((b: any) => {
      const raw = b?.slug || b?.slugComputed || b?._raw?.flattenedPath || "";
      const slug = normalize(String(raw).replace(/^books\//, ""));
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");
  const needle = normalize(slug);

  let allBooks: any[] = [];
  try {
    const gen = await import(".contentlayer/generated");
    allBooks = gen.allBooks || [];
  } catch {
    try {
      const compat = await import("@/lib/contentlayer-compat");
      allBooks = compat.allBooks || [];
    } catch {
      allBooks = [];
    }
  }

  const book = allBooks.find((b: any) => {
    const raw = b?.slug || b?.slugComputed || b?._raw?.flattenedPath || "";
    const s = normalize(String(raw).replace(/^books\//, ""));
    return s === needle;
  }) || null;

  if (!book) return { notFound: true, revalidate: 60 };

  return {
    props: { book: JSON.parse(JSON.stringify(book)) },
    revalidate: 1800,
  };
};

const BookPage: NextPage<Props> = ({ book }) => {
  if (!book) return null;

  const title = book.title || "Book";
  const description = book.description || book.excerpt || "";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
      </Head>

      <section className="bg-black border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-kicker">Book</p>
          <h1 className="heading-statement mt-4">
            {title}
          </h1>
          {book.subtitle && (
            <p className="mt-4 text-lg text-white/60 font-light">{book.subtitle}</p>
          )}
        </div>
      </section>

      <section className="bg-black">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <MDXLayoutRenderer code={book.body?.code} />
        </div>
      </section>
    </Layout>
  );
};

export default BookPage;