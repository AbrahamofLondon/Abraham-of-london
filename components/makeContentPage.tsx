// components/makeContentPage.tsx (ROBUST TYPE FIX)
import * as React from "react";
import Head from "next/head";
import MDXRenderer from "./MDXRenderer";
// CRITICAL FIX: Import MDXRemoteProps to define the MdxComponents type
import { MDXRemoteProps } from "next-mdx-remote"; 

// ------------------------------
// Type Definitions
// ------------------------------

// Type for the content document data (e.g., from Contentlayer frontmatter)
export interface ContentDocument {
  title: string;
  description?: string;
  excerpt?: string;
  body?: { code: string };
  // Extend this type with any other common metadata fields (e.g., date, author)
}

// 🎯 CRITICAL FIX: Define the missing MdxComponents type using MDXRemoteProps
export type MdxComponents = MDXRemoteProps['components'];

// Type for the options passed to the HOC function
export interface MakeContentPageOptions {
  titleSuffix?: string;
  // Option to pass through a default set of MDX components
  components?: MdxComponents; 
}

// ------------------------------
// Page Wrapper HOC
// ------------------------------

/**
 * A utility function (Higher-Order Component) to wrap content data 
 * into a standard page layout with SEO metadata.
 * * @param opts Options for the wrapper, such as title suffix and default MDX components.
 * @returns A React functional component (the Content Page) ready to be exported from a Next.js page file.
 */
export function makeContentPage<T extends ContentDocument>(
  opts: MakeContentPageOptions = {} // Set default empty object for opts
) {
  const { 
    titleSuffix = "Abraham of London", 
    components 
  } = opts;

  const ContentPage = ({ doc }: { doc: T }) => {
    // Logic to determine the meta description
    const metaDescription = doc.description || doc.excerpt;

    return (
      <>
        <Head>
          <title>{doc.title} — {titleSuffix}</title>
          {metaDescription && <meta name="description" content={metaDescription} />}
        </Head>
        
        <article className="prose lg:prose-lg mx-auto px-4 py-10">
          <h1>{doc.title}</h1>
          {doc.body?.code && <MDXRenderer code={doc.body.code} components={components} />}
        </article>
      </>
    );
  };
  
  // FIX: Add display name to satisfy the 'react/display-name' rule
  ContentPage.displayName = 'ContentPageWrapper';

  return ContentPage;
}