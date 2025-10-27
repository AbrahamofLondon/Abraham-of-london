import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import remarkGfm from "remark-gfm";
import { visit } from 'unist-util-visit';

// --- New Remark Plugin to Fix Incorrect Alias ---
function remarkFixMdxImportAlias() {
  return (tree) => {
    visit(tree, 'mdxjsEsm', (node) => {
      // Target the specific problematic import statement
      if (node.value.includes('from \'~/components/mdx\'')) {
        // Replace the incorrect alias (~) with the correct alias (@)
        node.value = node.value.replace('from \'~/components/mdx\'', 'from \'@/components/mdx\'');
      }
    });
  };
}
// ------------------------------------------------

// All fields common to most content types
const commonMeta = {
  slug: { type: "string" },
  author: { type: "string" },
  date: { type: "date" },
  excerpt: { type: "string" },
  readTime: { type: "string" },
  category: { type: "string" },
  tags: { type: "list", of: { type: "string" } },
  coverImage: { type: "string" },
  coverAspect: { type: "string" },
  coverFit: { type: "string" },
  coverPosition: { type: "string" },
  description: { type: "string" },
  ogTitle: { type: "string" },
  ogDescription: { type: "string" },
  draft: { type: "boolean" },
  socialCaption: { type: "string" }, 
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    ...commonMeta,
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    ...commonMeta,
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    ...commonMeta,
  },
}));

// Strategy (now supports .md and .mdx as per your map)
export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}", 
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    ...commonMeta,
  },
}));

// Downloads carry subtitle/pdfPath frequently
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string" },
    subtitle: { type: "string" },
    pdfPath: { type: "string" },
    ...commonMeta,
  },
}));

// Events: add the fields your logs show
export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string" },
    time: { type: "string" },
    summary: { type: "string" },
    heroImage: { type: "string" },
    chatham: { type: "boolean" },
    resources: { type: "json" }, // nested objects/arrays
    ...commonMeta,
  },
}));

// TEMP resources_* buckets: keep generous to stop “extra fields”
const loose = {
  title: { type: "string", required: true },
  ...commonMeta,
};

// All Resource-based sub-types map to the same directory
export const Template = defineDocumentType(() => ({ name: "Template", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));
export const Guide = defineDocumentType(() => ({ name: "Guide", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));
export const Pack = defineDocumentType(() => ({ name: "Pack", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));
export const Checklist = defineDocumentType(() => ({ name: "Checklist", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));
export const Brief = defineDocumentType(() => ({ name: "Brief", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));
export const Plan = defineDocumentType(() => ({ name: "Plan", filePathPattern: "resources/**/*.mdx", contentType: "mdx", fields: loose }));

// Registry file (for utility/indexing, no required fields)
export const Registry = defineDocumentType(() => ({
  name: "Registry",
  filePathPattern: "_downloads-registry.md",
  contentType: "markdown", 
  fields: {
    // No required fields to prevent errors in this utility file
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [
    Post, Book, Resource, Strategy, Download, Event, 
    Template, Guide, Pack, Checklist, Brief, Plan, Registry
  ],
  mdx: {
    // Add the new plugin to fix the incorrect import alias
    remarkPlugins: [remarkGfm, remarkFixMdxImportAlias],
    rehypePlugins: [],
    esbuildOptions: (opts) => {
      // Add component aliases to external to prevent bundling issues
      opts.external = [
        ...(opts.external ?? []),
        "@/components/*", // Broadly excludes all components under the alias
      ];
      return opts;
    },
    disableImportAliasWarning: true,
  },
});