import type { PremiumAssetRecord } from "@/lib/premium/private-asset-store";
import { getPremiumAssetRecord } from "@/lib/premium/private-asset-store";
import { logger } from "@/lib/logging";

export type ConfidentialLevel = "high" | "medium" | "low";

export type PremiumContentItem = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  categorySlug?: string;
  confidentialLevel: ConfidentialLevel;
  fileSize?: string;
  fileSizeBytes?: number;
  expiresAt?: string;
  tags: string[];
  featured?: boolean;
  asset: {
    relativePath: string;
    mimeType?: string;
    filename?: string;
    checksum?: string;
    pageCount?: number;
  };
  metadata?: {
    author?: string;
    createdAt?: string;
    version?: string;
    docId?: string;
    classification?: string;
    watermarkRequired?: boolean;
    maxDownloads?: number;
    allowedTiers?: string[];
    coverImage?: string;
    productLine?: string;
  };
};

export type PremiumContentCategory = {
  id: string;
  name: string;
  description?: string;
  count: number;
  items: PremiumContentItem[];
};

export type ContentRegistryStats = {
  totalItems: number;
  byCategory: Record<string, number>;
  byConfidentialLevel: Record<ConfidentialLevel, number>;
  totalSizeMB: number;
  latestItem?: PremiumContentItem;
};

const PREMIUM_CONTENT: PremiumContentItem[] = [
  {
    id: "ultimate-purpose-of-man-editorial",
    title: "The Ultimate Purpose of Man",
    subtitle: "Strategic Editorial — The Mandate of Alignment",
    description:
      "A flagship treatise on human design and civilisational governance—written for leaders who refuse to drift.",
    category: "editorials",
    categorySlug: "flagship-editorials",
    confidentialLevel: "low",
    featured: true,
    fileSize: "4.8 MB",
    fileSizeBytes: 4_800_000,
    tags: [
      "flagship",
      "editorial",
      "purpose",
      "theology",
      "governance",
      "canon",
      "leadership",
    ],
    asset: {
      relativePath: "editorials/ultimate-purpose-of-man-editorial.pdf",
      mimeType: "application/pdf",
      filename: "ultimate-purpose-of-man-editorial.pdf",
      pageCount: 12,
    },
    metadata: {
      author: "Abraham of London",
      createdAt: "2026-02-12",
      version: "2.0.0",
      docId: "CB-ED-001",
      classification: "PUBLIC",
      watermarkRequired: false,
      maxDownloads: 100,
      allowedTiers: [
        "public",
        "member",
        "architect",
        "owner",
        "client",
        "inner-circle",
      ],
      coverImage: "/assets/images/social/og-image.jpg",
      productLine: "Flagship Editorials",
    },
  },

  {
    id: "intel-2026-q1-report",
    title: "Global Market Intelligence Report Q1 2026",
    subtitle: "Institutional Briefing for Strategic Operators",
    description:
      "Primary long-form institutional report for Q1 2026 covering global market movements, macro strain, capital flows, regional posture, and board-level strategic interpretation.",
    category: "market-intelligence",
    categorySlug: "market-intel",
    confidentialLevel: "high",
    featured: false,
    fileSize: "14.6 MB",
    fileSizeBytes: 15_309_824,
    expiresAt: "2026-12-31",
    tags: [
      "global",
      "exclusive",
      "quarterly",
      "forecast",
      "report",
      "pdf",
      "macro",
      "capital-flows",
      "institutional",
      "market-intelligence",
    ],
    asset: {
      relativePath: "reports/global-market-intelligence-report-q1-2026.pdf",
      mimeType: "application/pdf",
      filename: "global-market-intelligence-report-q1-2026.pdf",
      pageCount: 42,
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-01-15",
      version: "1.2.0",
      docId: "GMI-Q1-2026",
      classification: "RESTRICTED",
      watermarkRequired: true,
      maxDownloads: 5,
      allowedTiers: ["architect", "owner"],
      productLine: "Market Intelligence Report",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
    },
  },

  {
    id: "intel-2026-q1-board-deck",
    title: "Global Market Intelligence Q1 2026 — Board Briefing Deck",
    subtitle: "Executive Presentation Companion",
    description:
      "Primary board-format artifact for Q1 2026: a premium 16:9 institutional briefing deck covering global market movements, capital flows, regional risk posture, and board-level scenario framing.",
    category: "board-briefings",
    categorySlug: "board-briefings",
    confidentialLevel: "high",
    featured: false,
    fileSize: "33.8 MB",
    fileSizeBytes: 35_476_916,
    expiresAt: "2026-12-31",
    tags: [
      "global",
      "exclusive",
      "quarterly",
      "forecast",
      "board-briefing",
      "deck",
      "pptx",
      "macro",
      "capital-flows",
      "market-intelligence",
      "presentation",
    ],
    asset: {
      relativePath:
        "reports/global-market-intelligence-report-q1-2026-board-briefing.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: "global-market-intelligence-report-q1-2026-board-briefing.pptx",
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-01-15",
      version: "1.2.0",
      docId: "GMI-Q1-2026-D",
      classification: "RESTRICTED",
      watermarkRequired: false,
      maxDownloads: 5,
      allowedTiers: ["architect", "owner"],
      productLine: "Board Briefing Deck",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
    },
  },

  {
    id: "intel-2026-q1-appendix",
    title: "Global Market Intelligence Report Q1 2026 — Appendix Volume",
    subtitle: "Source Notes, Definitions, and Regional Scorecards",
    description:
      "Appendix volume accompanying the Q1 2026 institutional report, containing source notes, terminology, regional scorecards, and deeper reference material for internal challenge and auditability.",
    category: "market-intelligence",
    categorySlug: "market-intel",
    confidentialLevel: "medium",
    featured: false,
    fileSize: "6.2 MB",
    fileSizeBytes: 6_501_376,
    expiresAt: "2026-12-31",
    tags: [
      "appendix",
      "source-notes",
      "definitions",
      "regional-scorecards",
      "pdf",
      "market-intelligence",
      "institutional",
      "reference",
    ],
    asset: {
      relativePath:
        "reports/global-market-intelligence-report-q1-2026-appendix.pdf",
      mimeType: "application/pdf",
      filename: "global-market-intelligence-report-q1-2026-appendix.pdf",
      pageCount: 18,
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-01-15",
      version: "1.2.0",
      docId: "GMI-Q1-2026-A",
      classification: "CONFIDENTIAL",
      watermarkRequired: true,
      maxDownloads: 5,
      allowedTiers: ["architect", "owner"],
      productLine: "Appendix Volume",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
    },
  },
];

