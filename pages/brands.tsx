// pages/brands.tsx
import React from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

export default function BrandsPage() { // Ensure this is a default export
  return (
    <Layout>
      <Head>
        <title>Brands & Ventures | Abraham of London</title>
        <meta name="description" content="Explore the innovative brands and ventures founded or led by Abraham of London, including Alomarada and Endureluxe." />
      </Head>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">My Ventures & Brands</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          A portfolio of innovation, sustainability, and impact.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Example Brand 1: Alomarada */}
            <div className="brand-item bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <img src="/assets/images/alomarada-logo.webp" alt="Alomarada Logo" className="w-32 h-32 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-center">Alomarada</h3>
                <p className="text-gray-700 text-center">Redefining luxury through sustainable practices and exquisite craftsmanship.</p>
                <div className="mt-4 text-center">
                    <Link href="https://alomarada.com" passHref>
                        <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Learn More →</a>
                    </Link>
                </div>
            </div>

            {/* Example Brand 2: Endureluxe */}
            <div className="brand-item bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <img src="/assets/images/endureluxe-logo.webp" alt="Endureluxe Logo" className="w-32 h-32 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-center">Endureluxe</h3>
                <p className="text-gray-700 text-center">High-performance sustainable materials for a durable future.</p>
                <div className="mt-4 text-center">
                    <Link href="https://endureluxe.com" passHref>
                        <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Learn More →</a>
                    </Link>
                </div>
            </div>

            {/* Add more brand items as needed */}
        </div>
      </div>
    </Layout>
  );
}