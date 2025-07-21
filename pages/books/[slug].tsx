import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const books = [
  {
    slug: 'fathering-without-fear-memoir',
    title: 'Fathering Without Fear: Memoir',
    author: 'Abraham Adaramola',
    description: `
This memoir offers an intimate and unfiltered look at the trials and triumphs of fatherhood.
It's a testament to courage, vulnerability, and the transformative power of love.
    `,
  },
  {
    slug: 'fathering-without-fear-romantic-novel',
    title: 'Fathering Without Fear: Romantic Novel',
    author: 'Abraham Adaramola',
    description: `
Dive into a heartfelt narrative where romance and legacy intertwine,
painting a vivid picture of love's resilience in the face of challenges.
    `,
  },
  {
    slug: 'fathering-without-fear-documentary',
    title: 'Fathering Without Fear: Full Documentary',
    author: 'Abraham Adaramola',
    description: `
A compelling documentary capturing the raw realities of fatherhood — the struggles,
the joys, and the untold stories — laying the foundation for something greater to come.
    `,
  },
];

export default function BookDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return <p>Loading...</p>;

  const book = books.find((b) => b.slug === slug);

  if (!book) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Book not found</h1>
        <Link href="/books"><a>← Back to books list</a></Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: 'auto' }}>
      <h1>{book.title}</h1>
      <h3>by {book.author}</h3>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{book.description.trim()}</p>
      <Link href="/books"><a style={{ display: 'inline-block', marginTop: 32 }}>← Back to books list</a></Link>
    </div>
  );
}
