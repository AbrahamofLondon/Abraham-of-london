// utils/pdf-stats-converter.ts — CLIENT SAFE (no scripts/, no require)
// Converts registry items/stats to UI/dashboard friendly formats.

import type { PDFItem as PDFRegistryItem } from "@/lib/pdf/registry";
import { getAllPDFItems, getPDFItemById, getPDFStats } from "@/lib/pdf/registry"
import type { PDFItem as PDFDashboardItem, DashboardStats } from "@/types/pdf-dashboard";

// Convert PDF registry item to dashboard item
export function convertRegistryToDashboardItem(pdf: PDFRegistryItem): PDFDashboardItem {
  return {
    id: pdf.id,
    title: pdf.title,
    description: pdf.description,
    excerpt: pdf.excerpt,
    category: pdf.category,
    type: pdf.type,
    exists: pdf.exists || false,
    isGenerating: false, // This needs to be tracked separately
    error: undefined,
    fileUrl: pdf.fileUrl || '',
    fileSize: pdf.fileSize || '0 KB',
    lastGenerated: pdf.lastModified,
    createdAt: pdf.lastModified, // Use lastModified as fallback
    updatedAt: pdf.lastModified,
    tags: pdf.tags || [],
    status: pdf.exists ? 'generated' : 'pending',
    metadata: {
      format: pdf.format,
      isInteractive: pdf.isInteractive,
      isFillable: pdf.isFillable,
      tier: pdf.tier,
      requiresAuth: pdf.requiresAuth,
      version: pdf.version,
      priority: pdf.priority,
    },
    outputPath: pdf.outputPath,
    format: pdf.format,
    isInteractive: pdf.isInteractive,
    isFillable: pdf.isFillable,
    tier: pdf.tier,
    requiresAuth: pdf.requiresAuth,
    version: pdf.version,
    priority: pdf.priority,
    preload: pdf.preload,
    placeholder: pdf.placeholder,
    md5: pdf.md5,
    downloadCount: 0, // Not tracked in registry
    rating: 0, // Not tracked in registry
    lastModified: pdf.lastModified,
  };
}

// Get all PDFs with converted types
export function getAllDashboardPDFs(): PDFDashboardItem[] {
  const registryItems = getAllPDFItems();
  return registryItems.map(convertRegistryToDashboardItem);
}

// Convert registry stats to dashboard stats
export function getDashboardStats(): DashboardStats {
  const registryStats = getPDFStats();
  
  // Calculate based on available data
  const totalPDFs = registryStats.total || 0;
  const availablePDFs = registryStats.available || 0;
  const errors = 0; // Errors not tracked in basic stats
  const missingPDFs = Math.max(0, totalPDFs - availablePDFs - errors);
  
  // Extract from registry stats or use defaults
  const categories = registryStats.byCategory 
    ? Object.keys(registryStats.byCategory)
    : [];
  
  // Find newest and oldest from all PDFs
  const allPDFs = getAllPDFItems();
  let newest: string | null = null;
  let oldest: string | null = null;
  
  if (allPDFs.length > 0) {
    const sortedByDate = [...allPDFs].sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    newest = sortedByDate[0]?.lastModified || null;
    oldest = sortedByDate[sortedByDate.length - 1]?.lastModified || null;
  }
  
  return {
    totalPDFs,
    availablePDFs,
    missingPDFs,
    categories,
    generated: availablePDFs,
    errors,
    generating: 0, // Not tracked in registry
    lastUpdated: new Date().toISOString(),
    byTier: registryStats.byTier || {},
    byType: {}, // Not directly available, could compute from items
    byCategory: registryStats.byCategory || {},
    averageFileSize: '0 MB', // Would need to compute from file sizes
    newest,
    oldest,
  };
}

// Get PDF by ID with converted type
export function getDashboardPDFById(id: string): PDFDashboardItem | null {
  const registryItem = getPDFItemById(id);
  return registryItem ? convertRegistryToDashboardItem(registryItem) : null;
}

// Alias for getAllDashboardPDFs for consistency
export function getAllDashboardPDFItems(): PDFDashboardItem[] {
  return getAllDashboardPDFs();
}

// Alias for getDashboardStats
export function getDashboardPDFStats(): DashboardStats {
  return getDashboardStats();
}

