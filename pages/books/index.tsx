import React from 'react';
import Link from 'next/link';

const books = [
  {
    slug: 'fathering-without-fear-memoir',
    title: 'Fathering Without Fear: Memoir',
    author: 'Abraham Adaramola',
    teaser: 'An intimate journey through fatherhood, challenges, and courage.'
  },
  {
    slug: 'fathering-without-fear-romantic-novel',
    title: 'Fathering Without Fear: Romantic Novel',
    author: 'Abraham Adaramola',
    teaser: 'A heartfelt story blending love and legacy.'
  },
  {
    slug: 'fathering-without-fear-documentary',
    title: 'Fathering Without Fear: Full Documentary',
    author: 'Abraham Adaramola',
    teaser: 'A revealing documentary exploring fatherhood’s raw realities.'
  },
];

export default function BooksIndexPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Books List</h1>
      <p>Explore the works of Abraham Adaramola, a journey unfolding the many dimensions of fatherhood.</p>
      <ul>
        {books.map(({ slug, title, author, teaser }) => (
          <li key={slug} style={{ marginBottom: 20 }}>
            <Link href={`/books/${slug}`}>
              <a style={{ fontSize: 18, color: '#0070f3', textDecoration: 'underline' }}>{title}</a>
            </Link>
            <p style={{ margin: 4, fontStyle: 'italic' }}>{teaser}</p>
            <small>by {author}</small>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 40, fontWeight: 'bold' }}>
        Stay tuned for a story that grows beyond pages...
      </p>
    </div>
  );
}
