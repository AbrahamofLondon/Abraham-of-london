// pages/print/resource/[slug].tsx

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import path from "path";

// 💡 Correct Import: Use the primary component and type from next-mdx-remote
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

// 🏆 DEFINITIVE FIX: Import the default export and alias it to resolve compilation issues (replaces the named import).
import mdxComponentMap from '@/components/mdx-components';
const MDXComponents = mdxComponentMap;

// 🔑 CRITICAL: Your custom data loading logic
import { listSlugs, loadMdxBySlug } from "@/lib/mdx-file";

// 🔑 CRITICAL: The component map required by MDXRemote
import BrandFrame from "@/components/print/BrandFrame"; // Custom print-specific component

// --- [ Interface Definitions ] ---

interface Frontmatter {
  title: string;
  // Define other expected frontmatter fields here for type safety
  [key: string]: any;
}

// 💡 CLEANUP: Define the expected return structure from loadMdxBySlug
interface MDXData {
  mdxSource: MDXRemoteSerializeResult;
  frontmatter: Frontmatter;
}

// 💡 UPGRADE: Use the specific type for the page component props
interface PrintResourceProps extends MDXData {}

// --- [ GetStaticPaths ] ---

// Ensures all resource slugs are generated as static paths at build time
export const getStaticPaths: GetStaticPaths = async () => {
  // CRITICAL: Ensure the directory path passed to listSlugs matches your content structure
  const contentDir = "print/resource";
  const slugs = listSlugs(contentDir);

  // Map slugs to the required Next.js params structure
  const paths = slugs.map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false, // Next.js will return 404 for unlisted paths
  };
};

// --- [ GetStaticProps ] ---

// Fetches the data (frontmatter and serialized MDX content) for the specific slug
export const getStaticProps: GetStaticProps<PrintResourceProps> = async ({ params }) => {
  // 💡 UPGRADE: Safely check for params and cast to string
  const slug = params?.slug as string;

  if (!slug) {
    return { notFound: true };
  }

  // CRITICAL: Construct the full content path
  const fullPath = path.join("print", "resource", slug);

  // 💡 CLEANUP: Ensure loadMdxBySlug is correctly typed to return MDXData
  // NOTE: We rely on loadMdxBySlug handling the full process.cwd() path or relative paths correctly internally.
  const data = await loadMdxBySlug(fullPath) as MDXData;

  if (!data || !data.mdxSource) {
    // 🚨 FIX: Explicitly check for mdxSource existence as well
    return { notFound: true };
  }

  // 💡 UPGRADE: Return the data
  return {
    props: data,
  };
};

// --- [ Component Rendering ] ---

const PrintResourcePage: NextPage<PrintResourceProps> = ({ frontmatter, mdxSource }) => {
  const pageTitle = frontmatter?.title || "Print Resource";

  return (
    <>
      <Head>
        {/* 💡 UPGRADE: Cleaned up title construction */}
        <title>{`${pageTitle} | Print`}</title>
        {/* Add print-specific meta tags or styling links here if necessary */}
      </Head>
      <main>
        {/* CRITICAL: Use MDXRemote and pass both mdxSource (via spread) and the components map */}
        <MDXRemote
          {...mdxSource}
          components={MDXComponents} // Pass the centralized component map
        />

        {/* Include the branding frame, often at the end for print-specific layouts */}
        <BrandFrame />
      </main>
    </>
  );
};

export default PrintResourcePage;