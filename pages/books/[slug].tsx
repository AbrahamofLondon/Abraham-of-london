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

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  const rawBook = getAllBooks().find((b) => normalizeSlug(b) === slug);

  if (!rawBook || isDraft(rawBook)) return { notFound: true };

  // SURGICAL EXTRACTION: Explicitly define primitives to bypass Proxy issues
  const book = {
    title: rawBook.title || "Book",
    description: rawBook.description || rawBook.excerpt || "",
    excerpt: rawBook.excerpt || null,
    coverImage: rawBook.coverImage || null,
    slug: slug,
    date: rawBook.date ? new Date(rawBook.date).toISOString() : null,
  };

  try {
    const source = await serialize(rawBook.body.raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });

    return { 
      props: { 
        book, 
        source: JSON.parse(JSON.stringify(source)) // Final POJO safety
      }, 
      revalidate: 1800 
    };
  } catch (e) {
    console.error(`[Build Error] Serialization failed for book: ${slug}`);
    return { notFound: true };
  }
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const title = book.title;
  const canonicalUrl = `${SITE}/books/${book.slug}`;

  return (
    <Layout title={title} description={book.description} canonicalUrl={canonicalUrl} ogImage={book.coverImage} ogType="article">
      <Head><link rel="canonical" href={canonicalUrl} /></Head>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-serif text-4xl text-cream border-b border-gold/10 pb-6">{title}</h1>
        <article className="prose prose-invert mt-8 max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default BookPage;