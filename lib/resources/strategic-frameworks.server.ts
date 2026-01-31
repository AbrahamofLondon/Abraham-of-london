/* lib/resources/strategic-frameworks.server.ts */

import type { Framework } from "./strategic-frameworks.static";
import {
  getAllFrameworks,
  getFrameworkBySlug,
} from "./strategic-frameworks.static";

/**
 * Server-only access layer (future-ready).
 * Swap implementation later (DB, CMS, etc.) without changing page imports.
 */
export async function getServerAllFrameworks(): Promise<Framework[]> {
  return getAllFrameworks();
}

export async function getServerFrameworkBySlug(slug: string): Promise<Framework | null> {
  return getFrameworkBySlug(slug);
}
