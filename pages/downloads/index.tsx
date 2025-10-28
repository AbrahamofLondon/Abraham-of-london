// pages/downloads/index.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Define the shape of your Download data
interface DownloadMeta {
  slug: string;
  title: string;
  category: string;
  description: string;
  // Add metadata specific to downloads (e.g., fileType, fileSize)
  fileType: string; 
}

interface DownloadsPageProps {
  downloads: DownloadMeta[];
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<DownloadsPageProps> = async () => {
  const downloadsDirectory = path.join(process.cwd(), 'content', 'downloads');
  let downloads: DownloadMeta[] = [];

  try {
    // Read all filenames from the 'content/downloads' directory
    const filenames = fs.readdirSync(downloadsDirectory);

    // Process each .mdx file to extract just the frontmatter
    downloads = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(downloadsDirectory, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        // Extract necessary metadata
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Download',
          category: frontmatter.category || 'Resource',
          description: frontmatter.description || 'A helpful resource you can download.',
          fileType: frontmatter.fileType || 'PDF', // Assuming you track the file type
        } as DownloadMeta;
      });
      // Optional: Add sorting logic here (e.g., sort by title or category)
      // .sort((a, b) => a.category.localeCompare(b.category));

  } catch (error) {
    console.error("Error fetching download list for index page:", error);
    downloads = []; 
  }

  return {
    props: {
      downloads,
    },
  };
};

/* -------------------- Component Rendering -------------------- */

export default function DownloadsPage({ downloads }: DownloadsPageProps) {
  return (
    <>
      <Head>
        <title>All Downloads & Resources</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">Digital Downloads</h1>

        {downloads.length === 0 ? (
          <p className="text-gray-600">No downloads are currently available.</p>
        ) : (
          <div className="space-y-6">
            {downloads.map((download) => (
              // Link to the dynamic download detail page
              <Link 
                key={download.slug} 
                href={`/downloads/${download.slug}`} 
                className="block border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">{download.title}</h2>
                    <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                        {download.category}
                    </span>
                </div>
                <p className="text-gray-700 mb-3">{download.description}</p>
                <div className="flex items-center text-sm text-blue-600 font-semibold">
                    Download Details ({download.fileType}) &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}