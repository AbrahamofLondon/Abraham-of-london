// pages/books/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize"; // <-- ADDED: serialize must be imported
import matter from "gray-matter"; // <-- ADDED: matter must be imported

// The core issue: fs and Image must be imported if used directly
import fs from "fs"; // <-- ADDED: Import fs module
import path from "path";
import Image from "next/image"; // <-- ADDED: Image component must be imported

// NOTE: The next two imports are NOT needed since you are reading files directly:
// import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file"; 
import { mdxComponents } from "@/lib/mdx-components";
// import BrandFrame from "@/components/print/BrandFrame"; // Not used in component

/* -------------------- Data Setup -------------------- */

const BOOKS_DIR = path.join(process.cwd(), 'content', 'books');

/* -------------------- ESSENTIAL FIX: getStaticPaths -------------------- */

/**
 * Required for dynamic routes using getStaticProps (SSG).
 * It tells Next.js which paths (slugs) to pre-render at build time.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  // Read all filenames from the 'content/books' directory
  const files = fs.readdirSync(BOOKS_DIR);

  const paths = files
    .filter(filename => filename.endsWith('.mdx'))
    .map((filename) => ({
      params: { slug: filename.replace('.mdx', '') }
    }));

  return {
    paths,
    // Setting fallback to 'false' means any path not returned by getStaticPaths
    // will result in a 404 page.
    fallback: false
  };
}

/* -------------------- getStaticProps -------------------- */

/**
 * Fetches the content for a specific book slug at build time.
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  try {
    // 1. Read the MDX file content
    const markdownWithMeta = fs.readFileSync(path.join(BOOKS_DIR, slug + '.mdx'), 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);

    // 2. Serialize the content for MDXRemote rendering
    const mdxSource = await serialize(content, { scope: frontmatter });

    // 3. Final serialization check for undefined values
    for (const key in frontmatter) {
        if (frontmatter[key] === undefined) {
            frontmatter[key] = null;
        }
    }

    return {
      props: {
        frontmatter,
        mdxSource
      }
    };
  } catch (error) {
      // NOTE: Using console.error inside getStaticProps is safe.
      // console.error(`Error reading or serializing MDX file for book slug: ${slug}`, error); 
      return { notFound: true };
  }
}

/* -------------------- Component Rendering -------------------- */

interface BookPageProps {
    frontmatter: {
        title: string;
        author: string;
        coverImage: string; // Must be provided in frontmatter
        readDate?: string | null; // Allow null for serialization safety
        rating?: number | null; // Allow null for serialization safety
    };
    mdxSource: any;
}

export default function BookPage({ frontmatter, mdxSource }: BookPageProps) {

  if (!mdxSource) {
    return <h1>Book Content Not Found</h1>;
  }

  // Aspect ratio and sizes optimized for a typical "book" cover layout
  const imageSizes = `(max-width: 640px) 100vw, 300px`;
  
  return (
    <>
      <Head>
        <title>{frontmatter.title} by {frontmatter.author} | Book Review</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <article className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-10 flex flex-col md:flex-row gap-6 items-start">
          
          {/* Optimized Book Cover Image using 'fill' */}
          <div className="relative w-full h-[450px] md:w-80 overflow-hidden rounded-lg shadow-2xl flex-shrink-0">
            <Image
              src={frontmatter.coverImage}
              alt={`Cover of ${frontmatter.title}`}
              fill // Fills the parent container
              sizes={imageSizes}
              className="object-cover" // Ensures it covers the area without distorting parent
              priority // Likely a primary content element
            />
          </div>
          
          {/* Book Details */}
          <div className="flex-grow">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{frontmatter.title}</h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-4">
              By **{frontmatter.author}**
            </p>
            {frontmatter.readDate && (
              <p className="text-sm text-neutral-500 mb-2">
                Finished on: {new Date(frontmatter.readDate).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {frontmatter.rating !== undefined && frontmatter.rating !== null && (
              <p className="text-lg font-semibold text-amber-500">
                Rating: {'★'.repeat(frontmatter.rating)}
              </p>
            )}
          </div>
        </header>

        {/* Main Content (MDX) */}
        <section className="prose lg:prose-lg dark:prose-invert mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <MDXRemote
            {...mdxSource}
            components={mdxComponents}
          />
        </section>
      </article>
    </>
  );
}