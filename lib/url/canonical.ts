/**
 * lib/url/canonical.ts
 *
 * Re-exports from lib/site-url.ts — the single authoritative URL helper.
 * Kept for import-path compatibility with any callers that reference this path.
 */
export { getSiteUrl as getCanonicalSiteUrl, safeAbsoluteUrl as toAbsoluteUrl } from "@/lib/site-url";

/** Canonical site origin — evaluated once at module load. */
import { getSiteUrl } from "@/lib/site-url";
export const CANONICAL_SITE_URL: string = getSiteUrl();
