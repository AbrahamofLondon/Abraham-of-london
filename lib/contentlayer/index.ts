// lib/contentlayer/index.ts
// Re-export everything from contentlayer-helper
export * from "../contentlayer-helper";

// Export from data.ts
export { getContentlayerData } from "./data";

// Re-export from contentlayer-compat for missing functions
export {
  getCardPropsForDocument,
  formatCardDate,
  getCardImage,
} from "@/lib/contentlayer-compat";

// Define type guard functions locally if not in compat
export const isPost = (doc: any): boolean => doc.type === "Post";
export const isBook = (doc: any): boolean => doc.type === "Book";
export const isCanon = (doc: any): boolean => doc.type === "Canon";
export const isDownload = (doc: any): boolean => doc.type === "Download";
export const isEvent = (doc: any): boolean => doc.type === "Event";
export const isPrint = (doc: any): boolean => doc.type === "Print";
export const isResource = (doc: any): boolean => doc.type === "Resource";
export const isStrategy = (doc: any): boolean => doc.type === "Strategy";

// For backward compatibility, define DocumentTypes as ContentDoc
import type { ContentDoc } from "../contentlayer-helper";
export type DocumentTypes = ContentDoc;

// Default export
import ContentHelper from "../contentlayer-helper";
import { getContentlayerData } from "./data";

const DefaultExport = {
  ...ContentHelper,
  getContentlayerData,
  // Add the missing functions
  isPost,
  isBook,
  isCanon,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isStrategy,
  getCardPropsForDocument: async (doc: ContentDoc) => ({
    title: doc.title || "Untitled",
    subtitle: doc.subtitle,
    excerpt: doc.excerpt,
    description: doc.description,
    coverImage: doc.coverImage,
    date: doc.date,
    tags: doc.tags || [],
    slug: doc.slug || "",
  }),
  formatCardDate: (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  },
  getCardImage: (coverImage: string | null | undefined, fallback: string): string => {
    return coverImage || fallback;
  },
};

export default DefaultExport;