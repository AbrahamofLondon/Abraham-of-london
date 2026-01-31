/* lib/resources/strategic-frameworks.ts
 * Facade module: safe static exports + server exports (future-ready).
 */

export type {
  Framework,
  FrameworkTier,
  FrameworkAccent,
} from "./strategic-frameworks.static";

export {
  LIBRARY_HREF,
  FRAMEWORKS,
  getAllFrameworks,
  getFrameworkBySlug,
  getAllFrameworkSlugs,
} from "./strategic-frameworks.static";

// IMPORTANT: keep these names because pages expect them.
// Note: these are async now (more correct for “server” functions).
export {
  getServerAllFrameworks,
  getServerFrameworkBySlug,
} from "./strategic-frameworks.server";