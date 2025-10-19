// contentlayer.config.ts

import { defineDocumentType, makeSource } from "contentlayer/source-files";

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
    draft: { type: "boolean" }, // Ensure this is boolean, not string
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
    type: { type: "string", required: true }, // Added type
    
    // Non-required fields for Downloads
    coverImage: { type: "string" },
    pdfPath: { type: "string" },
    excerpt: { type: "string" }, // Added extra field from error logs
    tags: { type: "list", of: { type: "string" } }, // Added extra field from error logs
    coverAspect: { type: "string" }, // Added extra field from error logs
    coverFit: { type: "string" }, // Added extra field from error logs
    coverPosition: { type: "string" }, // Added extra field from error logs
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
      type: "json", // Changed from 'of' to 'json' for complex object
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
  },
}));

// Added new types for files outside standard folders
export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  // Ignore specific files that cause parsing errors, like the registry file
  exclude: ['content/_downloads-registry.md'], 
});