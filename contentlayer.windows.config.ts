// contentlayer.config.ts — Windows-safe Hybrid (simple core + legacy fields allowed)

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

// Keep schemas simple but do NOT reject your real-world frontmatter.
const createDocumentType = (name: string, pattern: string) => {
  return defineDocumentType(() => ({
    name,
    filePathPattern: pattern,
    contentType: "mdx",

    fields: {
      // -------- Core fields (your simplified set) --------
      title: { type: "string", required: true },
      date: { type: "date", required: false },
      draft: { type: "boolean", required: false, default: false },
      excerpt: { type: "string", required: false },
      description: { type: "string", required: false },
      coverImage: { type: "string", required: false },
      tags: { type: "list", of: { type: "string" }, required: false },

      // -------- Common legacy fields used across your site --------
      author: { type: "string", required: false },
      featured: { type: "boolean", required: false, default: false },
      readTime: { type: "string", required: false },
      readingTime: { type: "string", required: false },
      slug: { type: "string", required: false },
      href: { type: "string", required: false },
      subtitle: { type: "string", required: false },
      category: { type: "string", required: false },

      // -------- Download-specific legacy fields (from your build error) --------
      // These were the exact “extra fields” Contentlayer warned about.
      fileFormat: { type: "string", required: false }, // "PDF"
      format: { type: "string", required: false },     // "PDF" legacy
      canonicalUrl: { type: "string", required: false },
      updated: { type: "date", required: false },
      language: { type: "string", required: false },

      useLegacyDiagram: { type: "boolean", required: false, default: false },
      useProTip: { type: "boolean", required: false, default: false },
      useFeatureGrid: { type: "boolean", required: false, default: false },
      useDownloadCTA: { type: "boolean", required: false, default: false },

      proTipType: { type: "string", required: false },
      proTipContent: { type: "string", required: false },

      featureGridColumns: { type: "number", required: false },
      featureGridItems: { type: "json", required: false },

      ctaConfig: { type: "json", required: false },
      ctaPrimary: { type: "json", required: false },
      ctaSecondary: { type: "json", required: false },

      downloadProcess: { type: "json", required: false },
      related: { type: "list", of: { type: "string" }, required: false },

      // Optional file metadata you often use in your downloads system
      fileUrl: { type: "string", required: false },
      downloadUrl: { type: "string", required: false },
      pdfPath: { type: "string", required: false },
      fileSize: { type: "string", required: false },
      version: { type: "string", required: false },
      tier: { type: "string", required: false },
      accessLevel: { type: "string", required: false },
    },

    computedFields: {
      slugComputed: {
        type: "string",
        resolve: (doc) => {
          const explicit = (doc as any).slug;
          if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
          const flattened = (doc as any)._raw?.flattenedPath;
          if (typeof flattened === "string" && flattened.trim()) return flattened.trim();
          const file = (doc as any)._raw?.sourceFileName || "";
          return String(file).replace(/\.mdx?$/, "");
        },
      },
    },
  }));
};

export const Post = createDocumentType("Post", "blog/**/*.{md,mdx}");
export const Book = createDocumentType("Book", "books/**/*.{md,mdx}");
export const Canon = createDocumentType("Canon", "canon/**/*.{md,mdx}");
export const Download = createDocumentType("Download", "downloads/**/*.{md,mdx}");

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Download],

  // Keep Windows stable and avoid path import alias warnings
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  } as any,

  // Don’t explode because legacy docs evolve faster than schema
  onUnknownDocuments: "skip-warn",
  disableImportAliasWarning: true,

  // Avoid Windows "c:" file URL loader errors — keep onSuccess simple
  onSuccess: async () => {
    console.log("✅ Contentlayer generated successfully");
  },
});