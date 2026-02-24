// lib/mdx-utils.ts — AUTHORITATIVE CONTENT PROXY
import * as Generated from "contentlayer/generated";

// 1. STRATEGIC TYPE EXTRACTION & FALLBACKS
const allPosts = Generated.allPosts || [];
const allBooks = Generated.allBooks || [];
const allResources = (Generated as any).allResources || [];
const allBriefs = (Generated as any).allBriefs || [];

export type Post = typeof allPosts[number];
export type Book = typeof allBooks[number];

// ============================================================================
// Core Utility: Content Normalization
// ============================================================================

/**
 * Institutional Utility: Data Sanitization
 * Replaces the need for next-mdx-remote/serialize.
 * Contentlayer2 body.code is already the 'compiledSource'.
 */
export function formatMdxData(doc: any) {
  if (!doc) return null;
  return {
    ...doc,
    title: doc.title || "Untitled Intelligence Brief",
    date: doc.date ? new Date(doc.date).toLocaleDateString("en-GB") : null,
    bodyCode: doc.body.code, // This is the payload for SafeMDXRenderer
  };
}

// ============================================================================
// Retrieval Helpers
// ============================================================================
export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((p: any) => p.slugSafe === slug || p.slug === slug);
}

export function getBookBySlug(slug: string): Book | undefined {
  return allBooks.find((b: any) => b.slugSafe === slug || b.slug === slug);
}

export function getBriefBySlug(slug: string): any | undefined {
  return allBriefs.find((b: any) => b.slug === slug);
}

// ============================================================================
// Portfolio Aggregators
// ============================================================================
export function getAllPosts() {
  return [...allPosts].sort((a: any, b: any) => 
    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );
}

export function getAllBooks() {
  return [...allBooks];
}

export default {
  getPostBySlug,
  getBriefBySlug,
  getBookBySlug,
  getAllPosts,
  getAllBooks,
};