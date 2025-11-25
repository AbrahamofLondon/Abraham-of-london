// pages/books/index.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { getAllBooks } from '@/lib/books';
import type { BookMeta } from '@/types/index';

interface BooksPageProps {
  books: BookMeta[];
}

export default function BooksPage({ books }: BooksPageProps) {
  const hasBooks = books && books.length > 0;

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
        {hasBooks ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <article 
                key={book.slug}
                className="bg-charcoal-light border border-gold/20 rounded-lg overflow-hidden hover:border-gold/40 transition-colors group h-full flex flex-col"
              >
                <Link href={`/books/${book.slug}`} className="flex flex-col h-full">
                  <div className="p-6 cursor-pointer flex flex-col flex-grow">
                    <h2 className="text-xl font-serif font-light text-gold mb-3 group-hover:text-gold-light transition-colors">
                      {book.title}
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                      by {book.author || "Abraham of London"}
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed flex-grow">
                      {book.excerpt || book.description || "A valuable resource for leaders and thinkers."}
                    </p>
                    {book.date && (
                      <time 
                        className="text-sm text-gray-400 block mt-4"
                        dateTime={book.date}
                      >
                        {new Date(book.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </time>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-charcoal-light border border-gold/20 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-serif text-gold mb-4">Books Coming Soon</h3>
              <p className="text-gray-300 mb-4">
                Our book collection is currently being prepared with valuable insights and frameworks.
              </p>
              <Link 
                href="/content"
                className="inline-block bg-gold text-charcoal px-6 py-2 rounded font-semibold hover:bg-gold-light transition-colors"
              >
                Browse All Content
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const books = await getAllBooks();
    
    // Ensure ALL data is serializable - replace undefined with null
    const serializableBooks = books.map(book => ({
      ...book,
      // Required fields
      slug: book.slug,
      title: book.title,
      
      // String fields that might be undefined
      excerpt: book.excerpt ?? null,
      description: book.description ?? null,
      subtitle: book.subtitle ?? null,
      coverImage: book.coverImage ?? null,
      author: book.author ?? null,
      date: book.date ?? null,
      readTime: book.readTime ?? null,
      lastModified: book.lastModified ?? null, // This was missing!
      category: book.category ?? null,
      isbn: book.isbn ?? null,
      publisher: book.publisher ?? null,
      publishedDate: book.publishedDate ?? null,
      language: book.language ?? null,
      price: book.price ?? null,
      purchaseLink: book.purchaseLink ?? null,
      
      // Array fields
      tags: book.tags ?? [],
      
      // Number fields
      pages: book.pages ?? null,
      rating: book.rating ?? null,
      
      // Boolean fields
      featured: book.featured ?? false,
      published: book.published ?? false,
      draft: book.draft ?? false,
      
      // Typed fields
      format: book.format ?? null,
    }));

    return {
      props: {
        books: serializableBooks,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching books:', error);
    return {
      props: {
        books: [],
      },
    };
  }
}