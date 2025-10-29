// pages/downloads/[slug].tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'; 

// 🏆 DEFINITIVE FIX: Import the default export and alias it to resolve compilation issues.
import mdxComponentMap from '@/components/mdx-components';
const MDXComponents = mdxComponentMap; 

// 🔑 Definitive Fix: Define the Content Directory once using process.cwd()
const CONTENT_DIR = path.join(process.cwd(), 'content', 'downloads');

/* -------------------- Data Fetching (SSG) -------------------- */

// 1. Get Static Paths: Tell Next.js which downloads to pre-render
export const getStaticPaths: GetStaticPaths = async () => {
  // Use the absolute path
  const files = fs.readdirSync(CONTENT_DIR); 
  
  const paths = files
    .filter(filename => filename.endsWith('.mdx'))
    .map((filename) => ({
      params: { slug: filename.replace('.mdx', '') }
    }));
    
  return { paths, fallback: false };
}

// 2. Get Static Props: Fetch the content for the specific download
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    // Use the absolute path for reading
    const filePath = path.join(CONTENT_DIR, slug + '.mdx');
    
    // Check if file exists before reading (added robustness)
    if (!fs.existsSync(filePath)) {
      return { notFound: true };
    }
    
    const markdownWithMeta = fs.readFileSync(filePath, 'utf-8'); 
    const { data: frontmatter, content } = matter(markdownWithMeta);
    
    // FIX: JSON Serialization of Date Objects
    const serializedFrontmatter = Object.fromEntries(
        Object.entries(frontmatter).map(([key, value]) => [
            key, 
            value instanceof Date ? value.toISOString() : value
        ])
    );
    
    // Serialize the content, ensuring all necessary options are set
    const mdxSource = await serialize(content, { 
      scope: serializedFrontmatter,
      mdxOptions: {
        // Add any remark/rehype plugins defined in next-mdx-remote setup here if needed
      }
    });

    return {
      props: {
        frontmatter: serializedFrontmatter, 
        mdxSource
      },
      revalidate: 60,
    };
  } catch (error) {
    // This error should be gone due to the fix in getStaticProps, but we leave the logger.
      console.error(`[MDX/SSG Error]: Could not process /content/downloads/${slug}.mdx.`, error);
      return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface DownloadPostProps {
    mdxSource: MDXRemoteSerializeResult;
    frontmatter: {
        title: string;
        fileType?: string; 
        downloadLink?: string; 
        [key: string]: any;
    };
}

export default function DownloadPost({ frontmatter, mdxSource }: DownloadPostProps) {
  
  if (!mdxSource) {
    return <h1>Download Resource Not Found</h1>; 
  }

  return (
    <>
      <Head>
        <title>{frontmatter.title} | Download</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        
        {/* Header/Metadata Section */}
        <div className="border-b pb-4 mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title}</h1>
            <p className="text-lg text-gray-600">File Type: **{frontmatter.fileType || 'N/A'}**</p>
        </div>

        {/* MDX Content Section (The detailed description) */}
        <div className="prose max-w-none">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // PASSING THE FIXED COMPONENT MAP
          />
        </div>

        {/* Call to Action (Download Button) */}
        {frontmatter.downloadLink && (
            <div className="mt-10 pt-6 border-t">
                <a 
                    href={frontmatter.downloadLink} 
                    download 
                    className="inline-block bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                    Download Now ({frontmatter.fileType})
                </a>
            </div>
        )}
      </main>
    </>
  );
}