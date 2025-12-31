// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllBooks, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";

type Props = {
  book: {
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    slug: string;
    url: string; // /books/<slug>
  };
  source: MDXRemoteSerializeResult;
};

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllBooks()
    .filter((b: any) => !isDraft(b))
    .map((b: any) => ({ params: { slug: normalizeSlug(b) } }))
    .filter((p: any) => Boolean(p?.params?.slug));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const raw = getAllBooks().find((b: any) => normalizeSlug(b) === slug);
  if (!raw || isDraft(raw)) return { notFound: true };

  const bodyRaw =
    typeof raw?.body?.raw === "string"
      ? raw.body.raw
      : typeof raw?.content === "string"
      ? raw.content
      : "";

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(bodyRaw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return {
    props: {
      book: {
        title: raw.title ?? "Book",
        excerpt: raw.excerpt ?? raw.description ?? null,
        coverImage: raw.coverImage ?? null,
        slug,
        url: `/books/${slug}`,
      },
      source,
    },
    revalidate: 1800,
  };
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const canonicalUrl = `${SITE}${book.url}`;

  return (
    <Layout title={book.title} description={book.excerpt ?? undefined} canonicalUrl={canonicalUrl}>
      <Head>
        <title>{book.title} | Abraham of London</title>
        <link rel="canonical" href={canonicalUrl} />
        {book.excerpt ? <meta name="description" content={book.excerpt} /> : null}
        {book.coverImage ? (
          <>
            <meta property="og:image" content={book.coverImage} />
            <meta name="twitter:image" content={book.coverImage} />
          </>
        ) : null}
        <meta property="og:type" content="book" />
      </Head>

      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-6 font-serif text-4xl font-semibold text-cream">{book.title}</h1>

        <div className="prose prose-invert max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </div>
      </article>
    </Layout>
  );
};

export default BookPage;
