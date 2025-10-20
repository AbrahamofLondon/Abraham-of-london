// contentlayer.config.ts

import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from 'remark-gfm'; // 💡 FIX 1: Import the necessary plugin for GFM (tables, etc.)

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    
    // Non-required fields for Posts
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    description: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    socialCaption: { type: "string" },
    excerpt: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    draft: { type: "boolean" },
  },
  computedFields: {
    url: { type: "string", resolve: (post) => `/blog/${post.slug}` },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  fields: {
    // Required fields for Downloads
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    type: { type: "string", required: true },
    
    // Non-required fields for Downloads
    coverImage: { type: "string" },
    pdfPath: { type: "string" },
    excerpt: { type: "string" }, 
    tags: { type: "list", of: { type: "string" } }, 
    coverAspect: { type: "string" }, 
    coverFit: { type: "string" }, 
    coverPosition: { type: "string" }, 
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    
    // Non-required fields for Events
    location: { type: "string" },
    summary: { type: "string" },
    heroImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    chatham: { type: "boolean" },
    related: { type: "list", of: { type: "string" } },
    resources: {
      type: "json", 
      of: {
        downloads: { type: "list", of: { type: "json", fields: { href: { type: "string" }, label: { type: "string" } } } },
        reads: { type: "list", of: { type: "json", fields: { href: { type: "string" }, label: { type: "string" } } } },
      },
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    type: { type: "string", required: true },
    coverImage: { type: "string" },
    description: { type: "string" },
    ogDescription: { type: "string" },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
    
    slug: { type: "string" },
    date: { type: "string" },
    author: { type: "string" },
    excerpt: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
    
    description: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    socialCaption: { type: "string" },
    slug: { type: "string" },
    date: { type: "string" },
    author: { type: "string" },
    excerpt: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    draft: { type: "boolean" },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  
  // 💡 FIX 2: Add MDX configuration block with remarkGfm
  mdx: {
    remarkPlugins: [
      remarkGfm, // Enables table parsing
      // Add other remark plugins here if needed
    ],
    // Add rehype plugins here if needed
  },
});