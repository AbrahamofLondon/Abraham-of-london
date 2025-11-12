import { defineDocumentType, makeSource } from 'contentlayer/source-files';

const withSlug = {
  slug: { type: 'string', required: false },
};

const withCover = {
  coverImage: { type: 'string', required: false },
};

const withTags = {
  tags: { type: 'list', of: { type: 'string' }, required: false },
};

const computedSlug = {
  slug: {
    type: 'string',
    resolve: (doc: any) => doc.slug ?? doc._raw.flattenedPath.replace(/^.*?\//, ''),
  },
};

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: false },
    excerpt: { type: 'string', required: false },
    ...withTags,
    ...withCover,
    ...withSlug,
  },
  computedFields: computedSlug,
}));

export const Download = defineDocumentType(() => ({
  name: 'Download',
  filePathPattern: `downloads/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: false },
    type: { type: 'string', required: false },
    ...withTags,
    ...withCover,
    ...withSlug,
  },
  computedFields: computedSlug,
}));

export const Event = defineDocumentType(() => ({
  name: 'Event',
  filePathPattern: `events/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: false },
    location: { type: 'string', required: false },
    ...withTags,
    ...withCover,
    ...withSlug,
  },
  computedFields: computedSlug,
}));

export const Book = defineDocumentType(() => ({
  name: 'Book',
  filePathPattern: `books/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: false },
    ...withTags,
    ...withCover,
    ...withSlug,
  },
  computedFields: computedSlug,
}));

export const Resource = defineDocumentType(() => ({
  name: 'Resource',
  filePathPattern: `resources/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: false },
    ...withTags,
    ...withCover,
    ...withSlug,
  },
  computedFields: computedSlug,
}));

export const Print = defineDocumentType(() => ({
  name: 'Print',
  filePathPattern: `prints/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    excerpt: { type: 'string', required: false },
    ...withCover,
    ...withSlug,
    ...withTags,
  },
  computedFields: computedSlug,
}));

const contentLayerConfig = makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Download, Event, Book, Resource, Print],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default contentLayerConfig;