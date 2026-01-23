/* lib/global-contentlayer-fix.ts - GLOBAL HYDRATION GUARD */

// Extend the global type definition
declare global {
  var getContentlayerData: () => Promise<any>;
}

// Declare global function for Node.js environment
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

// Ensure window context for browser-side safety
if (typeof window !== 'undefined') {
  (window as any).getContentlayerData = async () => ({
    available: false,
    documentCount: 0,
    documents: [],
    types: []
  });
}

export {};