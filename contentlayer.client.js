// contentlayer.client.js - Client-side Contentlayer integration
if (typeof window !== 'undefined') {
  // Import Contentlayer client
  import('contentlayer/client').then(({ useContentlayer }) => {
    // Initialize client-side Contentlayer
    window.__contentlayer = { useContentlayer };
    console.log('✅ Contentlayer client initialized');
  }).catch((error) => {
    console.warn('⚠️ Contentlayer client failed to load:', error.message);
  });
}