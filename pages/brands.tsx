// pages/brands.tsx
import React from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image'; // Ensure Image is imported

export default function BrandsPage() {
  return (
    <Layout> {/* This is the opening tag */}
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
            {/* Main Abraham of London Logo on Brands Page */}
            <div className="brand-item bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 col-span-1 md:col-span-2 text-center">
                <Image
                    src="/assets/images/logo/abraham-of-london-logo.svg" // Corrected path
                    alt="Abraham of London Logo"
                    width={200} // Adjust width as needed for display
                    height={100} // Adjust height as needed
                    className="mx-auto mb-4"
                />
                <h3 className="text-2xl font-semibold mb-2">Abraham of London</h3>
                <p className="text-gray-700">The core brand representing my personal work and vision.</p>
            </div>

            {/* Example Brand 1: Alomarada */}
            <div className="brand-item bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <Image
                    src="/assets/images/logo/alomarada.svg" // Corrected path
                    alt="Alomarada Logo"
                    width={128} // Corresponds to w-32 (128px) in Tailwind
                    height={128} // Corresponds to h-32 (128px) in Tailwind
                    className="mx-auto mb-4"
                />
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
                <Image
                    src="/assets/images/logo/endureluxe.svg" // Corrected path
                    alt="Endureluxe Logo"
                    width={128} // Corresponds to w-32 (128px) in Tailwind
                    height={128} // Corresponds to h-32 (128px) in Tailwind
                    className="mx-auto mb-4"
                />
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
    </Layout> // This is the closing tag that was missing or misplaced
  );
}