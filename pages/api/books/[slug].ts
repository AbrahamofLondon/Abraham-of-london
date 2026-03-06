/* app/books/[slug]/page.tsx — APP ROUTER: Book reader (SSOT safe) */

import * as React from "react";
import BookSlugPage from "@/pages/books/[slug]";
import { getPublishedBooks, sanitizeData } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";
import { normalizeRequiredTier, requiredTierFromDoc } from "@/lib/access/tier-policy";

function collapseSlashes(s: string): string {
  return String(s || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

/** Books SSOT slug normalizer (exact same as pages/books/[slug].tsx) */
function booksBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  // Strip prefixes repeatedly
  const stripOnce = (prefix: string) => {
    const p = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length);
      s = s.replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content") || changed;
    changed = stripOnce("vault") || changed;
    changed = stripOnce("books") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s;
}

function extractBodyCode(doc: any): string {
  return String(doc?.body?.code || doc?.bodyCode || "");
}

export default async function Page({ params }: { params: { slug: string } }) {
  const param = String(params?.slug || "");
  const bare = booksBareSlug(param);
  if (!bare) {
    // @ts-ignore - Return 404 page
    return <BookSlugPage doc={{ title: "Not Found", draft: true }} code="" requiredTier="public" bareSlug="" />;
  }

  const books = getPublishedBooks() || [];
  
  // ✅ SSOT: Find by matching bare slug (same as pages/books/[slug].tsx)
  const doc = books.find((d: any) => {
    if (d?.draft) return false;
    const fp = String(d?._raw?.flattenedPath || d?.slug || "");
    const derived = booksBareSlug(fp);
    return derived === bare;
  }) || null;

  if (!doc) {
    // @ts-ignore - Return 404 page
    return <BookSlugPage doc={{ title: "Not Found", draft: true }} code="" requiredTier="public" bareSlug="" />;
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  const code = requiredTier === "public" ? extractBodyCode(doc) : "";

  const props = sanitizeData({ 
    doc, 
    code, 
    requiredTier, 
    bareSlug: bare 
  });

  // Reuse your premium reader (zero design drift)
  // @ts-ignore
  return <BookSlugPage {...props} />;
}