
// Minimal Contentlayer config
import { makeSource } from "contentlayer2/source-files";

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [],
  mdx: {
    esbuildOptions: (options) => {
      options.external = [...(options.external || []), 'framer-motion'];
      options.platform = 'node';
      return options;
    },
  },
  onUnknownDocuments: 'skip',
  onMissingOrInvalidDocuments: 'skip',
  disableImportAliasWarning: true,
});
