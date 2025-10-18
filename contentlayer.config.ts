import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

export default makeSource({
  contentDirPath: "content",
  documentTypes: [/* Post, Event, etc. */],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});
