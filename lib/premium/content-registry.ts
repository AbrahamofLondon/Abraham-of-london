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
    editionType?: "public-surface" | "institutional-pdf" | "board-deck";
    surfaceHref?: string;
    directDownloadHref?: string;
    relatedIds?: string[];
    coveragePeriod?: string;
    currentDecisionWindow?: string;
    updatedAt?: string;
    statusLabel?: string;
    nextScheduledReport?: string;
    freshnessNote?: string;
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

const GMI_RELATED_IDS = [
  "global-market-outlook-q1-2026-public",
  "global-market-intelligence-report-q1-2026",
  "global-market-intelligence-board-deck-q1-2026",
] as const;

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
    id: "global-market-outlook-q1-2026-public",
    title: "Global Market Intelligence Q1 2026",
    subtitle: "Public Surface Edition",
    description:
      "Public-facing Global Market Intelligence Q1 2026 surface edition: readable, elegant, and commercially useful without overexposing the deeper institutional layer.",
    category: "market-intelligence",
    categorySlug: "market-intel",
    confidentialLevel: "low",
    featured: true,
    fileSize: "Surface Edition",
    tags: [
      "global",
      "market-outlook",
      "public",
      "quarterly",
      "macro",
      "market-intelligence",
      "surface-edition",
    ],
    asset: {
      relativePath: "reports/intel-2026-q1.pdf",
      mimeType: "application/pdf",
      filename: "intel-2026-q1.pdf",
      pageCount: 24,
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-04-08",
      version: "1.0.0",
      docId: "GMO-Q1-2026-P",
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
      productLine: "Market Outlook",
      editionType: "public-surface",
      coveragePeriod: "Q1 2026",
      currentDecisionWindow: "Q2 2026",
      updatedAt: "2026-04-08",
      statusLabel: "Open reference surface",
      nextScheduledReport: "Q2 2026 report in preparation",
      surfaceHref: "/intelligence/global-market-intelligence-q1-2026",
      directDownloadHref: "/.netlify/functions/gmi-boardroom-pdf",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
      relatedIds: [...GMI_RELATED_IDS],
    },
  },

  {
    id: "global-market-intelligence-report-q1-2026",
    title: "Global Market Intelligence Report Q1 2026",
    subtitle: "Institutional PDF Edition",
    description:
      "Primary institutional PDF edition for Q1 2026 covering macro strain, capital flows, regional posture, April tariff escalation, market repricing, and Q2 scenario implications for serious operators.",
    category: "market-intelligence",
    categorySlug: "market-intel",
    confidentialLevel: "high",
    featured: false,
    fileSize: "5.5 MB",
    fileSizeBytes: 5_813_385,
    expiresAt: "2026-12-31",
    tags: [
      "global",
      "quarterly",
      "report",
      "pdf",
      "macro",
      "capital-flows",
      "institutional",
      "market-intelligence",
    ],
    asset: {
      relativePath: "reports/intel-2026-q1.pdf",
      mimeType: "application/pdf",
      filename: "intel-2026-q1.pdf",
      pageCount: 42,
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-04-08",
      updatedAt: "2026-04-08",
      version: "2.0.0",
      docId: "GMI-Q1-2026",
      classification: "RESTRICTED",
      watermarkRequired: true,
      maxDownloads: 5,
      allowedTiers: ["architect", "owner", "inner-circle"],
      productLine: "Institutional PDF Edition",
      editionType: "institutional-pdf",
      coveragePeriod: "Q1 2026",
      currentDecisionWindow: "Q2 2026",
      statusLabel: "Active until superseded by Q2 2026 report",
      nextScheduledReport: "Q2 2026 report in preparation",
      freshnessNote:
        "This report reviews Q1 2026 conditions and remains active for Q2 decision use because it includes April 2026 tariff escalation, market repricing, and Q2 scenario implications. It will remain current until superseded by the Q2 2026 Market Intelligence Report.",
      surfaceHref: "/intelligence/global-market-intelligence-q1-2026",
      directDownloadHref: "/api/premium/content/download/global-market-intelligence-report-q1-2026",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
      relatedIds: [...GMI_RELATED_IDS],
    },
  },

  {
    id: "global-market-intelligence-board-deck-q1-2026",
    title: "Global Market Intelligence Q1 2026 — Board Briefing Deck",
    subtitle: "Executive Presentation Edition",
    description:
      "The updated premium board deck edition for Q1 2026, structured for executive presentation, institutional review, and leadership discussion.",
    category: "board-briefings",
    categorySlug: "board-briefings",
    confidentialLevel: "high",
    featured: false,
    fileSize: "337 KB",
    fileSizeBytes: 345_518,
    expiresAt: "2026-12-31",
    tags: [
      "global",
      "quarterly",
      "board-briefing",
      "deck",
      "pptx",
      "presentation",
      "macro",
      "market-intelligence",
    ],
    asset: {
      relativePath: "reports/GMI-Q1-2026-Deck.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: "GMI-Q1-2026-Deck.pptx",
    },
    metadata: {
      author: "Abraham of London Intelligence",
      createdAt: "2026-04-08",
      version: "2.0.0",
      docId: "GMI-Q1-2026-D",
      classification: "RESTRICTED",
      watermarkRequired: false,
      maxDownloads: 5,
      allowedTiers: ["architect", "owner", "inner-circle"],
      productLine: "Board Briefing Deck",
      editionType: "board-deck",
      surfaceHref: "/intelligence/global-market-intelligence-q1-2026",
      directDownloadHref: "/api/premium/content/download/global-market-intelligence-board-deck-q1-2026",
      coverImage:
        "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg",
      relatedIds: [...GMI_RELATED_IDS],
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

export function getRelatedPremiumContent(id: string): PremiumContentItem[] {
  const item = getPremiumContentById(id);
  if (!item?.metadata?.relatedIds?.length) return [];
  return item.metadata.relatedIds
    .filter((relatedId) => relatedId !== id)
    .map((relatedId) => getPremiumContentById(relatedId))
    .filter((value): value is PremiumContentItem => Boolean(value));
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
  getRelated: getRelatedPremiumContent,
  search: searchPremiumContent,
  categories: getPremiumCategories,
  stats: getContentRegistryStats,
  getAsset: getPremiumContentAsset,
  validateAccess: validateContentAccess,
};
