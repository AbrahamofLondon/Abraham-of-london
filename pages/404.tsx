import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Abraham of London</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-6xl font-bold text-red-600">404</h1>
        <h2 className="text-2xl mt-4 mb-2">Oops! This page doesn’t exist.</h2>
        <p className="text-gray-600 mb-6">
          The page you’re looking for might have been removed or relocated.
        </p>
        <Link href="/" className="text-blue-600 hover:underline text-lg">
          ← Back to Homepage
        </Link>
      </div>
    </>
  );
}
