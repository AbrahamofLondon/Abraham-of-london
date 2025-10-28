// pages/terms/index.tsx (Terms of Service Page - SSR)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetServerSideProps } from 'next';
import React from 'react';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx'; // Your custom components map

// Define the file path for your single Terms document (e.g., in a dedicated 'policy' folder)
const TERMS_FILE_PATH = path.join(process.cwd(), 'content', 'policy', 'terms.mdx');

// Define the shape of the expected props
interface TermsPageProps {
    frontmatter: {
        title: string;
        lastUpdated: string;
    };
    mdxSource: any; 
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<TermsPageProps> = async () => {
    try {
        // Read the single Terms file
        const markdownWithMeta = fs.readFileSync(TERMS_FILE_PATH, 'utf-8');
        
        const { data: frontmatter, content } = matter(markdownWithMeta);
        
        // Serialize the MDX content
        const mdxSource = await serialize(content, { scope: frontmatter });

        return {
            props: {
                frontmatter: frontmatter as TermsPageProps['frontmatter'],
                mdxSource,
            },
        };
    } catch (error) {
        // If the file is not found, return notFound: true
        console.error("Error fetching Terms of Service content:", error);
        return { notFound: true };
    }
};

/* -------------------- Component Rendering -------------------- */

export default function TermsPage({ frontmatter, mdxSource }: TermsPageProps) {
  
  if (!mdxSource) {
    return (
        <main className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-extrabold mb-4">Terms Not Found</h1>
            <p className="text-red-500">The Terms of Service document could not be loaded. Please check the content path.</p>
        </main>
    ); 
  }

  const formattedUpdateDate = new Date(frontmatter.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        
        {/* Header/Metadata Section */}
        <div className="border-b pb-4 mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title || 'Terms of Service'}</h1>
            <p className="text-sm text-gray-500">Last Updated: {formattedUpdateDate}</p>
        </div>

        {/* MDX Content Section (The core legal document) */}
        <div className="prose lg:prose-lg max-w-none">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // Pass the custom components map
          />
        </div>

      </main>
    </>
  );
}