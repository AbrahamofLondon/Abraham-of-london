// pages/brands/index.tsx 

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Define the shape of your Brand data
interface BrandMeta {
  slug: string;
  title: string;
  category: string;
  logo?: string;
  description?: string;
  // Add any other frontmatter fields for the list view
}

interface BrandsPageProps {
  brands: BrandMeta[];
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<BrandsPageProps> = async () => {
  const brandsDirectory = path.join(process.cwd(), 'content', 'brands');
  let brands: BrandMeta[] = [];

  try {
    // Read all filenames from the 'content/brands' directory
    const filenames = fs.readdirSync(brandsDirectory);

    // Process each .mdx file to extract just the frontmatter
    brands = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(brandsDirectory, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        // Extract necessary metadata
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Brand',
          category: frontmatter.category || 'General',
          logo: frontmatter.logo || null,
          description: frontmatter.description || null,
        } as BrandMeta;
      });
      // Optional: Add sorting logic here if needed
      // .sort((a, b) => a.title.localeCompare(b.title));

  } catch (error) {
    // This often happens if the 'content/brands' directory is missing
    console.error("Error fetching brand list for index page:", error);
    brands = []; 
  }

  return {
    props: {
      brands,
    },
  };
};

/* -------------------- Component Rendering -------------------- */

export default function BrandsPage({ brands }: BrandsPageProps) {
  return (
    <>
      <Head>
        <title>Brands & Resources</title>
      </Head>
      <main className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">Brands & Initiatives</h1>

        {brands.length === 0 ? (
          <p className="text-gray-600">No brands or resources found. Check your `content/brands` directory.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand) => (
              // Link to the dynamic brand page (assuming you have a pages/brands/[slug].tsx)
              <Link 
                key={brand.slug} 
                href={`/brands/${brand.slug}`} 
                className="block border rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start">
                  {brand.logo && (
                    <img
                      src={brand.logo}
                      alt={`${brand.title} Logo`}
                      className="w-12 h-12 object-contain mr-4 flex-shrink-0"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold mb-1">{brand.title}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{brand.category}</p>
                  </div>
                </div>
                {brand.description && (
                  <p className="text-gray-700 text-sm mt-4 line-clamp-3">{brand.description}</p>
                )}
                <span className="mt-4 inline-block text-blue-600 font-semibold">View Details &rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}