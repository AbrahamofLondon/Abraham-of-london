// pages/brands.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';

export default function BrandsPage() {
  return (
    <Layout>
      <Head>
        <title>Ventures & Brands | Abraham of London</title>
        <meta name="description" content="Explore ventures by Abraham of London, including Alomarada and Endureluxe." />
      </Head>

      <div className="bg-gray-50">
        <div className="max-w-5xl mx-auto py-24 px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900">
            My Ventures & Brands
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            A portfolio of innovation, sustainability, and impact, all under the umbrella of Abraham of London.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-20 px-4">
        {/* The main brand: Abraham of London */}
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg mb-20 transform transition-transform duration-300 hover:scale-[1.02]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Image
              src="/assets/images/logo/abraham-of-london-logo.svg"
              alt="Abraham of London Logo"
              width={250}
              height={125}
              className="mx-auto md:mx-0"
            />
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Abraham of London</h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
                This is the core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures. All other projects are branches of this central mission.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-brands section */}
        <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">
          Sub-Ventures
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Alomarada Card */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <Image
              src="/assets/images/logo/alomarada.svg"
              alt="Alomarada Logo"
              width={150}
              height={150}
              className="mx-auto mb-6"
            />
            <h3 className="text-3xl font-semibold mb-2">Alomarada</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Redefining development through ethical market exploration and human capital growth.
            </p>
            <Link
              href="https://alomarada.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline text-lg font-medium"
            >
              Learn More
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* Endureluxe Card */}
          <div className="bg-white p-8 rounded-xl shadow-md text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <Image
              src="/assets/images/logo/endureluxe.svg"
              alt="Endureluxe Logo"
              width={150}
              height={150}
              className="mx-auto mb-6"
            />
            <h3 className="text-3xl font-semibold mb-2">Endureluxe</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              High-performance luxury fitness equipments and interactive community.
            </p>
            <Link
              href="https://endureluxe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline text-lg font-medium"
            >
              Learn More
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}