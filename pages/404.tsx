// pages/404.tsx
import React from 'react';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Abraham of London</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-6xl font-bold text-red-600">404</h1>
        <h2 className="text-2xl mt-4 mb-2">Oops! This page doesn&apos;t exist.</h2>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for might have been removed or relocated.
        </p>
        <a href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </a>
      </div>
    </>
  );
}
