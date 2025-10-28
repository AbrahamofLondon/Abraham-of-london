// pages/startegy/[slug].tsx (Strategy Detail Page - SSR)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetServerSideProps } from 'next';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx'; // Your custom components map

// Assuming your content is in 'content/startegy'
const STRATEGY_DIR = path.join(process.cwd(), 'content', 'startegy');

// Define the shape of the expected props
interface StrategyPostProps {
    frontmatter: {
        title: string;
        version: string;
        date: string;
        // ... other frontmatter fields
    };
    mdxSource: any; 
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<StrategyPostProps> = async (context) => {
    const slug = context.query.slug as string; 

    try {
        // CRITICAL: Read the specific MDX file from 'content/startegy'
        const filePath = path.join(STRATEGY_DIR, slug + '.mdx');
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        
        const { data: frontmatter, content } = matter(markdownWithMeta);
        
        // Serialize the content, passing the frontmatter as scope if needed
        const mdxSource = await serialize(content, { scope: frontmatter });

        return {
            props: {
                frontmatter: frontmatter as StrategyPostProps['frontmatter'],
                mdxSource,
            },
        };
    } catch (error) {
        // If the file is not found or reading fails
        console.error(`Error fetching strategy for slug: ${slug}`, error);
        return { notFound: true };
    }
};

/* -------------------- Component Rendering -------------------- */

export default function StrategyPost({ frontmatter, mdxSource }: StrategyPostProps) {
  
  if (!mdxSource) {
    return <h1>Strategy Document Not Found</h1>; 
  }

  const formattedDate = new Date(frontmatter.date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Head>
        <title>{frontmatter.title} | Strategy</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        
        {/* Header/Metadata Section */}
        <div className="border-b pb-4 mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title}</h1>
            <div className="text-lg text-gray-600 space-y-1">
                <p>Version: **{frontmatter.version}**</p>
                <p>Date Published: {formattedDate}</p>
            </div>
        </div>

        {/* MDX Content Section (The core document) */}
        <div className="prose max-w-none">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // Pass the custom components map!
          />
        </div>

      </main>
    </>
  );
}