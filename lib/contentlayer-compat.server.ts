// lib/contentlayer-compat.server.ts
export async function getContentlayerData() {
  try {
    const mod = await import('contentlayer/generated');
    return mod.default || mod;
  } catch (error) {
    console.warn('[ContentLayer] Failed to load generated data:', error);
    return {
      allBooks: [],
      allCanons: [],
      allDownloads: [],
      allEvents: [],
      allPosts: [],
      allPrints: [],
      allResources: [],
      allShorts: [],
      allStrategies: [],
    };
  }
}

export function getAllDocumentsSync(data: any) {
  const allDocs = [];
  
  if (data.allBooks) allDocs.push(...data.allBooks);
  if (data.allCanons) allDocs.push(...data.allCanons);
  if (data.allDownloads) allDocs.push(...data.allDownloads);
  if (data.allEvents) allDocs.push(...data.allEvents);
  if (data.allPosts) allDocs.push(...data.allPosts);
  if (data.allPrints) allDocs.push(...data.allPrints);
  if (data.allResources) allDocs.push(...data.allResources);
  if (data.allShorts) allDocs.push(...data.allShorts);
  if (data.allStrategies) allDocs.push(...data.allStrategies);
  
  return allDocs;
}
