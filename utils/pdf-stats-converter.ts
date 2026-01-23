// utils/pdf-stats-converter.ts
import { PDFItem as PDFDashboardItem, DashboardStats } from '@/types/pdf-dashboard';
import { PDFItem as PDFRegistryItem } from '@/scripts/pdf-registry';

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
    isGenerating: pdf.isGenerating || false,
    error: pdf.error,
    fileUrl: pdf.fileUrl || '',
    fileSize: pdf.fileSize || '0 KB',
    lastGenerated: pdf.lastModified,
    createdAt: pdf.lastModified || new Date().toISOString(),
    updatedAt: pdf.lastModified || new Date().toISOString(),
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
    downloadCount: pdf.downloadCount,
    rating: pdf.rating,
    lastModified: pdf.lastModified,
  };
}

// Get all PDFs with converted types
export function getAllDashboardPDFs(): PDFDashboardItem[] {
  const { getAllPDFItems } = require('@/scripts/pdf-registry');
  const registryItems = getAllPDFItems();
  return registryItems.map(convertRegistryToDashboardItem);
}

// Convert registry stats to dashboard stats
export function getDashboardStats(): DashboardStats {
  const { getPDFStats } = require('@/scripts/pdf-registry');
  const registryStats = getPDFStats();
  
  // Calculate based on available data
  const totalPDFs = registryStats.total || 0;
  const availablePDFs = registryStats.available || registryStats.generated || 0;
  const errors = registryStats.errors || 0;
  const missingPDFs = Math.max(0, totalPDFs - availablePDFs - errors);
  
  // Extract categories from byCategory object if available
  const categories = registryStats.byCategory 
    ? Object.keys(registryStats.byCategory)
    : [];
  
  return {
    totalPDFs,
    availablePDFs,
    missingPDFs,
    categories,
    generated: availablePDFs,
    errors,
    generating: registryStats.generating || 0,
    lastUpdated: new Date().toISOString(),
    byTier: registryStats.byTier || {},
    byType: registryStats.byType || {},
    byCategory: registryStats.byCategory || {},
    averageFileSize: registryStats.averageFileSize || '0 MB',
    newest: null,
    oldest: null,
  };
}

// Get PDF by ID with converted type
export function getDashboardPDFById(id: string): PDFDashboardItem | null {
  const { getPDFItemById } = require('@/scripts/pdf-registry');
  const registryItem = getPDFItemById(id);
  return registryItem ? convertRegistryToDashboardItem(registryItem) : null;
}