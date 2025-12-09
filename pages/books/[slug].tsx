// pages/books/[slug].tsx - ENHANCED VERSION WITH STRUCTURED DATA
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  Calendar,
  Clock,
  Tag,
  Bookmark,
  MessageCircle,
  ArrowRight,
  Share2,
  Eye,
} from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/books";
import type { BookWithContent } from "@/lib/books";

interface Props {
  book: BookWithContent;
  mdxSource: MDXRemoteSerializeResult | null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getAllBooks();

  const paths =
    books?.map((book) => ({
      params: { slug: book.slug },
    })) || [];

  return {
    paths,
    fallback: false, // ✅ required for next expor
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  const book = getBookBySlug(slug);

  if (!book) {
    return {
      notFound: true,
    };
  }

  let mdxSource: MDXRemoteSerializeResult | null = null;

  if (book.content) {
    mdxSource = await serialize(book.content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
      },
    });
  }

  // Ensure all fields have proper defaults for serialization
  const serializableBook = {
    ...book,
    // Ensure string fields are never undefined
    title: book.title || "",
    author: book.author || "",
    description: book.description || "",
    excerpt: book.excerpt || "",
    coverImage: book.coverImage || "/images/book-placeholder.jpg",
    subtitle: book.subtitle || "",
    publisher: book.publisher || "",
    isbn: book.isbn || "",
    category: book.category || "",
    readTime: book.readTime || "",
    // Ensure arrays are never undefined
    tags: book.tags || [],
    // Ensure date is properly formatted
    date: book.date ? new Date(book.date).toISOString().split('T')[0] : "",
    // Ensure booleans have defaults
    draft: book.draft || false,
    featured: book.featured || false,
  };

  return {
    props: {
      book: serializableBook,
      mdxSource,
    },
    revalidate: 3600,
  };
};

const BookPage: NextPage<Props> = ({ book, mdxSource }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-gray-600">Loading book...</p>
        </div>
      </Layout>
    );
  }

  // Create structured data for the book
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "description": book.description || book.excerpt || "",
    "author": book.author ? {
      "@type": "Person",
      "name": book.author
    } : undefined,
    "datePublished": book.date,
    "publisher": {
      "@type": "Organization",
      "name": book.publisher || "Abraham of London"
    },
    "image": book.coverImage,
    "inLanguage": "en-GB",
    "isbn": book.isbn || undefined,
  };

  // Filter out undefined values from structured data
  const cleanStructuredData = Object.fromEntries(
    Object.entries(structuredData).filter(([_, v]) => v !== undefined)
  );

  return (
    <Layout
      title={book.title}
      description={book.excerpt || book.description || ""}
      image={book.coverImage} // Using image prop which Layout handles as ogImage
      structuredData={cleanStructuredData}
      ogType="book"
    >
      <Head>
        <meta property="og:type" content="book" />
        {book.author && <meta property="book:author" content={book.author} />}
        {book.date && <meta property="book:release_date" content={book.date} />}
        {book.category && <meta property="book:tag" content={book.category} />}
        {book.isbn && <meta property="book:isbn" content={book.isbn} />}
      </Head>

      <article className="mx-auto max-w-4xl px-4 py-12">
        {/* Book header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover image */}
            <div className="md:w-1/3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>
            </div>

            {/* Book info */}
            <div className="md:w-2/3">
              <h1 className="font-serif text-4xl font-bold text-deepCharcoal md:text-5xl">
                {book.title}
              </h1>
              
              {book.author && (
                <p className="mt-4 text-xl text-gray-600">By {book.author}</p>
              )}

              {book.subtitle && (
                <p className="mt-2 text-lg text-gray-500 italic">{book.subtitle}</p>
              )}

              {book.excerpt && (
                <p className="mt-6 text-lg text-gray-700">{book.excerpt}</p>
              )}

              {/* Metadata */}
              <div className="mt-8 flex flex-wrap gap-4">
                {book.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">{book.date}</span>
                  </div>
                )}

                {book.category && (
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">{book.category}</span>
                  </div>
                )}

                {book.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">{book.readTime}</span>
                  </div>
                )}

                {book.publisher && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">{book.publisher}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-softGold" />
                    <span className="text-sm text-gray-500">Topics:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg mx-auto max-w-none">
          {mdxSource ? (
            <MDXRemote {...mdxSource} components={mdxComponents} />
          ) : book.description ? (
            <div className="text-gray-700 space-y-4">
              {book.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>

        {/* Related books or navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-softGold hover:text-gold transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to all books
            </Link>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: book.title,
                    text: book.excerpt || book.description || '',
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </footer>
      </article>
    </Layout>
  );
};

export default BookPage;