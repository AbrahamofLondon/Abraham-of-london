/**
 * lib/content/route-content-types.ts
 *
 * TypeScript surface for the route→content-type SSOT. The data itself lives in
 * `route-content-types.mjs` (plain JS so `next.config.mjs` and the drift-guard
 * can import it at Node load time). This file only re-exports it with types so
 * there is exactly ONE source of the mapping data — no duplication, no drift.
 *
 * See route-content-types.mjs for the full rationale (the content-persistence
 * root cause and Approach A).
 */
export {
  ROUTE_CONTENT_TYPES,
  CATCH_ALL_CONTENT_ROUTES,
  ALL_CONTENT_TYPES,
  tracePathsForTypes,
  buildContentTracingIncludes,
} from "./route-content-types.mjs";

export type GeneratedType =
  | "Short"
  | "Post"
  | "Brief"
  | "VaultBrief"
  | "Lexicon"
  | "Book"
  | "Canon"
  | "Playbook"
  | "Editorial"
  | "EditorialSeriesPart"
  | "Intelligence"
  | "Print"
  | "Resource"
  | "Strategy"
  | "Download"
  | "Vault"
  | "Event";
