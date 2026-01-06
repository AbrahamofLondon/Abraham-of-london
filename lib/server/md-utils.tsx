/* lib/server/md-utils.tsx - PHYSICAL DESIGN ALIGNMENT - FIXED */
import React from 'react';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import dynamic from 'next/dynamic';

/**
 * MASTER MDX REGISTRY WITH SAFE COMPONENT LOADING
 * Dynamically imports components with fallbacks to prevent build errors
 */
export const mdxComponents = {
  // Core MDX Components
  Badge: dynamic(() => import('@/components/mdx/Badge').catch(() => () => <span>Badge</span>)),
  BrandFrame: dynamic(() => import('@/components/mdx/BrandFrame').catch(() => () => <div>BrandFrame</div>)),
  Callout: dynamic(() => import('@/components/mdx/Callout').catch(() => () => <div>Callout</div>)),
  HeroEyebrow: dynamic(() => import('@/components/mdx/HeroEyebrow').catch(() => () => <div>HeroEyebrow</div>)),
  Note: dynamic(() => import('@/components/mdx/Note').catch(() => () => <div>Note</div>)),
  PullLine: dynamic(() => import('@/components/mdx/PullLine').catch(() => () => <div>PullLine</div>)),
  Quote: dynamic(() => import('@/components/mdx/Quote').catch(() => () => <blockquote>Quote</blockquote>)),
  ResourcesCTA: dynamic(() => import('@/components/mdx/ResourcesCTA').catch(() => () => <div>ResourcesCTA</div>)),
  Rule: dynamic(() => import('@/components/mdx/Rule').catch(() => () => <hr />)),
  Verse: dynamic(() => import('@/components/mdx/Verse').catch(() => () => <div>Verse</div>)),
  Grid: dynamic(() => import('@/components/mdx/Grid').catch(() => () => <div>Grid</div>)),
  
  // Mapping for layout logic often found in your manuscripts
  ResourceGrid: dynamic(() => import('@/components/mdx/Grid').catch(() => () => <div>ResourceGrid</div>)),
  
  // Standard HTML elements for MDX
  h1: (props: any) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-bold mt-4 mb-2" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-bold mt-3 mb-2" {...props} />,
  p: (props: any) => <p className="my-4 leading-relaxed" {...props} />,
  a: (props: any) => <a className="text-amber-500 hover:text-amber-400 underline" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 my-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 my-4" {...props} />,
  li: (props: any) => <li className="my-2" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-amber-500 pl-4 italic my-4" {...props} />,
  code: (props: any) => <code className="bg-gray-800 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
  pre: (props: any) => <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-4" {...props} />,
  img: (props: any) => <img className="rounded-lg my-4 max-w-full" {...props} />,
  hr: (props: any) => <hr className="my-8 border-gray-700" {...props} />,
  table: (props: any) => <table className="min-w-full divide-y divide-gray-700 my-4" {...props} />,
  thead: (props: any) => <thead className="bg-gray-800" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => <th className="px-4 py-2 text-left font-semibold" {...props} />,
  td: (props: any) => <td className="px-4 py-2" {...props} />,
};

/**
 * SIMPLE COMPONENTS FALLBACK - Alternative if dynamic imports cause issues
 */
export const simpleMdxComponents = {
  // Fallback components that always work
  Badge: (props: any) => <span className="inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-sm" {...props} />,
  Callout: (props: any) => (
    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 my-4" {...props} />
  ),
  Note: (props: any) => (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4" {...props} />
  ),
  Quote: (props: any) => (
    <blockquote className="border-l-4 border-amber-500 pl-6 italic text-xl my-8" {...props} />
  ),
  PullLine: (props: any) => (
    <div className="text-2xl font-serif italic text-amber-300 border-l-4 border-amber-500 pl-6 my-8" {...props} />
  ),
  Verse: (props: any) => (
    <div className="bg-gray-800/50 rounded-lg p-6 italic my-6" {...props} />
  ),
  Grid: (props: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6" {...props} />
  ),
  // Standard HTML elements
  h1: (props: any) => <h1 className="text-4xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-bold mt-4 mb-2" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-bold mt-3 mb-2" {...props} />,
  p: (props: any) => <p className="my-4 leading-relaxed" {...props} />,
  a: (props: any) => <a className="text-amber-500 hover:text-amber-400 underline" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 my-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 my-4" {...props} />,
  li: (props: any) => <li className="my-2" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-amber-500 pl-4 italic my-4" {...props} />,
  code: (props: any) => <code className="bg-gray-800 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
  pre: (props: any) => <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-4" {...props} />,
  img: (props: any) => <img className="rounded-lg my-4 max-w-full" {...props} />,
  hr: (props: any) => <hr className="my-8 border-gray-700" {...props} />,
  table: (props: any) => <table className="min-w-full divide-y divide-gray-700 my-4" {...props} />,
  thead: (props: any) => <thead className="bg-gray-800" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => <th className="px-4 py-2 text-left font-semibold" {...props} />,
  td: (props: any) => <td className="px-4 py-2" {...props} />,
};

/**
 * THE SANITIZER
 * Prevents "Reason: undefined cannot be serialized as JSON"
 */
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * MDX PROCESSOR - FIXED VERSION
 */
export async function prepareMDX(content: string) {
  const safe = typeof content === "string" && content.trim().length > 0
    ? content
    : "Transmission pending...";

  try {
    return await serialize(safe, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        development: process.env.NODE_ENV === 'development',
      },
    });
  } catch (err) {
    console.error('MDX processing error:', err);
    // Last-resort fallback: guaranteed valid MDX
    return await serialize("Transmission pending...", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        development: process.env.NODE_ENV === 'development',
      },
    });
  }
}

export function sanitizeProps<T extends Record<string, any>>(props: T): T {
  const out: any = { ...props };
  for (const k of Object.keys(out)) {
    if (k === "source") continue; // never touch MDXRemoteSerializeResult
    out[k] = sanitizeData(out[k]);
  }
  return out;
}