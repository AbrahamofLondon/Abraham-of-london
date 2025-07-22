import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout'; // Adjust path as needed (should be '../../components/Layout')

const books = [
  // ... books array ...
];

export default function BookDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return <p>Loading...</p>;

  const book = books.find((b) => b.slug === slug);

  if (!book) {
    return (
      <Layout> {/* <--- Add Layout wrapper here for 404/not found */}
        <div style={{ padding: 24 }}>
          <h1>Book not found</h1>
          <Link href="/books"><a>← Back to books list</a></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout> {/* <--- Add Layout wrapper here for main content */}
      <div style={{ padding: 24, maxWidth: 600, margin: 'auto' }}>
        <h1>{book.title}</h1>
        <h3>by {book.author}</h3>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{book.description.trim()}</p>
        <Link href="/books"><a style={{ display: 'inline-block', marginTop: 32 }}>← Back to books list</a></Link>
      </div>
    </Layout> {/* <--- Close Layout here */}
  );
}