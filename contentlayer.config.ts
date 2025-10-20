// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";

/** ---------- Document Types ---------- */

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
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

const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    type: { type: "string", required: true },
    coverImage: { type: "string" },
    pdfPath: { type: "string" },
    excerpt: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
  },
}));

const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    location: { type: "string" },
    summary: { type: "string" },
    heroImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    chatham: { type: "boolean" },
    // Keep flexible: allow array, string, or object via raw JSON
    resources: { type: "json" },
    related: { type: "list", of: { type: "string" } },
  },
}));

const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    coverImage: { type: "string" },
    description: { type: "string" },
    ogDescription: { type: "string" },
  },
}));

const Resource = defineDocumentType(() => ({
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

const Strategy = defineDocumentType(() => ({
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

/** ---------- Source ---------- */

export default makeSource({
  contentDirPath: "content",
  contentDirExclude: ["_downloads-registry.md"], // ignore the registry helper file
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  mdx: {
    remarkPlugins: [remarkGfm],
    esbuildOptions: (options) => {
      // Let esbuild ignore Next’s "@/*" imports inside MDX;
      // Next will resolve them at runtime. This fixes the “Could not resolve @/components/*” errors.
      options.external = [
        ...(options.external ?? []),
        "@/components/*",
        "@/components/*.*",
        "@/*",
      ];
      return options;
    },
  },
});
