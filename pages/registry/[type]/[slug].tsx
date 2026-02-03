/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/registry/[type]/[slug].tsx — HARDENED (The Universal Terminal)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { getDocBySlug, UnifiedDoc } from "@/lib/content/unified-router";
import { allPosts, allShorts } from "contentlayer/generated";

// Use the same robust logic from the previous Tantalizer build...
// (Component implementation remains the same, but the data fetching is now type-aware)

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for Dispatches and Shorts combined
  const dispatches = allPosts.map(p => ({ params: { type: 'dispatches', slug: p.slug || p._raw.flattenedPath } }));
  const shorts = allShorts.map(s => ({ params: { type: 'shorts', slug: s.slug || s._raw.flattenedPath } }));

  return {
    paths: [...dispatches, ...shorts],
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const type = params?.type as string;
  const slug = params?.slug as string;

  // Unified lookup
  const docRaw = getDocBySlug(slug);

  if (!docRaw || (docRaw as any).draft) return { notFound: true };

  // ... (Rest of the Tantalizer and serialization logic from previous step)
  // Ensure you pass the resolved 'docRaw' to the TantalizerResolver
  
  return {
    props: {
      /* serialized data */
    },
    revalidate: 1800
  };
};

export default UniversalDispatchPage;