// components/makeContentPage.tsx (CLEANED VERSION)
import * as React from "react";
import Head from "next/head";
// ✅ Use a named import { MDXRenderer }
import { MDXRenderer } from "./MDXRenderer"; 
import { MDXRemoteProps } from "next-mdx-remote";
import Layout from "@/components/Layout";
import type { PostMeta } from "@/types/post";

// ------------------------------
// Type Definitions
// ------------------------------

// Type for the content document data (e.g., from Contentlayer frontmatter)
export interface ContentDocument {
  title: string;
  description?: string;
  excerpt?: string;
  body?: { code: string };
  // Extend this type with any other common metadata fields
}

// Define the MdxComponents type using MDXRemoteProps
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
 */
export function makeContentPage<T extends ContentDocument>(
  opts: MakeContentPageOptions = {} // Set default empty object for opts
) {
  const { 
    titleSuffix = "Abraham of London", 
    components 
  } = opts;

  const ContentPage = ({ doc }: { doc: T }) => {
    const metaDescription = doc.description || doc.excerpt;

    return (
      <Layout pageTitle={doc.title}>
        <Head>
          <title>{doc.title} — {titleSuffix}</title>
          {metaDescription && <meta name="description" content={metaDescription} />}
        </Head>
        
        <article className="prose lg:prose-lg mx-auto px-4 py-10">
          <h1>{doc.title}</h1>
          {doc.body?.code && <MDXRenderer code={doc.body.code} components={components} />}
        </article>
      </Layout>
    );
  };
  
  ContentPage.displayName = 'ContentPageWrapper';

  return ContentPage;
}