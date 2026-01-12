
// Auto-generated Contentlayer config for Windows with framer-motion fix
import { defineDocumentType, makeSource } from 'next-contentlayer2';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
    esbuildOptions: (options) => {
      // Critical: Mark framer-motion as external to prevent bundling errors
      options.external = [...(options.external || []), 'framer-motion'];
      options.platform = 'node';
      return options;
    },
  },
  onUnknownDocuments: 'skip-warn',
  onMissingOrInvalidDocuments: 'skip-warn',
  disableImportAliasWarning: true,
});
