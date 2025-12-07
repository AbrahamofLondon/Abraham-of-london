// lib/content.ts
// Unified content exports - Simplified version

// Core exports
export { getAllPosts } from "./posts";
export { getPostBySlug } from "./posts";
export { getPublicPosts } from "./posts";

export { getAllBooks } from "./books";
export { getBookBySlug } from "./books";
export { getPublicBooks } from "./books";

export { getAllDownloads } from "./downloads";
export { getDownloadBySlug } from "./downloads";
export { getPublicDownloads } from "./downloads";

export { getAllEvents } from "./events";
export { getEventBySlug } from "./events";
export { getPublicEvents } from "./events";

export { getAllPrints } from "./prints";
export { getPrintBySlug } from "./prints";
export { getPublicPrints } from "./prints";

export { getAllResources } from "./resources";
export { getResourceBySlug } from "./resources";
export { getPublicResources } from "./resources";

export { getAllStrategies } from "./strategies";
export { getStrategyBySlug } from "./strategies";
export { getPublicStrategies } from "./strategies";

export { getAllCanon } from "./canon";
export { getCanonBySlug } from "./canon";
export { getPublicCanon } from "./canon";
export { getFeaturedCanon } from "./canon";

// Unified content functions
export async function getAllUnifiedContent() {
  const [
    posts,
    books,
    downloads,
    events,
    prints,
    resources,
    strategies,
    canon,
  ] = await Promise.all([
    import("./posts").then(m => m.getAllPosts()),
    import("./books").then(m => m.getAllBooks()),
    import("./downloads").then(m => m.getAllDownloads()),
    import("./events").then(m => m.getAllEvents()),
    import("./prints").then(m => m.getAllPrints()),
    import("./resources").then(m => m.getAllResources()),
    import("./strategies").then(m => m.getAllStrategies()),
    import("./canon").then(m => m.getAllCanon()),
  ]);

  return [
    ...posts.map((p: any) => ({ ...p, type: "post" })),
    ...books.map((b: any) => ({ ...b, type: "book" })),
    ...downloads.map((d: any) => ({ ...d, type: "download" })),
    ...events.map((e: any) => ({ ...e, type: "event" })),
    ...prints.map((p: any) => ({ ...p, type: "print" })),
    ...resources.map((r: any) => ({ ...r, type: "resource" })),
    ...strategies.map((s: any) => ({ ...s, type: "strategy" })),
    ...canon.map((c: any) => ({ ...c, type: "canon" })),
  ];
}
