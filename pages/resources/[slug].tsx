// pages/resources/[slug].tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx-components';
// import { allResources } from 'contentlayer/generated';

// Using the corrected plural directory name
const RESOURCES_DIR = path.join(process.cwd(), 'content', 'resources');

/* -------------------- Data Fetching (SSG) -------------------- */

// 1. Get Static Paths
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const files = fs.readdirSync(RESOURCES_DIR); 
    const paths = files
      .filter(filename => filename.endsWith('.mdx'))
      .map((filename) => ({
        params: { slug: filename.replace('.mdx', '') }
      }));
    return { paths, fallback: false };
  } catch (error) {
    console.warn("Could not read resources directory for paths. Returning empty paths.");
    return { paths: [], fallback: false };
  }
}

// 2. Get Static Props
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    // CRITICAL: Read from 'content/resources'
    const markdownWithMeta = fs.readFileSync(path.join(RESOURCES_DIR, slug + '.mdx'), 'utf-8'); 
    const { data: frontmatter, content } = matter(markdownWithMeta);
    
    // FIX FOR CONSISTENCY: Ensure Date objects are serialized correctly for Next.js props
    const serializedFrontmatter = Object.fromEntries(
        Object.entries(frontmatter).map(([key, value]) => [
            key, 
            value instanceof Date ? value.toISOString() : value
        ])
    );
    
    // Serialize the content, allowing for custom components
    const mdxSource = await serialize(content, { scope: serializedFrontmatter });

    return {
      props: {
        frontmatter: serializedFrontmatter, // <-- Pass the serialized object
        mdxSource,
        revalidate: 60, // Added revalidate for production consistency
      }
    };
  } catch (error) {
    console.error(`Error reading or serializing MDX file for resource slug: ${slug}`, error);
    return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface ResourcePostProps {
    mdxSource: MDXRemoteSerializeResult; // Use the correct type
    frontmatter: {
        title: string;
        category: string;
        [key: string]: any; // Allow for other frontmatter fields
    };
}

export default function ResourcePost({ frontmatter, mdxSource }: ResourcePostProps) {
  
  if (!mdxSource) {
    return <h1>Resource Not Found</h1>; 
  }

  return (
    <>
      <Head>
        <title>{frontmatter.title} | Resource</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        
        {/* Header/Metadata Section */}
        <div className="border-b pb-4 mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title}</h1>
            <p className="text-lg text-gray-600">Category: **{frontmatter.category || 'N/A'}**</p>
        </div>

        {/* MDX Content Section */}
        <div className="prose max-w-none">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // PASSING THE FIXED COMPONENT MAP - CORRECT
          />
        </div>

      </main>
    </>
  );
}