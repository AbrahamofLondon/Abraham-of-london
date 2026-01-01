import { defineDocumentType, makeSource } from "contentlayer2/source-files";

// Simplified schema for Windows
const createSimpleDocumentType = (name: string, pattern: string) => {
  return defineDocumentType(() => ({
    name,
    filePathPattern: pattern,
    contentType: "mdx" as const,
    fields: {
      title: { type: "string", required: true },
      date: { type: "date", required: false },
      draft: { type: "boolean", required: false, default: false },
      excerpt: { type: "string", required: false },
      description: { type: "string", required: false },
      coverImage: { type: "string", required: false },
      tags: { type: "list", of: { type: "string" }, required: false },
    },
    computedFields: {
      slug: {
        type: "string",
        resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx?$/, '')
      }
    }
  }));
};

export const Post = createSimpleDocumentType("Post", "blog/**/*.{md,mdx}");
export const Book = createSimpleDocumentType("Book", "books/**/*.{md,mdx}");
export const Canon = createSimpleDocumentType("Canon", "canon/**/*.{md,mdx}");
export const Download = createSimpleDocumentType("Download", "downloads/**/*.{md,mdx}");

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Download],
  mdx: {
    remarkPlugins: [],
    rehypePlugins: []
  } as any,
  onUnknownDocuments: "skip-warn",
  disableImportAliasWarning: true,
});