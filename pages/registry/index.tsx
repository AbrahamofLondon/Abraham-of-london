/* pages/registry/index.tsx — PAGES ROUTER VERSION (SERIALIZE-SAFE) */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";

import { getAllContentlayerDocs } from "@/lib/contentlayer-helper";
import RegistryView from "@/components/registry/RegistryView";
import RegistryLayout from "@/components/layout/RegistryLayout";
import { RegistryProvider } from "@/contexts/RegistryContext";

import { normalizeSlug } from "@/lib/content/shared";
import { sanitizeData } from "@/lib/content/server";

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
  const allDocs = (getAllContentlayerDocs() || []).filter((d: any) => !d?.draft && d?.published !== false);

  // Sort safely even if date is missing/invalid
  allDocs.sort((a: any, b: any) => {
    const ad = new Date(a?.date || 0).getTime() || 0;
    const bd = new Date(b?.date || 0).getTime() || 0;
    return bd - ad;
  });

  const initialDocs = allDocs.map((d: any) => {
    const slug = safeSlug(d);

    return {
      title: safeString(d?.title, "Untitled"),
      slug, // ✅ never undefined
      category: safeString(d?.category, "General Lexicon"),
      date: safeString(d?.date, null as any) || null,
      dateISO: safeDateIso(d?.date),
      excerpt: typeof d?.excerpt === "string" ? d.excerpt.substring(0, 200) : null,
      type: safeString(d?.type || d?.kind, "unknown"),
      accessLevel: safeString(d?.accessLevel, "public"),
      coverImage: d?.coverImage ? String(d.coverImage) : null,
    };
  });

  const categories = Array.from(new Set(initialDocs.map((d) => d.category).filter(Boolean))) as string[];

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
        <RegistryView />
      </RegistryLayout>
    </RegistryProvider>
  );
};

export default RegistryPage;