export function getPremiumContentList(): PremiumContentItem[] {
  return PREMIUM_CONTENT;
}

export function getPremiumContentById(id: string): PremiumContentItem | null {
  const needle = String(id || "").trim();
  if (!needle) return null;
  return PREMIUM_CONTENT.find((item) => item.id === needle) || null;
}

export function getPremiumContentByCategory(
  category: string,
): PremiumContentItem[] {
  const cat = String(category || "").trim().toLowerCase();

  return PREMIUM_CONTENT.filter(
    (item) =>
      item.category.toLowerCase() === cat ||
      item.categorySlug?.toLowerCase() === cat,
  );
}

export function getPremiumContentByTier(tier: string): PremiumContentItem[] {
  const normalizedTier = String(tier || "").trim().toLowerCase();

  return PREMIUM_CONTENT.filter(
    (item) =>
      !item.metadata?.allowedTiers ||
      item.metadata.allowedTiers.some(
        (allowedTier) => allowedTier.toLowerCase() === normalizedTier,
      ),
  );
}

export function getPremiumContentByTag(tag: string): PremiumContentItem[] {
  const normalizedTag = String(tag || "").trim().toLowerCase();

  return PREMIUM_CONTENT.filter((item) =>
    item.tags.some((value) => value.toLowerCase().includes(normalizedTag)),
  );
}

export function searchPremiumContent(query: string): PremiumContentItem[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];

  return PREMIUM_CONTENT.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      (item.subtitle || "").toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q),
  );
}

export function getPremiumCategories(): PremiumContentCategory[] {
  const categories = new Map<string, PremiumContentCategory>();

  for (const item of PREMIUM_CONTENT) {
    const catId = item.categorySlug || item.category;
    const existing = categories.get(catId);

    if (existing) {
      existing.count += 1;
      existing.items.push(item);
    } else {
      categories.set(catId, {
        id: catId,
        name: item.category,
        description: undefined,
        count: 1,
        items: [item],
      });
    }
  }

  return Array.from(categories.values());
}

export function getContentRegistryStats(): ContentRegistryStats {
  const byCategory: Record<string, number> = {};
  const byConfidentialLevel: Record<ConfidentialLevel, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  let totalSizeMB = 0;
  let latestItem: PremiumContentItem | undefined;
  let latestDate = new Date(0);

  for (const item of PREMIUM_CONTENT) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byConfidentialLevel[item.confidentialLevel] += 1;

    if (typeof item.fileSizeBytes === "number") {
      totalSizeMB += item.fileSizeBytes / (1024 * 1024);
    }

    if (item.metadata?.createdAt) {
      const created = new Date(item.metadata.createdAt);
      if (created > latestDate) {
        latestDate = created;
        latestItem = item;
      }
    }
  }

  return {
    totalItems: PREMIUM_CONTENT.length,
    byCategory,
    byConfidentialLevel,
    totalSizeMB: Math.round(totalSizeMB * 10) / 10,
    latestItem,
  };
}

export async function getPremiumContentAsset(
  id: string,
): Promise<PremiumAssetRecord | null> {
  const item = getPremiumContentById(id);

  if (!item) {
    logger.warn(`[CONTENT_REGISTRY] Content not found: ${id}`);
    return null;
  }

  try {
    return await getPremiumAssetRecord({
      id: item.id,
      title: item.title,
      relativePath: item.asset.relativePath,
      mimeType: item.asset.mimeType,
      filename: item.asset.filename,
    });
  } catch (error) {
    logger.error(`[CONTENT_REGISTRY] Failed to get asset ${id}: ${error}`);
    return null;
  }
}

export function validateContentAccess(
  item: PremiumContentItem,
  userTier?: string | null,
): { allowed: boolean; reason?: string } {
  const classification = String(item.metadata?.classification || "")
    .trim()
    .toUpperCase();

  if (!classification || classification === "PUBLIC") {
    return { allowed: true };
  }

  if (item.metadata?.allowedTiers?.length) {
    const normalizedUserTier = String(userTier || "").trim().toLowerCase();

    const allowed = item.metadata.allowedTiers.some(
      (tier) => tier.toLowerCase() === normalizedUserTier,
    );

    if (!allowed) {
      return {
        allowed: false,
        reason: `Content requires tier: ${item.metadata.allowedTiers.join(", ")}`,
      };
    }
  }

  return { allowed: true };
}

export default {
  list: getPremiumContentList,
  getById: getPremiumContentById,
  getByCategory: getPremiumContentByCategory,
  getByTier: getPremiumContentByTier,
  getByTag: getPremiumContentByTag,
  search: searchPremiumContent,
  categories: getPremiumCategories,
  stats: getContentRegistryStats,
  getAsset: getPremiumContentAsset,
  validateAccess: validateContentAccess,
};