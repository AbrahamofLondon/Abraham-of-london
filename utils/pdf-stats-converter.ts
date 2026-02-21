/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * utils/pdf-stats-converter.ts — CLIENT SAFE
 * Named Exports aligned with Institutional Analytics and API Routes.
 */

import type { PDFItem as PDFRegistryItem } from "@/lib/pdf/registry";
import { getAllPDFItems, getRegistryStats } from "@/lib/pdf/registry";
import type { PDFItem as PDFDashboardItem, DashboardStats } from "@/types/pdf-dashboard";

/**
 * NAMED EXPORT: getAllDashboardPDFs
 * Required by server analytics (SSR/API)
 */
export function getAllDashboardPDFs(): PDFDashboardItem[] {
  return getAllPDFItems({ includeMissing: true }).map(convertRegistryToDashboardItem);
}

/**
 * NAMED EXPORT: getDashboardStats
 * Required by server analytics (SSR/API)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const rawStats = await getRegistryStats();
  return convertStats(rawStats);
}

/**
 * NAMED EXPORT: convertStats
 * Required by app/api/stats/route.ts
 */
export function convertStats(rawStats: any): DashboardStats {
  const allPDFs = getAllDashboardPDFs();

  const sortedByDate = [...allPDFs].sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const available = Number(rawStats?.existsOnDisk ?? 0) || allPDFs.filter((p) => p.exists).length;
  const total = Number(rawStats?.totalAssets ?? 0) || allPDFs.length;
  const missing =
    Number(rawStats?.missingAssets ?? 0) || Math.max(0, total - available);

  return {
    totalPDFs: total,
    availablePDFs: available,
    missingPDFs: missing,
    categories: Object.keys(rawStats?.categories || {}),
    generated: available,
    errors: 0,
    generating: 0,
    lastUpdated: new Date().toISOString(),
    byTier: rawStats?.byTier || {},
    byType: calculateByType(allPDFs),
    byCategory: rawStats?.categories || {},
    averageFileSize: calculateAverageFileSize(allPDFs),
    newest: sortedByDate[0]?.lastModified || null,
    oldest: sortedByDate[sortedByDate.length - 1]?.lastModified || null,
  };
}

export function convertRegistryToDashboardItem(pdf: PDFRegistryItem): PDFDashboardItem {
  const exists = Boolean((pdf as any).exists);

  return {
    ...pdf,
    id: pdf.id,
    title: pdf.title,
    exists,
    isGenerating: false,
    fileUrl: (pdf as any).fileUrl || "",
    fileSize: (pdf as any).fileSize || "0 KB",
    lastGenerated: (pdf as any).lastModified,
    status: exists ? "generated" : "pending",
    tags: (pdf as any).tags || [],
    metadata: {
      format: (pdf as any).format,
      tier: (pdf as any).tier,
      version: (pdf as any).version,
    },
    downloadCount: 0,
    rating: 0,
    lastModified: (pdf as any).lastModified || "",
  } as PDFDashboardItem;
}

// Internal Helpers
function calculateByType(pdfs: PDFDashboardItem[]): Record<string, number> {
  return pdfs.reduce((acc, pdf) => {
    const type = (pdf as any).type || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateAverageFileSize(pdfs: PDFDashboardItem[]): string {
  if (pdfs.length === 0) return "0 KB";

  const totalKB = pdfs.reduce((acc, pdf) => {
    const s = String((pdf as any).fileSize || "");
    const match = s.match(/([\d.]+)\s*(KB|MB|GB)/i);
    if (!match) return acc;

    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (!Number.isFinite(num)) return acc;
    if (unit === "MB") return acc + num * 1024;
    if (unit === "GB") return acc + num * 1024 * 1024;
    return acc + num;
  }, 0);

  const avg = totalKB / pdfs.length;
  return avg > 1024 ? `${(avg / 1024).toFixed(1)} MB` : `${avg.toFixed(1)} KB`;
}

// Composite Default Export
const pdfStatsConverter = {
  getAllDashboardPDFs,
  getDashboardStats,
  convertStats,
  convertRegistryToDashboardItem,
};

export default pdfStatsConverter;