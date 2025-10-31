// pages/resources/index.tsx (Corrected route name)

import * as React from "react";
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Using the corrected plural directory name
const RESOURCES_DIR = path.join(process.cwd(), 'content', 'resources');

// Define the shape of your Resource data for the list view
interface ResourceMeta {
  slug: string;
  title: string;
  category: string;
  summary: string;
  date: string;
}

interface ResourcesPageProps {
  resources: ResourceMeta[];
}

/* -------------------- Data Fetching (getStaticProps) -------------------- */

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  let resources: ResourceMeta[] = [];

  try {
    const filenames = fs.readdirSync(RESOURCES_DIR);

    resources = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(RESOURCES_DIR, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Resource',
          category: frontmatter.category || 'General',
          summary: frontmatter.summary || 'Click for details.',
          date: frontmatter.date || '2024-01-01',
        } as ResourceMeta;
      })
      // Sort by date (newest first)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.error("Error fetching resource list:", error);
    resources = []; 
  }

  return {
    props: {
      resources,
    },
    // revalidate: 60, // Uncomment if using ISR
  };
};

/* -------------------- Component Rendering -------------------- */

export default function Resources({ resources }: ResourcesPageProps){
  return (
    <>
      <Head>
        <title>Resource Library</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">Resource Library</h1>

        {resources.length === 0 ? (
          <p className="text-gray-600">No resources are currently available.</p>
        ) : (
          <div className="space-y-6">
            {resources.map((resource) => (
              <Link 
                key={resource.slug} 
                href={`/resources/${resource.slug}`} // CRITICAL: Uses plural route
                className="block border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{resource.title}</h2>
                    <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-700 flex-shrink-0">
                        {resource.category}
                    </span>
                </div>
                <p className="text-gray-700 mb-3">{resource.summary}</p>
                <div className="text-sm text-blue-600 font-semibold">
                    View Resource Details &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}