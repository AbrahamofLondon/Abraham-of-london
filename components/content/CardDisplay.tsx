// Add to your existing lib/contentlayer.ts
export type ContentlayerDocument = {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  slug?: string;
  [key: string]: any;
};

// Type guards
export function isBook(doc: any): doc is import("contentlayer/generated").Book {
  return doc?.type === "Book";
}

export function isPost(doc: any): doc is import("contentlayer/generated").Post {
  return doc?.type === "Post";
}

export function isCanon(doc: any): doc is import("contentlayer/generated").Canon {
  return doc?.type === "Canon";
}

// Re-export the mapping functions
export { 
  mapToBookCardProps, 
  mapToBlogPostCardProps, 
  mapToCanonCardProps,
  mapToBaseCardProps,
  getCardPropsForDocument 
} from "./content-mappers";