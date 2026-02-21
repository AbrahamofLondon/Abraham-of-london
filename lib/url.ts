// lib/url.ts — SINGLE SOURCE URL UTILITIES (client-safe)
// IMPORTANT: Do not create a second joinHref implementation elsewhere.
// This file re-exports the hardened canonical logic.

export {
  normalizeSlug,
  normalizeHref,
  stripCollectionPrefix,
  joinHref,
} from "@/lib/content/shared";