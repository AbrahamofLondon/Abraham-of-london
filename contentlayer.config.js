import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } }
  },
  computedFields: {
    slug: { type: "string", resolve: (doc) => doc._raw.flattenedPath.replace(/^posts\//, "") },
    url: { type: "string", resolve: (doc) => `/blog/${doc._raw.flattenedPath.replace(/^posts\//, "")}` }
  }
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    excerpt: { type: "string" },
    type: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } }
  },
  computedFields: {
    slug: { type: "string", resolve: (doc) => doc._raw.flattenedPath.replace(/^downloads\//, "") },
    url: { type: "string", resolve: (doc) => `/downloads/${doc._raw.flattenedPath.replace(/^downloads\//, "")}` }
  }
}));

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download],
  mdx: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] }
});