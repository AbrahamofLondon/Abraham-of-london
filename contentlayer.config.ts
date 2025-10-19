// contentlayer.config.ts (Full, combined document definitions)
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";

// 1. Download Definition (MUST have 'name')
const Download = defineDocumentType(() => ({
  name: "Download", // ✅ Fixed
  // ... rest of Download definition
}));

// 2. Event Definition (MUST have 'name' and the missing fields)
const Event = defineDocumentType(() => ({
  name: "Event", // ✅ Must have 'name'
  // ... required fields including ctaHref and ctaLabel
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Download, Event], // Ensure both are registered
  // ... mdx config
});