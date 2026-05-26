/* components/mdx/SafeMDXRenderer.tsx */
/**
 * Backward-compatibility shim.
 *
 * SafeMDXRenderer is now ClientOnlyMDXRenderer.
 * This shim exists so that pages not yet migrated continue to compile
 * while Batches 2 and 3 of the MDX rendering boundary migration are applied.
 *
 * DO NOT import this in new SSG pages — use StaticMDXRenderer instead:
 *   import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
 *
 * DO NOT import this in new client components — use ClientOnlyMDXRenderer instead:
 *   import ClientOnlyMDXRenderer from "@/components/mdx/ClientOnlyMDXRenderer";
 */
export { default } from "@/components/mdx/ClientOnlyMDXRenderer";
