/* pages/books/[slug].tsx - FIXED */
import React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";

// Server content layer
import { getServerAllBooks, getServerBookBySlug , getContentlayerData} from "@/lib/contentlayer-compat";

// MDX utilities (use simple components for build safety)
import { prepareMDX, simpleMdxComponents, sanitizeData } from "@/lib/server/md-utils";

// UI Components
import BookHero from "@/components/books/BookHero";
import BookDetails from "@/components/books/BookDetails";
import BookContent from "@/components/books/BookContent";
import PurchaseOptions from "@/components/books/PurchaseOptions";
import BookReviews from "@/components/books/BookReviews";
import RelatedBooks from "@/components/books/RelatedBooks";
import { Share2, Download, Layers } from "lucide-react";

type Book = {
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  slug: string;
  url: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  pages: number | null;
  publishedDate: string | null;
  description: string | null;
};

type Props = {
  book: Book;
  source: MDXRemoteSerializeResult;
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const metaDescription =
    book.excerpt || book.description || "A definitive volume from Abraham of London";

  return (
    <Layout>
      <Head>
        <title>{book.title} | Books | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content={book.coverImage || "/assets/images/book-default.jpg"}
        />
        <meta property="og:type" content="book" />
        {book.isbn ? <meta property="book:isbn" content={book.isbn} /> : null}
        {book.author ? <meta property="book:author" content={book.author} /> : null}
      </Head>

      <div className="min-h-screen bg-black selection:bg-amber-500 selection:text-black">
        {/* Institutional Hero Section */}
        <BookHero
          title={book.title}
          author={book.author}
          coverImage={book.coverImage}
          excerpt={book.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Main Manuscript Content */}
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-8 lg:p-16 shadow-2xl">
                {/* Physical Specifications */}
                <BookDetails
                  isbn={book.isbn}
                  publisher={book.publisher}
                  pages={book.pages}
                  publishedDate={book.publishedDate}
                />

                <div className="mt-12 prose prose-invert prose-amber max-w-none">
                  <BookContent>
                    {/* IMPORTANT: Use simpleMdxComponents for guaranteed availability */}
                    <MDXRemote {...source} components={simpleMdxComponents} />
                  </BookContent>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10">
                  <PurchaseOptions book={book} />
                </div>

                <div className="mt-12">
                  <BookReviews bookTitle={book.title} />
                </div>
              </div>
            </main>

            {/* Strategic Sidebar */}
            <aside className="lg:col-span-4 sticky top-24 self-start">
              <div className="space-y-8">
                {/* Related Volumes */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-serif font-semibold text-white mb-6 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-amber-500" />
                    Related Intelligence
                  </h3>
                  <RelatedBooks currentBookSlug={book.slug} />
                </div>

                {/* Digital Formats & Downloads */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-amber-200 mb-6 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Transmission Formats
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Standard PDF", icon: "📄" },
                      { label: "EPUB / E-Reader", icon: "📱" },
                      { label: "Institutional Audio", icon: "🎧" },
                    ].map((format) => (
                      <button
                        key={format.label}
                        className="w-full bg-white/5 text-gray-200 border border-white/10 rounded-xl px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-between group"
                        type="button"
                      >
                        <span>
                          {format.icon} {format.label}
                        </span>
                        <Share2 className="h-4 w-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookPage;

export const getStaticPaths: GetStaticPaths = async () => {
  
  await getContentlayerData();
  const books = await getServerAllBooks();
  
  const filteredBooks = books
    .filter((x: any) => x && !(x as any).draft)
    .filter((x: any) => {
      const slug = (x as any).slug || (x as any)._raw?.flattenedPath || "";
      return slug && !String(slug).includes("replace");
    });

  const paths =
    filteredBooks
      .filter((b: any) => b && !b.draft)
      .map((b: any) => {
        const slug =
          (typeof b.slug === "string" && b.slug) ||
          (typeof b._raw?.flattenedPath === "string"
            ? b._raw.flattenedPath.replace(/^books\//, "")
            : null);

        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const bookData: any = await getServerBookBySlug(slug);
  if (!bookData || bookData.draft) return { notFound: true };

  const rawMdx = bookData?.body?.raw ?? bookData?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  const book: Book = {
    title: bookData.title || "Untitled Volume",
    excerpt: bookData.excerpt || bookData.description || null,
    coverImage: bookData.coverImage || null,
    slug: bookData.slug || slug,
    url: `/books/${bookData.slug || slug}`,
    isbn: bookData.isbn ?? null,
    author: bookData.author ?? null,
    publisher: bookData.publisher ?? null,
    pages: bookData.pages ?? null,
    publishedDate: bookData.date ?? null,
    description: bookData.description ?? null,
  };

  // Sanitize ONLY the book model, NOT the MDX source.
  return {
    props: { book: sanitizeData(book), source },
    revalidate: 1800,
  };
};

