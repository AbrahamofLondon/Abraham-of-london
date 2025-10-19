// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

// Define the Download Document Type
const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    excerpt: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: true },
    coverAspect: { type: "string", required: true },
    coverFit: { type: "string", required: true },
    coverPosition: { type: "string", required: true },
    pdfPath: { type: "string", required: false },
    file: { type: "string", required: false },
    description: { type: "string", required: false }, // Added based on content errors
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/downloads/${doc.slug}`,
    },
  },
}));

// Define the Event Document Type (Includes all required fields)
const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    endDate: { type: "string", required: false },
    location: { type: "string", required: false },
    summary: { type: "string", required: false },
    heroImage: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    ctaHref: { type: "string", required: false }, 
    ctaLabel: { type: "string", required: false },
    chatham: { type: "boolean", required: false }, // Added based on content errors
    resources: { type: "json", required: false }, // Added based on content errors
    related: { type: "list", of: { type: "string" }, required: false }, // Added based on leadership-workshop content
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/events/${doc.slug}`,
    },
  },
}));

// Define the Post Document Type (Includes all required fields)
const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/*.mdx", 
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    excerpt: { type: "string", required: true },
    readTime: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: true },
    coverAspect: { type: "string", required: true },
    coverFit: { type: "string", required: true },
    coverPosition: { type: "string", required: true },
    
    // Added based on content errors/provided content
    description: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    category: { type: "string", required: false },
    draft: { type: "boolean", required: false },
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/blog/${doc.slug}`,
    },
  },
}));

// Define the Book Document Type (Includes all required fields)
const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/*.mdx", 
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    
    // Added based on content errors/provided content
    author: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    genre: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    buyLink: { type: "string", required: false },
    downloadPdf: { type: "string", required: false },
    downloadEpub: { type: "string", required: false },
    description: { type: "string", required: false },
    date: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
  },
}));

// Define the Resource Document Type
const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/*.md", 
  contentType: "markdown", // Fixed: "md" to "markdown"
  fields: {
    title: { type: "string", required: true },
    // NOTE: Add other required resource fields here if they exist
  },
}));

// Define a new Strategy Document Type to capture the mis-categorized file
const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/*.md",
  contentType: "markdown",
  fields: {
    title: { type: "string", required: true },
    // NOTE: Define fields based on frontmatter in strategy/events-blueprint.md
  },
}));


export default makeSource({
  contentDirPath: "content",
  // Register ALL document types, including the new Strategy type
  documentTypes: [Download, Event, Post, Book, Resource, Strategy], 
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});