/* lib/contentlayer/index.ts - UPDATED */
// Re-export everything from contentlayer-helper
export * from "../contentlayer-helper";

// Export from data.ts
export { getContentlayerData } from "./data";

// Default export
import ContentHelper from "../contentlayer-helper";
import { getContentlayerData } from "./data";

const DefaultExport = {
  ...ContentHelper,
  getContentlayerData
};

export default DefaultExport;
