/* lib/resources/strategic-frameworks.server.ts */

import type { Framework } from "./strategic-frameworks.static";
import {
  getAllFrameworks,
  getFrameworkBySlug,
} from "./strategic-frameworks.static";

/**
 * Server-only access layer. 
 * This keeps the logic isolated from the client-side bundle.
 */
export async function getServerAllFrameworks(): Promise<Framework[]> {
  // In the future, this will include: return await prisma.framework.findMany();
  return getAllFrameworks();
}

export async function getServerFrameworkBySlug(slug: string): Promise<Framework | null> {
  // Logic to fetch from static file or DB backup
  return getFrameworkBySlug(slug);
}