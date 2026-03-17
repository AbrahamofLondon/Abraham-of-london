// lib/server/canon-data.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Canon server access wrapper used by /pages/api/canon/[slug].ts
 * * Ensures the build-time manifest aligns with the runtime content layer.
 */

// If getServerCanonBySlug is missing, we check for common naming variations
// based on your Contentlayer schema.
import { 
  getServerCanonBySlug, 
  // getServerBookBySlug // The compiler saw this, implying a possible naming conflict
} from "@/lib/content/server";

/**
 * Standardized export for the API routes. 
 * If you renamed the function in the source library, update the import above.
 */
export { getServerCanonBySlug };