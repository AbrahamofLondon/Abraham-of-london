/* pages/registry/index.tsx — PAGES ROUTER VERSION (SERIALIZE-SAFE) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";

import RegistryView from "@/components/registry/RegistryView";
import RegistryLayout from "@/components/layout/RegistryLayout";
import { RegistryProvider } from "@/contexts/RegistryContext";

import { normalizeSlug, resolveDocCoverImage } from "@/lib/content/shared";

interface RegistryPageProps {
  initialDocs: any[];
  categories: string[];
}

function safeString(v: any, fallback = ""): string {
  const s = String(v ?? "").trim();
  return s.length ? s : fallback;
}

function safeDateIso(v: any): string | null {
  const s = safeString(v, "");
  if (!s) return null;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function safeSlug(doc: any): string {
  // Guaranteed string; never undefined (prevents JSON serialize error)
  const raw = safeString(doc?.slug || doc?._raw?.flattenedPath || doc?._id || "unknown");
  return normalizeSlug(raw);
}

export const getStaticProps: GetStaticProps<RegistryPageProps> = async () => {
  const {
    getAllCanons,
    getAllPosts,
    getAllPrints,
    getAllResources,
    getAllShorts,
    getAllVault,
    getAllBriefs,
    getAllLexicons,
    getAllStrategies,
    getAllBooks,
    getAllDownloads,
    getAllEvents,
    sanitizeData,
  } = await import("@/lib/content/server");

  // Stream each kind through a map-to-minimal-row step so the worker never
  // holds the full 316-doc corpus at once. Each typed loader reads only
  // its own .contentlayer index file thanks to the per-kind cache in
  // contentlayer-helper.ts.
  const initialDocs: RegistryPageProps["initialDocs"] = [];

  const streams: Array<() => any[]> = [
    getAllCanons,
    getAllPosts,
    getAllPrints,
    getAllResources,
    getAllShorts,
    getAllVault,
    getAllBriefs,
    getAllLexicons,
    getAllStrategies,
    getAllBooks,
    getAllDownloads,
    getAllEvents,
  ];

  for (const load of streams) {
    const batch = (load() || []) as any[];
    for (const d of batch) {
      if (d?.draft || d?.published === false) continue;
      initialDocs.push({
        title: safeString(d?.title, "Untitled"),
        slug: safeSlug(d),
        category: safeString(d?.category, "General Lexicon"),
        date: safeString(d?.date, null as any) || null,
        dateISO: safeDateIso(d?.date),
        excerpt: typeof d?.excerpt === "string" ? d.excerpt.substring(0, 200) : null,
        type: safeString(d?.type || d?.kind, "unknown"),
        accessLevel: safeString(d?.accessLevel, "public"),
        coverImage: resolveDocCoverImage(d),
      });
    }
  }

  // Sort the minimal rows (cheap) instead of the full doc array.
  initialDocs.sort((a, b) => {
    const ad = a.dateISO ? Date.parse(a.dateISO) : 0;
    const bd = b.dateISO ? Date.parse(b.dateISO) : 0;
    return bd - ad;
  });

  const categories = Array.from(
    new Set(initialDocs.map((d) => d.category).filter(Boolean)),
  ) as string[];

  return {
    props: sanitizeData({
      initialDocs,
      categories,
    }),
    revalidate: 3600,
  };


};

const RegistryPage: NextPage<RegistryPageProps> = ({ initialDocs, categories }) => {
  return (
    <RegistryProvider initialDocs={initialDocs} categories={categories}>
      <RegistryLayout>
        <RegistryView initialDocs={initialDocs} categories={categories} />
      </RegistryLayout>
    </RegistryProvider>
  );
};

export default RegistryPage;