// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

/** Compute slug & url even if front-matter omits `slug` */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc: any) =>
      (doc.slug as string) ||
      String(doc._raw.flattenedPath || "").replace(/^blog\//, ""),
  },
  url: {
    type: "string",
    resolve: (doc: any) => `/blog/${(doc.slug as string) ||
      String(doc._raw.flattenedPath || "").replace(/^blog\//, "")}`,
  },
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  // ✅ must be a string
  filePathPattern: "blog/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: false },            // optional; we compute if absent
    date: { type: "date", required: false },
    author: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    coverAspect: {
      type: "enum",
      options: ["book", "wide", "square"],
      required: false,
    },
    coverFit: {
      type: "enum",
      options: ["cover", "contain"],
      required: false,
    },
    coverPosition: {
      type: "enum",
      options: ["left", "center", "right"],
      required: false,
    },
    tags: { type: "list", of: { type: "string" }, required: false },
    category: { type: "string", required: false },
    readTime: { type: "string", required: false },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: "content", // expects MDX under /content/blog/**
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});
