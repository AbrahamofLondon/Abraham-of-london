// lib/get-contentlayer-data.ts
/**
 * Fallback export for getContentlayerData
 * This file ensures the function exists for pages that import it
 */

export async function getContentlayerData() {
  try {
    // Try to import from our data module
    const { getContentlayerData: getData } = await import('./contentlayer/data');
    return await getData();
  } catch (error) {
    // Ultimate fallback
    return {
      available: false,
      documentCount: 0,
      documents: [],
      types: [],
      error: 'ContentLayer data not available'
    };
  }
}

export default getContentlayerData;