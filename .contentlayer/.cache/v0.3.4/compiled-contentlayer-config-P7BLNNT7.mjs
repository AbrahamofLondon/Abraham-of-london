// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
var Download = defineDocumentType(() => ({
  name: "Download"
  // ✅ Fixed
  // ... rest of Download definition
}));
var Event = defineDocumentType(() => ({
  name: "Event"
  // ✅ Must have 'name'
  // ... required fields including ctaHref and ctaLabel
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  documentTypes: [Download, Event]
  // Ensure both are registered
  // ... mdx config
});
export {
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-P7BLNNT7.mjs.map
