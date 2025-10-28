// pages/books/index.tsx (Restored Book Listing Page)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';

// Define the shape of your book data for type safety
interface BookMeta {
  slug: string;
  title: string;
  author: string;
  image?: string;
  summary?: string;
  // Add any other frontmatter fields you need to display on the list
}

interface BooksPageProps {
  books: BookMeta[];
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

// This page uses getServerSideProps to fetch all book data for the list
export const getServerSideProps: GetServerSideProps<BooksPageProps> = async () => {
  const booksDirectory = path.join(process.cwd(), 'content', 'books');
  let books: BookMeta[] = [];

  try {
    // Read all filenames from the 'content/books' directory
    const filenames = fs.readdirSync(booksDirectory);

    // Process each .mdx file to extract just the frontmatter
    books = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(booksDirectory, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        // Return only the necessary metadata for the listing page
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Book',
          author: frontmatter.author || 'Unknown Author',
          image: frontmatter.image || null,
          summary: frontmatter.summary || null,
        } as BookMeta;
      })
      // Optional: Sort the books if you have a date or other sorting field
      // .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.error("Error fetching book list for index page:", error);
    // If the file system operation fails, return an empty array gracefully
    books = []; 
  }

  return {
    props: {
      books,
    },
  };
};

/* -------------------- Component Rendering -------------------- */

export default function BooksPage({ books }: BooksPageProps) {
  return (
    <main className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">All Books</h1>

      {books.length === 0 ? (
        <p className="text-gray-600">No books found or an error occurred while loading them.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <Link key={book.slug} href={`/books/${book.slug}`} className="block border rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                {book.image && (
                  <img
                    src={book.image}
                    alt={`Cover for ${book.title}`}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-1">{book.title}</h2>
                  <p className="text-sm text-gray-500 mb-3">By: {book.author}</p>
                  {book.summary && (
                    <p className="text-gray-700 text-sm line-clamp-3">{book.summary}</p>
                  )}
                  <span className="mt-4 inline-block text-blue-600 font-semibold">Read More &rarr;</span>
                </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}