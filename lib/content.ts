// lib/content.ts
/**
 * CLIENT-SAFE CONTENT BOUNDARY
 * - Components/pages may import utilities + UI-safe helpers from here.
 * - NEVER export server getters from here.
 * - Server code should import from "@/lib/content/server".
 */
export * from "./content/index";
export { default } from "./content/index";
