// pages/books/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
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
  ArrowRight,
  Share2,
} from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllBooks, getBookBySlug } from "@/lib/books";

// IMPORTANT: define a fully serialisable shape for props.
// Do NOT use BookWithContent directly here.
type SerializableBook = {
  slug: string;
  title: string;
  author: string;
  description: string;
  excerpt: string;
  coverImage: string;
  subtitle: string;
  publisher: string;
  isbn: string;
  category: string;
  readTime: string;
  tags: string[];
  date: string; // ISO or "" – never undefined
  draft: boolean;
  featured: boolean;
  content: string; // MDX string or ""
};

interface Props {
  book: SerializableBook;
  mdxSource: MDXRemoteSerializeResult | null;
  siteUrl: string;
}

// ---------------------------------------------------------------------------
// STATIC EXPORT: PATHS
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  let books: { slug: string }[] = [];

  try {
    books = getAllBooks() ?? [];
  } catch (err) {
    console.error("getAllBooks() failed in getStaticPaths(/books/[slug]):", err);
  }

  const paths =
    books?.filter((b) => b.slug).map((book) => ({
      params: { slug: book.slug },
    })) ?? [];

  return {
    paths,
    // For `output: "export"`, fallback MUST be false
    fallback: false,
  };
};

// ---------------------------------------------------------------------------
// STATIC EXPORT: PROPS (NO ISR)
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string | undefined;

  if (!slug) {
    return { notFound: true };
  }

  try {
    const book = getBookBySlug(slug);

    if (!book) {
      return { notFound: true };
    }

    // MDX serialisation – if it fails, we still return a page
    let mdxSource: MDXRemoteSerializeResult | null = null;
    let contentString = "";

    if (book.content) {
      contentString = String(book.content);
      try {
        mdxSource = await serialize(contentString, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
          },
        });
      } catch (err) {
        console.error(`MDX serialize error for /books/${slug}:`, err);
        // mdxSource stays null; we'll fall back to description
      }
    }

    // Build a CLEAN, serialisable props object – no spread
    const serializableBook: SerializableBook = {
      slug: book.slug || slug,
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
      tags: Array.isArray(book.tags) ? book.tags : [],
      date: book.date
        ? new Date(book.date).toISOString().split("T")[0]
        : "",
      draft: Boolean(book.draft),
      featured: Boolean(book.featured),
      content: contentString,
    };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.abrahamoflondon.org";

    return {
      props: {
        book: serializableBook,
        mdxSource,
        siteUrl,
      },
    };
  } catch (err) {
    console.error(`getStaticProps error for /books/${slug}:`, err);

    // Soft-fail page so export does not die
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.abrahamoflondon.org";

    const fallbackBook: SerializableBook = {
      slug,
      title: "Book unavailable",
      author: "Abraham of London",
      description: "This book entry could not be built at export time.",
      excerpt: "",
      coverImage: "/images/book-placeholder.jpg",
      subtitle: "",
      publisher: "Abraham of London",
      isbn: "",
      category: "",
      readTime: "",
      tags: [],
      date: "",
      draft: false,
      featured: false,
      content: "",
    };

    return {
      props: {
        book: fallbackBook,
        mdxSource: null,
        siteUrl,
      },
    };
  }
};

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------

const BookPage: NextPage<Props> = ({ book, mdxSource, siteUrl }) => {
  const canonicalUrl = `${siteUrl}/books/${book.slug}`;

  // Structured data for SEO – filter out undefined
  const structuredDataRaw = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.description || book.excerpt || "",
    author: book.author
      ? {
          "@type": "Person",
          name: book.author,
        }
      : undefined,
    datePublished: book.date || undefined,
    publisher: {
      "@type": "Organization",
      name: book.publisher || "Abraham of London",
    },
    image: `${siteUrl}${book.coverImage}`,
    inLanguage: "en-GB",
    isbn: book.isbn || undefined,
  };

  const structuredData = Object.fromEntries(
    Object.entries(structuredDataRaw).filter(([_, v]) => v !== undefined),
  );

  const handleShare = React.useCallback(() => {
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : canonicalUrl;

    if (typeof navigator === "undefined") {
      return;
    }

    if (navigator.share) {
      navigator
        .share({
          title: book.title,
          text: book.excerpt || book.description || "",
          url: shareUrl,
        })
        .catch(() => {
          // ignore
        });
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // ignore
      });
    }
  }, [book.title, book.excerpt, book.description, canonicalUrl]);

  return (
    <Layout
      title={book.title}
      description={book.excerpt || book.description || ""}
      image={book.coverImage}
      structuredData={structuredData}
      ogType="book"
    >
      <Head>
        <meta property="og:type" content="book" />
        {book.author && (
          <meta property="book:author" content={book.author} />
        )}
        {book.date && (
          <meta property="book:release_date" content={book.date} />
        )}
        {book.category && (
          <meta property="book:tag" content={book.category} />
        )}
        {book.isbn && <meta property="book:isbn" content={book.isbn} />}
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <article className="mx-auto max-w-4xl px-4 py-12">
        {/* Book header */}
        <header className="mb-12">
          <div className="flex flex-col gap-8 md:flex-row">
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
                <p className="mt-4 text-xl text-gray-600">
                  By {book.author}
                </p>
              )}

              {book.subtitle && (
                <p className="mt-2 text-lg italic text-gray-500">
                  {book.subtitle}
                </p>
              )}

              {book.excerpt && (
                <p className="mt-6 text-lg text-gray-700">
                  {book.excerpt}
                </p>
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
                    <span className="text-gray-600">
                      {book.category}
                    </span>
                  </div>
                )}

                {book.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">
                      {book.readTime}
                    </span>
                  </div>
                )}

                {book.publisher && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-softGold" />
                    <span className="text-gray-600">
                      {book.publisher}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-softGold" />
                    <span className="text-sm text-gray-500">
                      Topics:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-200"
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
            <div className="space-y-4 text-gray-700">
              {book.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer navigation */}
        <footer className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-softGold transition-colors hover:text-gold"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to all books
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
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