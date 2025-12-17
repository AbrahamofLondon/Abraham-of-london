import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";
// Import the generated collection directly for maximum speed and reliability
import { allBooks, Book } from "contentlayer/generated";

type Props = {
  book: Book;
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Filter out drafts to prevent them from being indexed by search engines
  const paths = allBooks
    .filter((b) => !b.draft)
    .map((book) => ({
      params: { slug: book.slug }, // Uses the computed slug from config
    }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;

  // Exact match against the computed slug field
  const book = allBooks.find((b) => b.slug === slug);

  if (!book || book.draft) {
    return { notFound: true };
  }

  try {
    // Serialization logic using unified plugins
    const mdxSource = await serialize(book.body.raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    return {
      props: {
        book,
        source: mdxSource,
      },
      revalidate: 1800, // Sync with your 30-minute revalidation strategy
    };
  } catch (error) {
    console.error(`[Build Error] Failed to serialize book: ${slug}`, error);
    return { notFound: true };
  }
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const pageTitle = `${book.title} | Books | Abraham of London`;

  return (
    <Layout title={book.title} description={book.description || book.excerpt}>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <main className="min-h-screen bg-black text-cream">
        <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
          <header className="mb-12 border-b border-gold/10 pb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                Structural Volume
              </span>
            </div>
            
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {book.title}
            </h1>

            {book.subtitle && (
              <p className="mt-6 text-xl italic leading-relaxed text-gray-400">
                {book.subtitle}
              </p>
            )}

            <div className="mt-8 flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-gray-500">
              {book.author && <span>By {book.author}</span>}
              {book.author && <span className="h-1 w-1 rounded-full bg-gold/30" />}
              <span>{new Date(book.date).getFullYear()} Edition</span>
            </div>
          </header>

          <div className="prose prose-invert prose-gold max-w-none prose-headings:font-serif prose-p:text-gray-300">
            <SafeMDXRemote source={source} components={mdxComponents} />
          </div>
        </article>
      </main>
    </Layout>
  );
};

export default BookPage;