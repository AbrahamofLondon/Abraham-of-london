// contentlayer.client.js - Client-side Contentlayer integration
if (typeof window !== 'undefined') {
  // Import Contentlayer client with error handling
  const loadContentlayer = async () => {
    try {
      const { useContentlayer } = await import('contentlayer/client');
      
      // Initialize client-side Contentlayer
      window.__contentlayer = { 
        useContentlayer,
        isInitialized: true,
        initializedAt: new Date().toISOString()
      };
      
      console.log('✅ Contentlayer client initialized successfully');
      
      // Try to load actual content data
      try {
        const contentlayerData = await import('contentlayer/generated');
        window.__contentlayer.data = contentlayerData;
        console.log('📚 Contentlayer data loaded:', 
          Object.keys(contentlayerData).filter(k => k.startsWith('all')).length, 
          'collections found');
      } catch (dataError) {
        console.warn('⚠️ Could not load Contentlayer generated data, using fallback');
        
        // Create fallback empty data
        window.__contentlayer.data = {
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
      
    } catch (importError) {
      console.warn('⚠️ Contentlayer client failed to load:', importError.message);
      
      // Create minimal fallback
      window.__contentlayer = {
        useContentlayer: () => ({ data: null, error: 'Contentlayer not available' }),
        isInitialized: false,
        error: importError.message,
        data: {
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
        }
      };
    }
  };

  // Load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContentlayer);
  } else {
    loadContentlayer();
  }
}

// Export for module systems
export default typeof window !== 'undefined' ? window.__contentlayer : null;