// Alias for getDashboardPDFById
export function getDashboardPDFItemById(id: string): PDFDashboardItem | null {
  return getDashboardPDFById(id);
}

// Helper to compute enhanced stats
export function getEnhancedDashboardStats(): DashboardStats {
  const basicStats = getDashboardStats();
  const allPDFs = getAllDashboardPDFs();
  
  // Compute byType from all PDFs
  const byType: Record<string, number> = {};
  allPDFs.forEach(pdf => {
    byType[pdf.type] = (byType[pdf.type] || 0) + 1;
  });
  
  // Compute average file size (simplified)
  const sizeStrings = allPDFs.map(pdf => pdf.fileSize);
  const sizesInKB = sizeStrings.map(size => {
    const match = size.match(/([\d.]+)\s*(KB|MB|GB)/);
    if (!match) return 0;
    const [_, value, unit] = match;
    const num = parseFloat(value);
    if (unit === 'MB') return num * 1024;
    if (unit === 'GB') return num * 1024 * 1024;
    return num;
  });
  
  const totalSizeKB = sizesInKB.reduce((sum, size) => sum + size, 0);
  const avgSizeKB = allPDFs.length > 0 ? totalSizeKB / allPDFs.length : 0;
  const averageFileSize = avgSizeKB > 1024 
    ? `${(avgSizeKB / 1024).toFixed(1)} MB` 
    : avgSizeKB > 0 
      ? `${avgSizeKB.toFixed(1)} KB` 
      : '0 KB';
  
  return {
    ...basicStats,
    byType,
    averageFileSize,
  };
}

// Convert single registry item (alias for convertRegistryToDashboardItem)
export function convertRegistryItemToDashboardItem(pdf: PDFRegistryItem): PDFDashboardItem {
  return convertRegistryToDashboardItem(pdf);
}

// Group PDFs by category for dashboard display
export function getPDFsGroupedByCategory(): Record<string, PDFDashboardItem[]> {
  const pdfs = getAllDashboardPDFs();
  const grouped: Record<string, PDFDashboardItem[]> = {};
  
  pdfs.forEach(pdf => {
    const category = pdf.category || 'uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(pdf);
  });
  
  return grouped;
}

// Filter PDFs by tier
export function getPDFsByTier(tier: string): PDFDashboardItem[] {
  const pdfs = getAllDashboardPDFs();
  return pdfs.filter(pdf => pdf.tier === tier);
}

// Filter PDFs by type
export function getPDFsByType(type: string): PDFDashboardItem[] {
  const pdfs = getAllDashboardPDFs();
  return pdfs.filter(pdf => pdf.type === type);
}

// Search PDFs across all fields
export function searchDashboardPDFs(query: string): PDFDashboardItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllDashboardPDFs();
  
  const pdfs = getAllDashboardPDFs();
  return pdfs.filter(pdf => 
    pdf.title.toLowerCase().includes(q) ||
    pdf.description.toLowerCase().includes(q) ||
    pdf.excerpt?.toLowerCase().includes(q) ||
    pdf.tags.some(tag => tag.toLowerCase().includes(q)) ||
    pdf.category.toLowerCase().includes(q)
  );
}

// Get stats summary for quick dashboard display
export function getPDFsSummary() {
  const pdfs = getAllDashboardPDFs();
  const stats = getEnhancedDashboardStats();
  
  return {
    total: pdfs.length,
    available: pdfs.filter(p => p.exists).length,
    missing: pdfs.filter(p => !p.exists).length,
    interactive: pdfs.filter(p => p.isInteractive).length,
    fillable: pdfs.filter(p => p.isFillable).length,
    byTier: stats.byTier,
    byType: stats.byType,
    lastUpdated: stats.lastUpdated,
  };
}

// Default export for convenience
const pdfStatsConverter = {
  convertRegistryToDashboardItem,
  convertRegistryItemToDashboardItem,
  getAllDashboardPDFs,
  getAllDashboardPDFItems,
  getDashboardStats,
  getDashboardPDFStats,
  getEnhancedDashboardStats,
  getDashboardPDFById,
  getDashboardPDFItemById,
  getPDFsGroupedByCategory,
  getPDFsByTier,
  getPDFsByType,
  searchDashboardPDFs,
  getPDFsSummary,
};

export default pdfStatsConverter;