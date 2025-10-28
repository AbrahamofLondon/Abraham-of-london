// pages/downloads/[slug].tsx 
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx'; // Your custom components map

/* -------------------- Data Fetching (SSG) -------------------- */

// 1. Get Static Paths: Tell Next.js which downloads to pre-render
export const getStaticPaths: GetStaticPaths = async () => {
  // CRITICAL: Target the 'content/downloads' directory
  const files = fs.readdirSync(path.join('content', 'downloads')); 
  
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
    // CRITICAL: Read from 'content/downloads'
    const markdownWithMeta = fs.readFileSync(path.join('content', 'downloads', slug + '.mdx'), 'utf-8'); 
    const { data: frontmatter, content } = matter(markdownWithMeta);
    
    // Serialize the content, allowing for custom components
    const mdxSource = await serialize(content, { scope: frontmatter });

    return {
      props: {
        frontmatter,
        mdxSource
      }
    };
  } catch (error) {
      console.error(`Error reading or serializing MDX file for download slug: ${slug}`, error);
      return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface DownloadPostProps {
    frontmatter: {
        title: string;
        fileType: string;
        downloadLink: string; // Assuming you have a direct link in the frontmatter
        // ... other frontmatter fields
    };
    mdxSource: any; 
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
            components={MDXComponents} // Pass the custom components map
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