// pages/resources/[slug].tsx (Corrected route name)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx'; 

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
    
    const mdxSource = await serialize(content, { scope: frontmatter });

    return {
      props: {
        frontmatter,
        mdxSource
      }
    };
  } catch (error) {
      console.error(`Error reading or serializing MDX file for resource slug: ${slug}`, error);
      return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface ResourcePostProps {
    frontmatter: {
        title: string;
        category: string;
    };
    mdxSource: any; 
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
            components={MDXComponents} // Pass the custom components map
          />
        </div>

      </main>
    </>
  );
}