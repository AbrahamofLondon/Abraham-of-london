/* lib/server/content.ts */
import {
  getAllCanons as getAllCanonsInternal,
  getCanonBySlug as getCanonBySlugInternal,
  getAllDownloads as getAllDownloadsInternal,
  getDownloadBySlug as getDownloadBySlugInternal,
  getPublishedShorts as getPublishedShortsInternal,
  getShortBySlug as getShortBySlugInternal,
  getAllBooks as getAllBooksInternal,
  getBookBySlug as getBookBySlugInternal,
  type ContentDoc,
} from "./contentlayer-helper";
import prisma from "@/lib/prisma";

/**
 * INSTITUTIONAL ENGAGEMENT TRACKING
 * Logs unique principal views into the Prisma/Neon database.
 */
export async function recordContentView(doc: ContentDoc, memberId?: string): Promise<void> {
  if (!doc.slug) return;

  try {
    await prisma.shortInteraction.create({
      data: {
        shortSlug: doc.slug,
        action: "view",
        memberId: memberId || null,
        metadata: JSON.stringify({
          title: doc.title,
          type: (doc as any).type || "institutional_content",
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    // Fail-soft logic: Content delivery must never be blocked by logging failures.
    console.error(`[AUDIT_FAILURE] Engagement log failed for slug: ${doc.slug}`, error);
  }
}

/** * WRAPPERS: Standardized access with error boundaries 
 */
export const getAllCanons = (): ContentDoc[] => {
  try { return getAllCanonsInternal() || []; } catch { return []; }
};

export const getCanonBySlug = (slug: string): ContentDoc | null => {
  try { return getCanonBySlugInternal(slug) || null; } catch { return null; }
};

export const getAllDownloads = (): ContentDoc[] => {
  try { return getAllDownloadsInternal() || []; } catch { return []; }
};

export const getDownloadBySlug = (slug: string): ContentDoc | null => {
  try { return getDownloadBySlugInternal(slug) || null; } catch { return null; }
};

export const getPublishedShorts = (): ContentDoc[] => {
  try { return getPublishedShortsInternal() || []; } catch { return []; }
};

export const getAllBooks = (): ContentDoc[] => {
  try { return getAllBooksInternal() || []; } catch { return []; }
};