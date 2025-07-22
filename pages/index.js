// pages/index.js
import Head from 'next/head';
import Layout from '../components/Layout'; // Ensure this path is correct for Layout.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Abraham of London - Visionary Entrepreneur, Author, Creative Force</title>
        <meta name="description" content="Official website of Abraham of London, visionary entrepreneur, author, and creative force." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen py-20 px-4 text-center">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="text-6xl font-display font-bold text-primary mb-4">
            ABRAHAM OF LONDON
          </h1>
          <p className="text-xl text-charcoal mb-8">
            Visionary Entrepreneur, Author, and Creative Force
          </p>
          <div className="space-x-4">
            <Link href="/about" className="px-6 py-3 bg-primary text-cream rounded-full font-semibold hover:bg-gold transition">
              Learn More
            </Link>
            <Link href="/contact" className="px-6 py-3 border border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-cream transition">
              Contact
            </Link>
          </div>
        </section>

        {/* Quick Links Section (Example) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Blog</h2>
            <p className="text-charcoal mb-4">Explore articles on personal growth, entrepreneurship, and societal impact.</p>
            <Link href="/blog" className="text-primary hover:underline">Read Blog →</Link>
          </div>
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Books</h2>
            <p className="text-charcoal mb-4">Discover published works and insightful narratives.</p>
            <Link href="/books" className="text-primary hover:underline">View Books →</Link>
          </div>
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Brands</h2>
            <p className="text-charcoal mb-4">Learn about my innovative ventures and brands.</p>
            <Link href="/brands" className="text-primary hover:underline">Explore Brands →</Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}