// contentlayer.config.js - SIMPLE JAVASCRIPT VERSION
import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// Core fields that all documents share
const coreFields = {
  title: { type: 'string', required: true },
  date: { type: 'date', required: true },
  description: { type: 'string', required: false },
  excerpt: { type: 'string', required: false },
  draft: { type: 'boolean', required: false, default: false },
  featured: { type: 'boolean', required: false, default: false },
  tags: { type: 'list', of: { type: 'string' }, required: false },
  author: { type: 'string', required: false, default: 'Abraham of London' },
  slug: { type: 'string', required: false },
}

// Define document types
export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: 'blog/*.mdx',
  contentType: 'mdx',
  fields: coreFields,
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/blog/${doc.slug || doc._raw.flattenedPath.replace('blog/', '')}`,
    },
  },
}))

export const Book = defineDocumentType(() => ({
  name: 'Book',
  filePathPattern: 'books/*.mdx',
  contentType: 'mdx',
  fields: {
    ...coreFields,
    isbn: { type: 'string', required: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/books/${doc.slug || doc._raw.flattenedPath.replace('books/', '')}`,
    },
  },
}))

export const Download = defineDocumentType(() => ({
  name: 'Download',
  filePathPattern: 'downloads/*.mdx',
  contentType: 'mdx',
  fields: {
    ...coreFields,
    fileUrl: { type: 'string', required: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/downloads/${doc.slug || doc._raw.flattenedPath.replace('downloads/', '')}`,
    },
  },
}))

export const Canon = defineDocumentType(() => ({
  name: 'Canon',
  filePathPattern: 'canon/*.mdx',
  contentType: 'mdx',
  fields: coreFields,
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/canon/${doc.slug || doc._raw.flattenedPath.replace('canon/', '')}`,
    },
  },
}))

export const Short = defineDocumentType(() => ({
  name: 'Short',
  filePathPattern: 'shorts/*.mdx',
  contentType: 'mdx',
  fields: coreFields,
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/shorts/${doc.slug || doc._raw.flattenedPath.replace('shorts/', '')}`,
    },
  },
}))

// Create source configuration
export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Book, Download, Canon, Short],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: {
          className: ['heading-anchor'],
        },
      }],
    ],
  },
})