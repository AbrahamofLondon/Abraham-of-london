import React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  slug: string;
}

interface BooksPageProps {
  books: Book[];
}

export default function BooksPage({ books = [] }: BooksPageProps) {
  return (
    <Layout
      title="Books"
      pageTitle="Recommended Books"
      transparentHeader={false}
    >
      <Head>
        <title>Recommended Books | Abraham of London</title>
        <meta
          name="description"
          content="Curated book recommendations from Abraham of London."
        />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-serif font-light text-cream mb-4">
            Recommended Books
          </h1>
          <p className="text-lg text-gray-300 font-light">
            Curated readings for thoughtful leaders
          </p>
        </header>

        {/* Books Grid */}
        {books && books.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <article
                key={book.id}
                className="bg-charcoal-light border border-gold/20 rounded-lg overflow-hidden hover:border-gold/40 transition-colors group"
              >
                <div className="p-6">
                  <h2 className="text-xl font-serif font-light text-gold mb-3 group-hover:text-gold-light transition-colors">
                    {book.title}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">by {book.author}</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {book.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg font-light">
              No books available at the moment.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Safe getStaticProps with error handling
export async function getStaticProps() {
  try {
    // Your data fetching logic here
    // Example:
    const books: Book[] = []; // Replace with actual data fetching

    return {
      props: {
        books,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    // Return empty props to prevent build failure
    return {
      props: {
        books: [],
      },
    };
  }
}
