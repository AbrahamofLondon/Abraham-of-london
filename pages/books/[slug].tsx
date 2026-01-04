import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { getServerAllBooks, getServerBookBySlug } from '@/lib/server/content';
import BookHero from '@/components/books/BookHero';
import BookDetails from '@/components/books/BookDetails';
import BookContent from '@/components/books/BookContent';
import PurchaseOptions from '@/components/books/PurchaseOptions';
import BookReviews from '@/components/books/BookReviews';
import RelatedBooks from '@/components/books/RelatedBooks';

interface Book {
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  slug: string;
  url: string;
  isbn?: string;
  author?: string;
  publisher?: string;
  pages?: number;
  publishedDate?: string;
  description?: string;
}

interface Props {
  book: Book;
  source: MDXRemoteSerializeResult;
}

const BookPage: NextPage<Props> = ({ book, source }) => {
  const metaDescription = book.excerpt || book.description || 'A book by Abraham of London';

  return (
    <Layout>
      <Head>
        <title>{book.title} | Books | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={book.coverImage || '/assets/images/book-default.jpg'} />
        <meta property="og:type" content="book" />
        {book.isbn && <meta property="book:isbn" content={book.isbn} />}
        {book.author && <meta property="book:author" content={book.author} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Book Hero Section */}
        <BookHero 
          title={book.title}
          author={book.author}
          coverImage={book.coverImage}
          excerpt={book.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                {/* Book Details */}
                <BookDetails 
                  isbn={book.isbn}
                  publisher={book.publisher}
                  pages={book.pages}
                  publishedDate={book.publishedDate}
                />

                {/* Book Content */}
                <div className="mt-12">
                  <BookContent>
                    <MDXRemote {...source} />
                  </BookContent>
                </div>

                {/* Purchase Options */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <PurchaseOptions book={book} />
                </div>

                {/* Reviews */}
                <div className="mt-12">
                  <BookReviews bookTitle={book.title} />
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                {/* Related Books */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Books</h3>
                  <RelatedBooks currentBookSlug={book.slug} />
                </div>

                {/* Download Options */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Formats</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                      📘 PDF Version
                    </button>
                    <button className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                      📱 EPUB Version
                    </button>
                    <button className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                      🎧 Audiobook
                    </button>
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
  const books = await getServerAllBooks();
  
  return {
    paths: books
      .filter(book => book && !book.draft)
      .map((book) => ({
        params: { slug: book.slug || book._raw.flattenedPath.replace('books/', '') },
      })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const bookData = await getServerBookBySlug(slug);
  if (!bookData) return { notFound: true };

  const book = {
    title: bookData.title || "Book",
    excerpt: bookData.excerpt || bookData.description || null,
    coverImage: bookData.coverImage || null,
    slug: bookData.slug || slug,
    url: `/books/${bookData.slug || slug}`,
    isbn: bookData.isbn,
    author: bookData.author,
    publisher: bookData.publisher,
    pages: bookData.pages,
    publishedDate: bookData.date,
    description: bookData.description,
  };

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(bookData.body || " ", {
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
      book,
      source,
    },
    revalidate: 1800,
  };
};