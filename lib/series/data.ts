/**
 * lib/series/data.ts
 *
 * Data access layer for the series resolver.
 *
 * Uses static ESM imports from contentlayer/generated so that Next.js/Webpack
 * can properly resolve and bundle dependencies at build time (critical for
 * Netlify and other production builds).
 *
 * For testing, this module is mocked via vi.mock("@/lib/series/data").
 */

// Static ESM import — Webpack-safe, Netlify-safe.
// The contentlayer/generated module is generated during contentlayer build
// and contains allPosts, allEditorialSeriesParts, etc.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contentlayer = require("contentlayer/generated");

/**
 * Get documents for a given doc kind from Contentlayer generated data.
 */
export function getDocumentsForKind(docKind: "blog" | "editorial"): any[] {
  if (docKind === "blog") {
    return (contentlayer as any).allPosts ?? [];
  }
  return (contentlayer as any).allEditorialSeriesParts ?? [];
}