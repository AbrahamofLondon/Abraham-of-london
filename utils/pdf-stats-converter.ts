/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * utils/pdf-stats-converter.ts — CLIENT SAFE
 * Named Exports aligned with Institutional Analytics and API Routes.
 */
import type { PDFItem as PDFRegistryItem } from "@/lib/pdf/registry";
import { getAllPDFItems, getPDFById as getPDFItemById, getRegistryStats } from "@/lib/pdf/registry";
import type { PDFItem as PDFDashboardItem, DashboardStats } from "@/types/pdf-dashboard";

/**
 * NAMED EXPORT: getAllDashboardPDFs
 * Required by app/actions/analytics.ts
 */
export function getAllDashboardPDFs(): PDFDashboardItem[] {
  return getAllPDFItems({ includeMissing: true }).map(convertRegistryToDashboardItem);
}

/**
 * NAMED EXPORT: getDashboardStats
 * Required by app/actions/analytics.ts
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
  
  const sortedByDate = [...allPDFs].sort((a, b) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  return {
    totalPDFs: rawStats.totalAssets || allPDFs.length,
    availablePDFs: rawStats.existsOnDisk || allPDFs.filter(p => p.exists).length,
    missingPDFs: rawStats.missingAssets || allPDFs.filter(p => !p.exists).length,
    categories: Object.keys(rawStats.categories || {}),
    generated: rawStats.existsOnDisk || 0,
    errors: 0,
    generating: 0,
    lastUpdated: new Date().toISOString(),
    byTier: rawStats.byTier || {},
    byType: calculateByType(allPDFs),
    byCategory: rawStats.categories || {},
    averageFileSize: calculateAverageFileSize(allPDFs),
    newest: sortedByDate[0]?.lastModified || null,
    oldest: sortedByDate[sortedByDate.length - 1]?.lastModified || null,
  };
}

export function convertRegistryToDashboardItem(pdf: PDFRegistryItem): PDFDashboardItem {
  return {
    ...pdf,
    id: pdf.id,
    title: pdf.title,
    exists: pdf.exists || false,
    isGenerating: false,
    fileUrl: pdf.fileUrl || '',
    fileSize: pdf.fileSize || '0 KB',
    lastGenerated: pdf.lastModified,
    status: pdf.exists ? 'generated' : 'pending',
    tags: pdf.tags || [],
    metadata: {
      format: pdf.format,
      tier: pdf.tier,
      version: pdf.version,
    },
    downloadCount: 0,
    rating: 0,
    lastModified: pdf.lastModified || '',
  } as PDFDashboardItem;
}

// Internal Helpers
function calculateByType(pdfs: PDFDashboardItem[]): Record<string, number> {
  return pdfs.reduce((acc, pdf) => {
    const type = pdf.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateAverageFileSize(pdfs: PDFDashboardItem[]): string {
  if (pdfs.length === 0) return '0 KB';
  const totalKB = pdfs.reduce((acc, pdf) => {
    const match = pdf.fileSize.match(/([\d.]+)\s*(KB|MB|GB)/);
    if (!match) return acc;
    const [, val, unit] = match;
    const num = parseFloat(val);
    if (unit === 'MB') return acc + (num * 1024);
    if (unit === 'GB') return acc + (num * 1024 * 1024);
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
  convertRegistryToDashboardItem
};

export default pdfStatsConverter;