// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Layout from "@/components/Layout";

// Import your custom MDX components
import Quote from "@/components/Quote";
import Callout from "@/components/Callout";
import Divider from "@/components/Divider";

import { getAllBooksMeta, getBookBySlug } from "@/lib/server/books-data";
import type { BookMeta } from "@/types/index";

type PageProps = {
  meta: BookMeta;
  mdxSource: MDXRemoteSerializeResult | null;
};

// Create a proper type for MDX components
type MDXComponentProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

// Create components object for MDX with proper typing
const mdxComponents = {
  Quote: Quote as React.ComponentType<MDXComponentProps>,
  Callout: Callout as React.ComponentType<MDXComponentProps>,
  Divider: Divider as React.ComponentType<MDXComponentProps>,
};

export default function BookPage({ meta, mdxSource }: PageProps) {
  const {
    title,
    subtitle,
    description,
    author,
    date,
    coverImage,
    readTime,
    category,
    publishedDate,
    pages,
    language,
    isbn,
    rating,
    price,
    purchaseLink,
  } = meta;

  const pageTitle = `${title} | Books`;

  return (
    <Layout pageTitle={pageTitle}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description ?? subtitle ?? title} />
      </Head>

      <article className="mx-auto max-w-4xl px-6 py-14 text-cream">
        {/* HEADER */}
        <header className="mb-10">
          <h1 className="mb-4 font-serif text-4xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mb-3 text-lg text-gray-300">{subtitle}</p>
          )}
          {author && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Author:</span> {author}
            </p>
          )}
          {date && (
            <p className="text-sm text-gray-400">
              <span className="font-semibold">Date:</span>{" "}
              {new Date(date).toLocaleDateString("en-GB")}
            </p>
          )}
        </header>

        {/* COVER IMAGE */}
        {coverImage && (
          <div className="mb-12">
            <Image
              src={coverImage}
              alt={title}
              width={800}
              height={1100}
              className="mx-auto rounded-xl shadow-xl"
            />
          </div>
        )}

        {/* METADATA GRID */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2 text-sm text-gray-300">
          {category && (
            <div>
              <span className="font-semibold">Category:</span> {category}
            </div>
          )}
          {readTime && (
            <div>
              <span className="font-semibold">Read time:</span> {readTime}
            </div>
          )}
          {publishedDate && (
            <div>
              <span className="font-semibold">Published:</span> {publishedDate}
            </div>
          )}
          {pages && (
            <div>
              <span className="font-semibold">Pages:</span> {pages}
            </div>
          )}
          {language && (
            <div>
              <span className="font-semibold">Language:</span> {language}
            </div>
          )}
          {isbn && (
            <div>
              <span className="font-semibold">ISBN:</span> {isbn}
            </div>
          )}
          {rating && (
            <div>
              <span className="font-semibold">Rating:</span> {rating}/5
            </div>
          )}
          {price && (
            <div>
              <span className="font-semibold">Price:</span> {price}
            </div>
          )}
        </section>

        {/* PURCHASE CTA */}
        {purchaseLink && (
          <div className="mb-12">
            <a
              href={purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-softGold px-6 py-3 text-black font-semibold hover:bg-softGold/90 transition"
            >
              Purchase Book
            </a>
          </div>
        )}

        {/* CONTENT - Using MDXRemote instead of dangerouslySetInnerHTML */}
        <section className="prose prose-invert prose-lg max-w-none">
          {mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents} />
          ) : (
            <p className="text-gray-400 italic">
              Full content for this book is not yet available.
            </p>
          )}
        </section>
      </article>
    </Layout>
  );
}

/* ------------------------------------------
 *  STATIC GENERATION
 * ------------------------------------------ */

export const getStaticPaths: GetStaticPaths = async () => {
  const metas = getAllBooksMeta();

  return {
    paths: metas.map((m) => ({
      params: { slug: m.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug);

  const book = getBookBySlug(slug);

  if (!book) {
    return { notFound: true };
  }

  // Clean the content - remove import statements
  let cleanContent = book.content || '';
  
  // Remove import statements from MDX content
  cleanContent = cleanContent.replace(
    /^import\s+.*?\s+from\s+["'][^"']+["'];?\s*$/gm, 
    ''
  ).trim();

  let mdxSource: MDXRemoteSerializeResult | null = null;
  
  if (cleanContent) {
    try {
      mdxSource = await serialize(cleanContent, {
        mdxOptions: {
          remarkPlugins: [],
          rehypePlugins: [],
        },
      });
    } catch (error) {
      console.error(`Error serializing MDX for ${slug}:`, error);
    }
  }

  return {
    props: {
      meta: {
        ...book,
        // ensure all undefineds → null for JSON
        subtitle: book.subtitle ?? null,
        description: book.description ?? null,
        excerpt: book.excerpt ?? null,
        coverImage: book.coverImage ?? null,
        date: book.date ?? null,
        author: book.author ?? null,
        readTime: book.readTime ?? null,
        lastModified: book.lastModified ?? null,
        category: book.category ?? null,
        isbn: book.isbn ?? null,
        publisher: book.publisher ?? null,
        publishedDate: book.publishedDate ?? null,
        language: book.language ?? null,
        price: book.price ?? null,
        purchaseLink: book.purchaseLink ?? null,
        tags: book.tags ?? null,
        format: book.format ?? null,
        pages: book.pages ?? null,
        rating: book.rating ?? null,
        featured: book.featured ?? null,
        published: book.published ?? null,
        draft: book.draft ?? null,
        status: book.status ?? null,
      },
      mdxSource,
    },
  };
};