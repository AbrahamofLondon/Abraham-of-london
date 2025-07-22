import React from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout'; // Adjust path as needed (should be '../../components/Layout')

const books = [
  // ... books array ...
];

export default function BooksIndexPage() {
  return (
    <Layout> {/* <--- Add Layout wrapper here */}
      <div style={{ padding: 24 }}>
        <h1>Books List</h1>
        <p>Explore the works of Abraham Adaramola, a journey unfolding the many dimensions of fatherhood.</p>
        <ul>
          {/* ... map books ... */}
        </ul>
        <p style={{ marginTop: 40, fontWeight: 'bold' }}>
          Stay tuned for a story that grows beyond pages...
        </p>
      </div>
    </Layout> {/* <--- Close Layout here */}
  );
}