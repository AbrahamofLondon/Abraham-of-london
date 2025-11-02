// contentlayer.config.ts (FINAL MERGED DEFINITION)
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

// ----------------------------------------------------
// ✅ MERGED FIX: Download Definition
// ----------------------------------------------------
const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  // If your downloads content uses frontmatter, remove isContent: false
  // If it still exists in your local file, this line should be deleted, 
  // as it was causing the "missing required fields" warning.
  // Assuming Contentlayer is reading from frontmatter, we will remove isContent: false
  // And ensure all fields are defined.
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "date", required: true }, // Changed to Date type to match required field snippet
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    type: { type: "string", required: true },
    
    // NEW: Optional fields added from your snippet (to resolve 'extra fields' warnings)
    subtitle: { type: "string", required: false },
    excerpt:  { type: "string", required: false },
    tags:     { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: false },
    print: { type: "boolean", required: false }, // From your snippet

    // Remaining optional fields from the original config
    pdfPath: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
  },
}));
// ----------------------------------------------------

const Event = defineDocumentType(() => ({
  name: 'Event',
  filePathPattern: `events/**/*.mdx`,
  fields: {
    title: { type: 'string', required: true },
    slug: { type: 'string', required: true },
    date: { type: 'date', required: true },
    location: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    heroImage: { type: 'string', required: true },
    tags: { type: 'list', of: { type: 'string' } },
    chatham: { type: 'boolean', default: false },
    resources: { type: 'json', required: false },
    time: { type: 'string', required: false },
    coverImage: { type: 'string', required: false },
    draft: { type: 'boolean', required: false },
    related: { type: 'list', of: { type: 'string' }, required: false },
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
    // If you are using these in your Book MDX files, they should be here:
    // subtitle: { type: "string" },
    // excerpt: { type: "string" }, 
    // ...
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
    time: { type: "string", required: false },
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
  contentDirExclude: ["_downloads-registry.md"],
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  mdx: {
    remarkPlugins: [remarkGfm],
    esbuildOptions: (options) => {
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