
// Auto-generated WORKING Contentlayer config
import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

// Simple document type
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    date: { type: "date", required: false },
    slug: { type: "string", required: false },
    draft: { type: "boolean", default: false },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    date: { type: "date", required: false },
    slug: { type: "string", required: false },
    draft: { type: "boolean", default: false },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Short],
  mdx: {
    esbuildOptions: (options) => {
      // Mark framer-motion as external
      options.external = [...(options.external || []), 'framer-motion'];
      options.platform = 'node';
      return options;
    },
  },
  onUnknownDocuments: 'skip-warn',
  onMissingOrInvalidDocuments: 'skip-warn',
  disableImportAliasWarning: true,
  onExtraFieldData: 'ignore',
});
