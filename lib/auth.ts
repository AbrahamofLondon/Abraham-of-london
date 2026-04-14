/* lib/auth.ts — BACKWARD-COMPAT SHIM
 *
 * The canonical NextAuth configuration now lives at lib/auth/config.ts.
 * This file re-exports from there so existing importers continue to work.
 */
export { authOptions, getAuthSession } from "@/lib/auth/config";
export { default } from "@/lib/auth/config";
