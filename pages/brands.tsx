import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function BrandsPage() {
  return (
    <>
      <Head>
        <title>Brands & Ventures | Abraham of London</title>
        <meta name="description" content="Explore ventures by Abraham of London, including Alomarada and Endureluxe." />
      </Head>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">My Ventures & Brands</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">
          A portfolio of innovation, sustainability, and impact.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Image
              src="/assets/images/logo/abraham-of-london-logo.svg"
              alt="Abraham of London Logo"
              width={200}
              height={100}
              className="mx-auto mb-4"
            />
            <h3 className="text-2xl font-semibold mb-2">Abraham of London</h3>
            <p className="text-gray-700">The core brand representing my personal work and vision.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Image
              src="/assets/images/logo/alomarada.svg"
              alt="Alomarada Logo"
              width={128}
              height={128}
              className="mx-auto mb-4"
            />
            <h3 className="text-2xl font-semibold mb-2">Alomarada</h3>
            <p className="text-gray-700">
              Redefining development through ethical market exploration and human capital growth.
            </p>
            <Link href="https://alomarada.com" legacyBehavior>
              <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Learn More →
              </a>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Image
              src="/assets/images/logo/endureluxe.svg"
              alt="Endureluxe Logo"
              width={128}
              height={128}
              className="mx-auto mb-4"
            />
            <h3 className="text-2xl font-semibold mb-2">Endureluxe</h3>
            <p className="text-gray-700">High-performance sustainable materials for a durable future.</p>
            <Link href="https://endureluxe.com" legacyBehavior>
              <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Learn More →
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
