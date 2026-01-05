// lib/server/content.ts - BUILD-SAFE SERVER UTILITIES
// IMPORTANT: Do not import Prisma at module scope. Lazy-load it inside functions.

export * from "@/lib/contentlayer-compat";

import * as ContentHelper from "@/lib/contentlayer-helper";

import {
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getDocumentBySlug,
  normalizeSlug,
  getDocHref,
  getPublishedShorts,
  getRecentShorts,
  getPublishedDocuments,
  getAllContentlayerDocs,
  isDraftContent,
  isDraft,
  getPublishedDownloads,
  getPublishedPosts,
  getPrintBySlug,
  getStrategyBySlug,
  toUiDoc,
} from "@/lib/contentlayer-compat";

/* -------------------------------------------------------------------------- */
/* PRISMA (LAZY IMPORT) */
/* -------------------------------------------------------------------------- */

async function getPrisma() {
  // Your prisma module should export default OR named export.
  // Handle both so you don't get stuck.
  const mod: any = await import("@/lib/prisma");
  return mod.default ?? mod.prisma ?? mod;
}

/* -------------------------------------------------------------------------- */
/* CONTENT VIEW TRACKING (SERVER ONLY) */
/* -------------------------------------------------------------------------- */

export async function recordContentView(doc: any, memberId?: string): Promise<void> {
  const slug = (doc as any).slugComputed || doc.slug || doc._raw?.flattenedPath;
  if (!slug) return;

  try {
    const prisma = await getPrisma();

    // Fail-closed if prisma is not usable
    if (!prisma?.shortInteraction?.create) return;

    await prisma.shortInteraction.create({
      data: {
        shortSlug: normalizeSlug(slug),
        action: "view",
        memberId: memberId || null,
        metadata: JSON.stringify({
          title: doc.title || "Untitled",
          type: doc.type || doc._type || "Unknown",
          href: getDocHref(doc),
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error(`[AUDIT_FAILURE] Engagement log failed for slug: ${slug}`, error);
  }
}

/* -------------------------------------------------------------------------- */
/* GENERIC HELPERS */
/* -------------------------------------------------------------------------- */

export const documentExists = (slug: string): boolean => {
  const allDocs = getAllContentlayerDocs();
  const needle = normalizeSlug(slug);

  return allDocs.some((doc: any) => {
    const docSlug = doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop();
    return normalizeSlug(docSlug) === needle;
  });
};

export const getAllDocumentsWithSlugs = (): Array<any & { slugComputed: string }> => {
  const allDocs = getAllContentlayerDocs();
  return allDocs.map((doc: any) => ({
    ...doc,
    slugComputed:
      doc.slugComputed ||
      doc.slug ||
      doc._raw?.flattenedPath?.split("/").pop() ||
      "",
  }));
};

export const getDocumentByIdentifier = (identifier: string): any | null => {
  const allDocs = getAllContentlayerDocs();
  const normalizedIdentifier = normalizeSlug(identifier);

  return (
    allDocs.find((doc: any) => {
      const possible = [
        doc.slugComputed,
        doc.slug,
        doc._raw?.flattenedPath,
        doc._raw?.flattenedPath?.split("/").pop(),
      ].filter(Boolean);

      return possible.some((id: any) => normalizeSlug(String(id)) === normalizedIdentifier);
    }) || null
  );
};

/* -------------------------------------------------------------------------- */
/* UTILS */
/* -------------------------------------------------------------------------- */

export const getDownloadSizeLabel = (size: string | number | undefined): string => {
  if (!size) return "Unknown size";

  if (typeof size === "string") {
    // If it's already human-readable, keep it
    if (/\b(KB|MB|GB|TB)\b/i.test(size)) return size;

    const bytes = parseInt(size, 10);
    if (!Number.isNaN(bytes)) return formatBytes(bytes);

    return size;
  }

  if (typeof size === "number") return formatBytes(size);

  return "Unknown size";
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/* -------------------------------------------------------------------------- */
/* ASSET VALIDATION                                                           */
/* -------------------------------------------------------------------------- */

export function assertPublicAssetsForDownloadsAndResources(): void {
  // This is a placeholder function that does nothing in production
  // In development, you could add asset validation logic here
  console.log('[ASSETS] Validating public assets for downloads and resources...');
  
  // Implementation notes:
  // 1. Check if all referenced PDF files exist in public/assets
  // 2. Validate file sizes and formats
  // 3. Generate missing assets if needed
  
  // For now, just log that we're called
  if (process.env.NODE_ENV === 'development') {
    const downloads = getAllDownloads();
    const resources = getAllResources();
    
    console.log(`[ASSETS] Found ${downloads.length} downloads and ${resources.length} resources`);
    
    // Optional: Check for missing files
    // downloads.forEach(download => {
    //   if (download.fileUrl) {
    //     // Check if file exists
    //   }
    // });
  }
}

/* -------------------------------------------------------------------------- */
/* SERVER ASYNC WRAPPERS (IF YOU STILL NEED THEM) */
/* -------------------------------------------------------------------------- */

export async function getServerAllCanons() { return getAllCanons(); }
export async function getServerAllDownloads() { return getAllDownloads(); }
export async function getServerAllBooks() { return getAllBooks(); }
export async function getServerAllShorts() { return getAllShorts(); }
export async function getServerAllPosts() { return getAllPosts(); }
export async function getServerAllEvents() { return getAllEvents(); }
export async function getServerAllResources() { return getAllResources(); }
export async function getServerAllPrints() { return getAllPrints(); }
export async function getServerAllStrategies() { return getAllStrategies(); }

export async function getServerPostBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllPosts() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerBookBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllBooks() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerDownloadBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllDownloads() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerCanonBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllCanons() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerShortBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllShorts() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerEventBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllEvents() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}

export async function getServerResourceBySlug(slug: string) {
  const n = normalizeSlug(slug);
  return (getAllResources() as any[]).find((doc: any) => normalizeSlug(doc.slugComputed || doc.slug || doc._raw?.flattenedPath?.split("/").pop()) === n) || null;
}