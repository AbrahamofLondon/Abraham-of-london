// pages/api/pdfs/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/auth-options";
import { getAllPDFItems } from "@/lib/pdf/registry";
import type { PDFItem, PDFListResponse, DashboardStats } from "@/types/pdf-dashboard";

// Canon unions
import type { PDFTier, PDFType } from "@/lib/pdf/types";

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

const DEFAULT_TIER: PDFTier = "free";
const DEFAULT_TYPE: PDFType = "other";

const ALLOWED_TIERS: PDFTier[] = ["free", "member", "architect", "inner-circle", "inner-circle-elite"];
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

function normalizeTier(v: unknown): PDFTier {
  const s = typeof v === "string" ? v.toLowerCase().trim() : "";
  return (ALLOWED_TIERS as string[]).includes(s) ? (s as PDFTier) : DEFAULT_TIER;
}

/**
 * CRITICAL FIX:
 * If registry gives you "pdf" (or anything unknown), map to "other"
 * so the API is Canon-valid.
 */
function normalizeType(v: unknown): PDFType {
  const s = typeof v === "string" ? v.toLowerCase().trim() : "";
  if (!s) return DEFAULT_TYPE;
  if (s === "pdf") return "other";
  return (ALLOWED_TYPES as string[]).includes(s) ? (s as PDFType) : DEFAULT_TYPE;
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

      // Canon-valid enums (no more "pdf" poison)
      const type = normalizeType(pdf.type);
      const tier = normalizeTier(pdf.tier);

      return {
        id: String(pdf.id),
        title: String(pdf.title || pdf.id),

        // Canon-required fields (via your PDFItem = Canon + dashboard fields)
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

    const start = (page - 1) * limit;
    const paginated = mapped.slice(start, start + limit);

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
        total: mapped.length,
        totalPages: Math.ceil(mapped.length / limit),
      },
      stats,
    });
  } catch {
    return res.status(500).json({ error: "Internal Server Error: Registry inaccessible" });
  }
}