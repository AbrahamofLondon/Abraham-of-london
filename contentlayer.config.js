import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import path from 'node:path'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    excerpt: { type: 'string', required: false },
    coverImage: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace(/^posts\//, ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/blog/${doc._raw.flattenedPath.replace(/^posts\//, '')}`,
    },
  },
}))

export const Download = defineDocumentType(() => ({
  name: 'Download',
  filePathPattern: `downloads/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: false },
    type: { type: 'string', required: false },
    coverImage: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc._raw.flattenedPath.replace(/^downloads\//, ''),
    },
    url: {
      type: 'string',
      resolve: (doc) => `/downloads/${doc._raw.flattenedPath.replace(/^downloads\//, '')}`,
    },
  },
}))

export default makeSource({
  contentDirPath: path.join(process.cwd(), 'content'),
  documentTypes: [Post, Download],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})