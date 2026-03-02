// contentlayer.client.js — Client-side Contentlayer integration (SAFE: no default export)

export async function initContentlayerClient() {
  if (typeof window === "undefined") return null;

  // Already initialized
  if (window.__contentlayer?.isInitialized) return window.__contentlayer;

  const emptyData = {
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

  try {
    const { useContentlayer } = await import("contentlayer/client");

    window.__contentlayer = {
      useContentlayer,
      isInitialized: true,
      initializedAt: new Date().toISOString(),
      data: emptyData,
    };

    // Try to load generated data (only exists when contentlayer has built)
    try {
      const generated = await import("contentlayer/generated");
      window.__contentlayer.data = generated;
      console.log(
        "📚 Contentlayer data loaded:",
        Object.keys(generated).filter((k) => k.startsWith("all")).length,
        "collections found"
      );
    } catch {
      console.warn("⚠️ Could not load Contentlayer generated data, using fallback");
      window.__contentlayer.data = emptyData;
    }

    console.log("✅ Contentlayer client initialized successfully");
    return window.__contentlayer;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.warn("⚠️ Contentlayer client failed to load:", message);

    window.__contentlayer = {
      useContentlayer: () => ({ data: null, error: "Contentlayer not available" }),
      isInitialized: false,
      error: message,
      data: emptyData,
    };

    return window.__contentlayer;
  }
}

export function getContentlayerClient() {
  if (typeof window === "undefined") return null;
  return window.__contentlayer ?? null;
}

// Optional auto-init helper (call this in _app.tsx once)
export function autoInitContentlayerClient() {
  if (typeof window === "undefined") return;

  const boot = () => void initContentlayerClient();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
