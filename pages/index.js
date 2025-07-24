// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout'; // Ensure this path is correct for Layout.tsx

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
          <p className="text-xl text-charcoal mb-8 font-body">
            Visionary Entrepreneur, Author, and Creative Force
          </p>
          <div className="space-x-4">
            <Link href="/about" className="px-6 py-3 bg-primary text-cream rounded-full font-semibold hover:bg-gold transition font-body">
              Learn More
            </Link>
            <Link href="/contact" className="px-6 py-3 border border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-cream transition font-body">
              Contact
            </Link>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Blog</h2>
            <p className="text-charcoal mb-4 font-body">Explore articles on personal growth, entrepreneurship, and societal impact.</p>
            <Link href="/blog" className="text-primary hover:underline font-body">Read Blog →</Link>
          </div>
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Books</h2>
            <p className="text-charcoal mb-4 font-body">Discover published works and insightful narratives.</p>
            <Link href="/books" className="text-primary hover:underline font-body">View Books →</Link>
          </div>
          <div className="bg-warmWhite p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-display font-semibold mb-3 text-primary">Brands</h2>
            <p className="text-charcoal mb-4 font-body">Learn about my innovative ventures and brands.</p>
            <Link href="/brands" className="text-primary hover:underline font-body">Explore Brands →</Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}