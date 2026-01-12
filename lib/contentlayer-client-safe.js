// lib/contentlayer-client-safe.js
export function getClientContentFallback() {
  return {
    allDocuments: [],
    allPosts: [],
    allBooks: [],
    allCanons: [],
    allDownloads: [],
    allShorts: [],
    allEvents: [],
    allPrints: [],
    allResources: [],
    allStrategies: [],
  };
}