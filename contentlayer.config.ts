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
    // NOTE: If some of your downloads have a 'file' field instead of 'pdfPath', 
    // you need to unify them or add 'file' here as well.
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/downloads/${doc.slug}`,
    },
  },
}));

// Define the Event Document Type (Fixes ctaHref/ctaLabel error)
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
    // REQUIRED to fix the error in pages/events/index.tsx
    ctaHref: { type: "string", required: false }, 
    ctaLabel: { type: "string", required: false },
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/events/${doc.slug}`,
    },
  },
}));

// Define the Post Document Type (For blog/ documents)
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
    // Add other fields from your blog frontmatter here
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/blog/${doc.slug}`,
    },
  },
}));

// Define the Book Document Type (For books/ documents)
const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/*.mdx", 
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    // Add fields specific to your book frontmatter here
  },
}));

// Define the Resource Document Type (For resources/ documents)
const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/*.md", 
  contentType: "md", // Assuming resources are plain markdown
  fields: {
    title: { type: "string", required: true },
    // Add fields specific to your resource frontmatter here
  },
}));


export default makeSource({
  contentDirPath: "content",
  // Register ALL document types
  documentTypes: [Download, Event, Post, Book, Resource], 
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});