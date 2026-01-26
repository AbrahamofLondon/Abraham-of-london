// lib/content/server-override.ts
/**
 * Server-side override for content functions
 * This should ONLY be imported in server-side contexts
 */

import { allDocuments } from "contentlayer2/generated";

// Override the stub functions with real implementations
export function overrideContentFunctions() {
  // This function should be called at the top of server-side files
  // to replace the stub functions with real ones
  const contentModule = require("@/lib/content");
  
  // Real implementations
  contentModule.getAllContentlayerDocs = function() {
    return allDocuments || [];
  };
  
  contentModule.getPublishedPosts = function() {
    return (allDocuments || []).filter(
      (doc: any) => !doc.draft && doc.published !== false
    );
  };
  
  contentModule.getDocumentBySlug = function(slug: string) {
    const normalized = slug.replace(/^\/+|\/+$/g, "");
    
    for (const doc of (allDocuments || [])) {
      const docSlug = doc.slug || "";
      const docHref = doc.href || "";
      const flattenedPath = doc._raw?.flattenedPath || "";
      
      const compareSlug = (s: string) => s.replace(/^\/+|\/+$/g, "");
      
      if (
        compareSlug(docSlug) === normalized ||
        compareSlug(docHref.replace(/^\//, "")) === normalized ||
        compareSlug(flattenedPath) === normalized
      ) {
        return doc;
      }
    }
    
    return null;
  };
  
  // Set aliases
  contentModule.getDocBySlug = contentModule.getDocumentBySlug;
  contentModule.getPostBySlug = contentModule.getDocumentBySlug;
}

// Export real implementations for direct import
export function getAllContentlayerDocsReal() {
  return allDocuments || [];
}

export function getPublishedPostsReal() {
  return (allDocuments || []).filter(
    (doc: any) => !doc.draft && doc.published !== false
  );
}

export function getDocumentBySlugReal(slug: string) {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  
  for (const doc of (allDocuments || [])) {
    const docSlug = doc.slug || "";
    const docHref = doc.href || "";
    const flattenedPath = doc._raw?.flattenedPath || "";
    
    const compareSlug = (s: string) => s.replace(/^\/+|\/+$/g, "");
    
    if (
      compareSlug(docSlug) === normalized ||
      compareSlug(docHref.replace(/^\//, "")) === normalized ||
      compareSlug(flattenedPath) === normalized
    ) {
      return doc;
    }
  }
  
  return null;
}

export const getDocBySlugReal = getDocumentBySlugReal;
export const getPostBySlugReal = getDocumentBySlugReal;