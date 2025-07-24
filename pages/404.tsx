// pages/404.tsx
import React from 'react';
import Layout from '../components/Layout'; // Adjust path

export default function Custom404() {
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>404 - Page Not Found</h1>
        <p>Oops! The page you're looking for does not exist.</p>
        <a href="/">Go back home</a>
      </div>
    </Layout>
  );
}