// pages/books/index.tsx
import Head from 'next/head';
import Layout from '../../components/Layout';
import { getAllBooks, BookMeta } from '../../lib/books'; // Import BookMeta
import { GetStaticProps } from 'next';
import React, { useState, useMemo } from 'react';
import BookCard from '../../components/BookCard'; // Assuming you have a BookCard component

interface BooksPageProps {
  books: BookMeta[];
}

const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract unique tags from books
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    books.forEach(book => {
      book.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [books]);

  // Filter books based on selected tag
  const filteredBooks = useMemo(() => {
    if (!selectedTag) {
      return books;
    }
    return books.filter(book => book.tags?.includes(selectedTag));
  }, [books, selectedTag]);

  return (
    <Layout>
      <Head>
        <title>Abraham of London - Books</title>
        <meta name="description" content="Explore the collection of books by Abraham of London." />
      </Head>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Our Books</h1>

          {/* Tag Filter Section */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  selectedTag === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.slug}
                  slug={book.slug}
                  title={book.title}
                  coverImage={book.coverImage}
                  excerpt={book.excerpt}
                  author={book.author}
                  buyLink={book.buyLink}
                  genre={book.genre}
                  // No 'tags' prop needed for BookCard itself unless you specifically want to display them there
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No books found matching your criteria.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  // Ensure 'tags' is requested when fetching all books for the index page
  const books = getAllBooks([
    'slug',
    'title',
    'coverImage',
    'excerpt',
    'author',
    'buyLink',
    'genre',
    'description',
    'tags', // <--- IMPORTANT: Request the 'tags' field here
  ]);

  return {
    props: {
      books,
    },
    revalidate: 1, // Optional: Use ISR if you want to regenerate the page periodically
  };
};

export default BooksPage;