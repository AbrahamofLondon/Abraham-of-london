// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

// 1. Define the Download Document Type
const Download = defineDocumentType(() => ({
  // ... (existing Download definition)
}));

// 2. Define the Event Document Type (This is the one that needed 'defineDocumentType')
const Event = defineDocumentType(() => ({
  name: "Event",
  // Target your event files (adjust path as needed)
  filePathPattern: "events/*.mdx",
  contentType: "mdx",
  fields: {
    // Add all fields required by your pages/events/index.tsx
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    location: { type: "string", required: false },
    summary: { type: "string", required: false },
    heroImage: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    endDate: { type: "string", required: false },
    
    // ✅ THESE FIELDS ARE CRUCIAL to fix the previous 'ctaHref' error
    ctaHref: { type: "string", required: false },
    ctaLabel: { type: "string", required: false },
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/events/${doc.slug}`,
    },
  },
}));


export default makeSource({
  contentDirPath: "content",
  // 3. Register ALL document types
  documentTypes: [Download, Event], // Ensure Event is registered
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});