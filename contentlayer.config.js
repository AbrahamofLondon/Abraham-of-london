import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: false },
    excerpt: { type: 'string', required: false },
    coverImage: { type: 'string', required: false },
    slug: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false }
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc.slug ?? doc._raw.flattenedPath.replace(/^.*?\//, ''),
    },
  },
}));

export const Download = defineDocumentType(() => ({
  name: 'Download',
  filePathPattern: `downloads/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: false },
    type: { type: 'string', required: false },
    coverImage: { type: 'string', required: false },
    slug: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false }
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => doc.slug ?? doc._raw.flattenedPath.replace(/^.*?\//, ''),
    },
  },
}));

const contentLayerConfig = makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Download],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default contentLayerConfig;