// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
var Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    description: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    socialCaption: { type: "string" },
    excerpt: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    draft: { type: "boolean" }
  },
  computedFields: {
    url: { type: "string", resolve: (post) => `/blog/${post.slug}` }
  }
}));
var Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.mdx",
  // ⚠️ FIX: This tells ContentLayer to expect metadata from an exported object (like 'metadata' in a .tsx file)
  // instead of frontmatter, resolving the missing fields error.
  isContent: false,
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    type: { type: "string", required: true },
    coverImage: { type: "string" },
    pdfPath: { type: "string" },
    excerpt: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" }
  }
}));
var Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.mdx`,
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "date", required: true },
    location: { type: "string", required: true },
    summary: { type: "string", required: true },
    heroImage: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" } },
    chatham: { type: "boolean", default: false },
    resources: { type: "json", required: false },
    time: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    draft: { type: "boolean", required: false },
    // ⚡ FIX: Added the missing 'related' field to resolve the Contentlayer warning
    related: { type: "list", of: { type: "string" }, required: false }
  }
}));
var Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    coverImage: { type: "string" },
    description: { type: "string" },
    ogDescription: { type: "string" }
  }
}));
var Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
    slug: { type: "string" },
    date: { type: "string" },
    author: { type: "string" },
    excerpt: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    time: { type: "string", required: false }
  }
}));
var Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.md",
  fields: {
    title: { type: "string", required: true },
    type: { type: "string", required: true },
    description: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    socialCaption: { type: "string" },
    slug: { type: "string" },
    date: { type: "string" },
    author: { type: "string" },
    excerpt: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    draft: { type: "boolean" }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  contentDirExclude: ["_downloads-registry.md"],
  // ignore the registry helper file
  documentTypes: [Post, Download, Event, Book, Resource, Strategy],
  mdx: {
    remarkPlugins: [remarkGfm],
    esbuildOptions: (options) => {
      options.external = [
        ...options.external ?? [],
        "@/components/*",
        "@/components/*.*",
        "@/*"
      ];
      return options;
    }
  }
});
export {
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-SXENVOC5.mjs.map
