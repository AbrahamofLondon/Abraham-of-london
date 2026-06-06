/* lib/content/brief-routes.ts — route and cover SSOT for Briefs/Vault */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BriefsCoverKey } from "@/lib/content/briefs-cover-map";
import { getBriefsCover } from "@/lib/content/briefs-cover-map";
import { resolveVaultBriefSlugAlias } from "@/lib/content/brief-slug-aliases";

export type BriefRouteSurface = "public" | "vault" | "unknown";

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function normalizeBriefPath(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function stripKnownPrefixes(input: unknown, prefixes: string[]): string {
  let s = normalizeBriefPath(input).replace(/^content\//i, "");
  let changed = true;

  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const p = normalizeBriefPath(prefix);
      if (!p) continue;

      const lower = s.toLowerCase();
      const prefixLower = p.toLowerCase();

      if (lower === prefixLower) return "";
      if (lower.startsWith(`${prefixLower}/`)) {
        s = normalizeBriefPath(s.slice(p.length + 1));
        changed = true;
        break;
      }
    }
  }

  return s;
}

export function getBriefLeafSlug(input: unknown): string {
  const normalized = normalizeBriefPath(input);
  if (!normalized || normalized.includes("..")) return "";
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export function getPublicBriefSlug(input: unknown): string {
  return getBriefLeafSlug(stripKnownPrefixes(input, ["briefs"]));
}

export function getVaultBriefSlug(input: unknown): string {
  return getBriefLeafSlug(stripKnownPrefixes(input, ["vault/briefs", "vault", "briefs"]));
}

function rawPath(doc: any, field: "flattenedPath" | "sourceFilePath"): string {
  return normalizeBriefPath(doc?._raw?.[field]).toLowerCase();
}

export function isPublicBriefSource(doc: any): boolean {
  const flattened = rawPath(doc, "flattenedPath");
  const source = rawPath(doc, "sourceFilePath");
  return (
    flattened.startsWith("briefs/") ||
    source.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    source.startsWith("content/briefs/")
  );
}

export function isVaultBriefSource(doc: any): boolean {
  const flattened = rawPath(doc, "flattenedPath");
  const source = rawPath(doc, "sourceFilePath");
  const slug = normalizeBriefPath(doc?.slug).toLowerCase();
  const href = normalizeBriefPath(doc?.href).toLowerCase();
  const type = safeString(doc?.type || doc?._type).toLowerCase();
  const docKind = safeString(doc?.docKind).toLowerCase();

  return (
    type === "vaultbrief" ||
    docKind === "vaultbrief" ||
    flattened.startsWith("vault/briefs/") ||
    source.startsWith("vault/briefs/") ||
    flattened.startsWith("content/vault/briefs/") ||
    source.startsWith("content/vault/briefs/") ||
    slug.startsWith("vault/briefs/") ||
    href.startsWith("vault/briefs/")
  );
}

export function publicBriefSlugForDoc(doc: any): string {
  return (
    getPublicBriefSlug(doc?.urlSlug) ||
    getPublicBriefSlug(doc?.slugSafe) ||
    getPublicBriefSlug(doc?.slugComputed) ||
    getPublicBriefSlug(doc?.slug) ||
    getPublicBriefSlug(doc?._raw?.flattenedPath) ||
    getPublicBriefSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

export function vaultBriefSlugForDoc(doc: any): string {
  return (
    getVaultBriefSlug(doc?.urlSlug) ||
    getVaultBriefSlug(doc?.collectionSlug) ||
    getVaultBriefSlug(doc?.slugSafe) ||
    getVaultBriefSlug(doc?.slugComputed) ||
    getVaultBriefSlug(doc?.slug) ||
    getVaultBriefSlug(doc?._raw?.flattenedPath) ||
    getVaultBriefSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

export function getPublicBriefHref(docOrSlug: any): string | null {
  const slug = typeof docOrSlug === "string" ? getPublicBriefSlug(docOrSlug) : publicBriefSlugForDoc(docOrSlug);
  return slug ? `/briefs/${slug}` : null;
}

export function getVaultBriefHref(docOrSlug: any): string | null {
  const rawSlug = typeof docOrSlug === "string" ? getVaultBriefSlug(docOrSlug) : vaultBriefSlugForDoc(docOrSlug);
  if (!rawSlug) return null;
  const canonical = resolveVaultBriefSlugAlias(rawSlug) || rawSlug;
  return `/vault/briefs/${canonical}`;
}

export function resolveBriefCanonicalHref(doc: any): string | null {
  if (isVaultBriefSource(doc)) return getVaultBriefHref(doc);
  if (isPublicBriefSource(doc)) return getPublicBriefHref(doc);
  return null;
}

export function resolveVaultAliasRedirect(slug: string): { canonicalSlug: string; shouldRedirect: boolean } {
  const clean = getVaultBriefSlug(slug);
  const alias = resolveVaultBriefSlugAlias(clean);
  return { canonicalSlug: alias || clean, shouldRedirect: Boolean(alias && alias !== clean) };
}

export function coverKeyForPublicBriefSlug(slug: string): BriefsCoverKey {
  if (slug.startsWith("institutional-alpha-")) return "institutionalAlpha";
  if (slug.startsWith("sovereign-intelligence-")) return "sovereignIntelligence";
  return "intelligenceBriefs";
}

export function coverKeyForVaultBriefSlug(slug: string): BriefsCoverKey {
  if (slug.startsWith("frontier-resilience-")) return "frontierResilience";
  return "vaultBriefs";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
}

export function briefCoverPathForPublicSlug(slug: string): string {
  return getBriefsCover(coverKeyForPublicBriefSlug(slug)).path;
}

export function briefCoverPathForVaultSlug(slug: string): string {
  return getBriefsCover(coverKeyForVaultBriefSlug(slug)).path;
}

export function absoluteBriefCoverForPublicSlug(slug: string): string {
  return `${siteUrl()}${briefCoverPathForPublicSlug(slug)}`;
}

export function absoluteBriefCoverForVaultSlug(slug: string): string {
  return `${siteUrl()}${briefCoverPathForVaultSlug(slug)}`;
}

export function briefCoverAltForPublicSlug(slug: string): string {
  return getBriefsCover(coverKeyForPublicBriefSlug(slug)).alt;
}

export function briefCoverAltForVaultSlug(slug: string): string {
  return getBriefsCover(coverKeyForVaultBriefSlug(slug)).alt;
}

