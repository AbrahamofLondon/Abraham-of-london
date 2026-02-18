/**
 * lib/contentlayer.ts
 * SSOT re-export surface for content utilities + collections.
 *
 * Fix:
 * - "@/lib/content" has no default export, so `export { default } ...` fails.
 * - We provide a stable default export that mirrors named exports.
 */

export * from "@/lib/content";

// ✅ Stable default export (does NOT require "@/lib/content" to have a default)
import * as Content from "@/lib/content";
export default Content;