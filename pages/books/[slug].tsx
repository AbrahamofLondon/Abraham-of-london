// ./pages/books/[slug].tsx 
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'; 
import { MDXComponents } from '@/components/mdx'; // Your custom components map

/* -------------------- Data Fetching -------------------- */

// Next.js needs to know which book slugs to pre-render at build time
export const getStaticPaths: GetStaticPaths = async () => {
  // 1. **CRITICAL CHANGE:** Target the 'content/books' directory
  const files = fs.readdirSync(path.join('content', 'books')); 
  
  const paths = files
    .filter(filename => filename.endsWith('.mdx'))
    .map((filename) => ({
      params: { slug: filename.replace('.mdx', '') }
    }));
    
  return { paths, fallback: false };
}

// Next.js fetches the content for the specific slug and serializes it
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    // 2. **CRITICAL CHANGE:** Read from 'content/books'
    const markdownWithMeta = fs.readFileSync(path.join('content', 'books', slug + '.mdx'), 'utf-8'); 
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
      console.error(`Error reading or serializing MDX file for book slug: ${slug}`, error);
      return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface BookPostProps {
    frontmatter: {
        title: string;
        author?: string;
        image?: string;
        // ... any other frontmatter fields specific to books
    };
    mdxSource: any; 
}

export default function BookPost({ frontmatter, mdxSource }: BookPostProps) {
  
  if (!mdxSource) {
    // Fallback if data fetching somehow fails (should be caught by notFound: true)
    return <h1>Book Content Not Found</h1>; 
  }

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
      </Head>
      <article className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title}</h1>
        {frontmatter.author && <p className="text-xl text-gray-600 mb-6">By: {frontmatter.author}</p>}
        
        {frontmatter.image && (
          <img
            src={frontmatter.image}
            alt={frontmatter.title}
            className="rounded-xl mt-4 mb-8 w-full object-cover"
            loading="lazy"
          />
        )}
        
        <div className="prose lg:prose-lg">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // Pass the custom components map
          />
        </div>
      </article>
    </>
  );
}