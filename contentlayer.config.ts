import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

// 1. Define the Download Document Type
const Download = defineDocumentType(() => ({
  name: "Download",
  // Crucial: Only target files in the 'content/downloads' folder
  filePathPattern: "downloads/*.mdx", 
  // Crucial: Set content type to MDX to enable MDX features (like tables via remarkGfm)
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
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/downloads/${doc.slug}`,
    },
  },
}));

// (If you have a Post type, it would be defined here)

export default makeSource({
  contentDirPath: "content",
  // 2. Register the new document type
  documentTypes: [Download /*, Post, Event, etc. */], 
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});