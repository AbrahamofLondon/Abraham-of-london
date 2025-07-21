// pages/books/index.tsx
import React from 'react';
import Link from 'next/link';

// Dummy book data - you can replace with real data fetch
const books = [
  { slug: 'the-great-gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { slug: 'to-kill-a-mockingbird', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { slug: '1984', title: '1984', author: 'George Orwell' },
];

const BookIndexPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Books List</h1>
      <ul>
        {books.map((book) => (
          <li key={book.slug} style={{ marginBottom: '1rem' }}>
            <Link href={`/book/${book.slug}`}>
              <a style={{ fontSize: '1.2rem', color: 'blue' }}>
                {book.title} — <i>{book.author}</i>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookIndexPage;
