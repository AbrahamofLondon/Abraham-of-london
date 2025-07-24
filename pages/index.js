// pages/index.js
// This is your main home page file.
// For now, it just displays "Test". You'll replace this with your actual home page content later.

import Head from 'next/head'; // Import Head for meta tags

export default function Home() {
  return (
    <>
      <Head>
        <title>Abraham of London</title>
        <meta name="description" content="Welcome to the official website of Abraham of London. Explore books, blogs, and more." />
        {/* Add other SEO meta tags here */}
      </Head>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center py-10 px-4 bg-lightGrey">
        <h1 className="text-4xl font-display font-bold text-primary mb-4">
          Test
        </h1>
        <p className="text-lg text-charcoal">
          This is your home page. You can start building your content here!
        </p>
      </div>
    </>
  );
}