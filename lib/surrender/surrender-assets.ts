// lib/surrender/surrender-assets.ts — SSOT selector for Surrender Framework assets (TAGGED_ALL)
// - Includes ALL surrender-tagged assets
// - Excludes /assets/downloads/content-downloads/* duplicates
import { getAllPDFItems } from "@/lib/pdf/registry";
import type { PDFItem, PDFType } from "@/lib/pdf/registry";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

export type SurrenderCategoryKey = "worksheets" | "assessments" | "tools";

export type SurrenderAsset = PDFItem & {
  requiredTier: AccessTier;
  isPublic: boolean;
};

export const SURRENDER_ALLOWED_TYPES: PDFType[] = ["worksheet", "assessment", "tool", "framework"];

function isContentDownloadsDuplicate(item: PDFItem): boolean {
  const out = String(item.outputPath || "");
  return out.includes("/assets/downloads/content-downloads/");
}

function hasSurrenderSignal(item: PDFItem): boolean {
  const id = String(item.id || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  const category = String((item as any).category || "").toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.map((t) => String(t).toLowerCase()) : [];

  const tagHit =
    tags.includes("surrender") ||
    tags.includes("surrender-framework") ||
    tags.includes("surrender framework") ||
    tags.includes("principles-of-surrender") ||
    tags.includes("principles of surrender");

  const catHit = category.includes("surrender");
  const textHit = id.includes("surrender") || title.includes("surrender");

  return Boolean(tagHit || catHit || textHit);
}

function normalizeRequiredTierFromPDF(item: PDFItem): AccessTier {
  const raw = (item.tier as any) ?? (item as any).accessLevel ?? "public";
  return tiers.normalizeRequired(raw);
}

export function getSurrenderAssets(options?: { includeMissing?: boolean }): SurrenderAsset[] {
  const all = getAllPDFItems({ includeMissing: options?.includeMissing ?? false });

  return all
    .filter((x) => !!x.type && (SURRENDER_ALLOWED_TYPES as unknown as string[]).includes(String(x.type)))
    .filter((x) => !isContentDownloadsDuplicate(x))
    .filter(hasSurrenderSignal)
    .map((x) => {
      const requiredTier = normalizeRequiredTierFromPDF(x);
      return {
        ...x,
        requiredTier,
        isPublic: requiredTier === "public",
      };
    });
}

export function groupSurrenderAssets(assets: SurrenderAsset[]): Record<SurrenderCategoryKey, SurrenderAsset[]> {
  return {
    worksheets: assets.filter((a) => a.type === "worksheet"),
    assessments: assets.filter((a) => a.type === "assessment"),
    tools: assets.filter((a) => a.type === "tool" || a.type === "framework"),
  };
}