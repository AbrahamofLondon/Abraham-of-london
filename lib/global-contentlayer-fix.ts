// lib/global-contentlayer-fix.ts

// Declare global function
if (typeof global !== 'undefined' && !global.getContentlayerData) {
  global.getContentlayerData = async () => {
    try {
      const { getContentlayerData: getData } = await import('./contentlayer/data');
      return await getData();
    } catch {
      return {
        available: false,
        documentCount: 0,
        documents: [],
        types: []
      };
    }
  };
}

// Also add to window for browser context
if (typeof window !== 'undefined') {
  (window as any).getContentlayerData = async () => ({
    available: false,
    documentCount: 0,
    documents: [],
    types: []
  });
}