// pages/api/pdfs/list.ts - SSOT ALIGNED
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/auth-options";
import { getAllPDFItems } from "@/lib/pdf/registry";
import type { PDFItem, PDFListResponse, DashboardStats } from "@/types/pdf-dashboard";
import type { PDFType } from "@/lib/pdf/types";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

function toInt(input: unknown, fallback: number): number {
  const n = typeof input === "string" ? parseInt(input, 10) : Number(input);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isoNow(): string {
  return new Date().toISOString();
}

function canonicalizeWebPath(p: unknown): string {
  let v = typeof p === "string" ? p.trim() : "";
  if (!v) return "";
  if (!v.startsWith("/")) v = `/${v}`;
  return v.replace(/\/{2,}/g, "/");
}

// Use AccessTier directly from SSOT
const DEFAULT_TIER: AccessTier = "public";

const ALLOWED_TYPES: PDFType[] = [
  "editorial",
  "framework",
  "academic",
  "strategic",
  "tool",
  "canvas",
  "worksheet",
  "assessment",
  "journal",
  "tracker",
  "bundle",
  "toolkit",
  "playbook",
  "brief",
  "checklist",
  "pack",
  "blueprint",
  "liturgy",
  "study",
  "other",
];

/**
 * Normalize tier using SSOT
 */
function normalizeTier(v: unknown): AccessTier {
  return normalizeRequiredTier(v);
}

/**
 * If registry gives you "pdf" (or anything unknown), map to "other"
 */
function normalizeType(v: unknown): PDFType {
  const s = typeof v === "string" ? v.toLowerCase().trim() : "";
  if (!s) return "other";
  if (s === "pdf") return "other";
  return (ALLOWED_TYPES as string[]).includes(s) ? (s as PDFType) : "other";
}

function emptyResponse(page: number, limit: number): PDFListResponse {
  const stats: DashboardStats = {
    totalPDFs: 0,
    availablePDFs: 0,
    missingPDFs: 0,
    categories: [],
    generated: 0,
    errors: 0,
    generating: 0,
    lastUpdated: isoNow(),
  };

  return {
    pdfs: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    stats,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PDFListResponse | { error: string }>
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const page = clamp(toInt(req.query.page, 1), 1, 10_000);
  const limit = clamp(toInt(req.query.limit, 50), 1, 100);

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.setHeader("x-aol-auth", "none");
    return res.status(200).json(emptyResponse(page, limit));
  }

  res.setHeader("x-aol-auth", "ok");

  try {
    const all = getAllPDFItems({ includeMissing: true });

    const mapped: PDFItem[] = all.map((pdf: any) => {
      const exists = Boolean(pdf.existsOnDisk ?? pdf.exists ?? false);

      // Make outputPath canonical and always set
      const outputPath = canonicalizeWebPath(pdf.outputPath || pdf.fileUrl || "");

      // Keep fileUrl for compatibility, but never empty if outputPath exists
      const fileUrl = canonicalizeWebPath(pdf.fileUrl || outputPath);

      // Normalize tier using SSOT
      const tier = normalizeTier(pdf.tier);
      
      // Normalize type
      const type = normalizeType(pdf.type);

      return {
        id: String(pdf.id),
        title: String(pdf.title || pdf.id),

        // Canon-required fields
        type,
        tier,
        outputPath,

        // Dashboard/UI fields
        description: String(pdf.description || pdf.excerpt || "Classification pending..."),
        category: String(pdf.category || "General Intelligence"),

        exists,
        isGenerating: Boolean(pdf.isGenerating ?? false),
        error: pdf.error ? String(pdf.error) : undefined,

        fileUrl,
        fileSize: String(pdf.fileSizeHuman || pdf.fileSize || "0 KB"),
        lastGenerated: String(pdf.lastModifiedISO || pdf.lastModified || pdf.updatedAt || isoNow()),

        createdAt: String(pdf.createdAt || isoNow()),
        updatedAt: String(pdf.updatedAt || pdf.lastModifiedISO || isoNow()),

        tags: Array.isArray(pdf.tags) ? pdf.tags.map(String) : [],
        status: String(pdf.status || (exists ? "generated" : "pending")),
        metadata: pdf.metadata && typeof pdf.metadata === "object" ? pdf.metadata : {},
        downloadCount: Number.isFinite(Number(pdf.downloadCount)) ? Number(pdf.downloadCount) : 0,
      } as PDFItem;
    });

    // Filter by user access if needed
    const userTier = normalizeUserTier((session as any)?.aol?.tier || "public");
    const accessiblePDFs = mapped.filter(pdf => 
      hasAccess(userTier, pdf.tier)
    );

    const start = (page - 1) * limit;
    const paginated = accessiblePDFs.slice(start, start + limit);

    const categories = Array.from(new Set(mapped.map((p) => p.category).filter(Boolean)));

    const stats: DashboardStats = {
      totalPDFs: mapped.length,
      availablePDFs: mapped.filter((p) => p.exists && !p.error).length,
      missingPDFs: mapped.filter((p) => !p.exists && !p.error && !p.isGenerating).length,
      categories,
      generated: mapped.filter((p) => p.exists && !p.error).length,
      errors: mapped.filter((p) => Boolean(p.error)).length,
      generating: mapped.filter((p) => Boolean(p.isGenerating)).length,
      lastUpdated: isoNow(),
    };

    return res.status(200).json({
      pdfs: paginated,
      pagination: {
        page,
        limit,
        total: accessiblePDFs.length,
        totalPages: Math.ceil(accessiblePDFs.length / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("[PDF List API] Error:", error);
    return res.status(500).json({ error: "Internal Server Error: Registry inaccessible" });
  }
}