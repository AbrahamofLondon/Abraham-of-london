import { defineDocumentType, makeSource } from "contentlayer/source-files";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: false },
    description: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
    draft: { type: "boolean", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (post) => `/blog/${post.slug}` },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/**/*.mdx`,
  contentType: "mdx",
  fields: {
    type: { type: "string", required: true },
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    pdfPath: { type: "string", required: false },
    coverImage: { type: "string", required: false },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.mdx`,
  contentType: "mdx",
  fields: {
    slug: { type: "string", required: true },
    title: { type: "string", required: true },
    date: { type: "string", required: true },
    location: { type: "string", required: false },
    summary: { type: "string", required: false },
    heroImage: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    chatham: { type: "boolean", required: false },
    related: { type: "list", of: { type: "string" }, required: false },
    resources: {
      type: "json",
      required: false,
      of: {
        downloads: { type: "list", of: { type: "json", fields: { href: { type: "string" }, label: { type: "string" } } } },
        reads: { type: "list", of: { type: "json", fields: { href: { type: "string" }, label: { type: "string" } } } },
      },
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/**/*.mdx`,
  contentType: "mdx",
  fields: {
    type: { type: "string", required: true },
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    coverImage: { type: "string", required: false },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: `resources/**/*.md`,
  contentType: "markdown",
  fields: {
    type: { type: "string", required: true },
    title: { type: "string", required: true },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: `strategy/**/*.md`,
  contentType: "markdown",
  fields: {
    type: { type: "string", required: true },
    title: { type: "string", required: true },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
  disableImportAliasWarning: true,
});