/**
 * Abraham of London — Service Worker v1.0.0
 * Strategy: Network First, falling back to Cache for Intelligence Briefs.
 */

const CACHE_NAME = "aol-archives-v1";
const OFFLINE_URL = "/offline"; // Optional: Create a simple pages/offline.tsx

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/favicon.ico",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/manifest.json"
];

// 1. Installation: Pre-cache core branding
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activation: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Strategy: Network First
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip tracking and external scripts
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone it to the cache
        if (response.status === 200) {
          const resCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try the cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // If totally offline and not in cache, try redirecting to offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});