// pages/brands.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/Layout';

const brands = [
  {
    name: 'Alomarada',
    description: 'Redefining development through ethical market exploration and human capital growth.',
    logo: '/assets/images/logo/alomarada.svg',
    url: 'https://alomarada.com',
  },
  {
    name: 'Endureluxe',
    description: 'High-performance luxury fitness equipment and interactive community.',
    logo: '/assets/images/logo/endureluxe.svg',
    url: 'https://endureluxe.com',
  },
];

export default function BrandsPage() {
  return (
    <Layout>
      <Head>
        <title>Ventures & Brands | Abraham of London</title>
        <meta
          name="description"
          content="Explore ventures by Abraham of London, including Alomarada and Endureluxe. Rooted in legacy, innovation, and impact."
        />
        <meta property="og:title" content="Ventures & Brands | Abraham of London" />
        <meta property="og:description" content="Discover brands shaped by Abraham’s vision of legacy and leadership." />
        <meta property="og:image" content="/assets/social/og-image.jpg" />
        <meta property="og:url" content="https://abraham-of-london.netlify.app/brands" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Header */}
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

      {/* Abraham of London Brand */}
      <div className="max-w-5xl mx-auto py-20 px-4">
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg mb-20 hover:scale-[1.02] transition-transform duration-300">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-[250px] h-[125px] mx-auto md:mx-0">
              <Image
                src="/assets/images/logo/abraham-of-london-logo.svg"
                alt="Abraham of London brand logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Abraham of London</h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
                This is the core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures. All other projects are branches of this central mission.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Ventures Section */}
        <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">Sub-Ventures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="bg-white p-8 rounded-xl shadow-md text-center hover:scale-105 hover:shadow-lg transition-transform duration-300"
            >
              <div className="relative w-[150px] h-[150px] mx-auto mb-6">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  fill
                  className="object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="text-3xl font-semibold mb-2">{brand.name}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">{brand.description}</p>
              <Link
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${brand.name} website`}
                className="inline-flex items-center text-blue-600 hover:underline text-lg font-medium"
              >
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.293 2.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L14 5.414V17a1 1 0 11-2 0V5.414l-3.293 3.293a1 1 0 01-1.414-1.414l5-5z" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
