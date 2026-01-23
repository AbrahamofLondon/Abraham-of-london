// utils/pdf-types.ts
import { PDFItem as PDFRegistryItem } from '@/scripts/pdf-registry';
import { PDFItem as PDFDashboardItem } from '@/types/pdf-dashboard';

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

// Convert dashboard item to registry item (if needed)
export function convertDashboardToRegistryItem(pdf: PDFDashboardItem): PDFRegistryItem {
  return {
    id: pdf.id,
    title: pdf.title,
    description: pdf.description || '',
    excerpt: pdf.excerpt,
    outputPath: pdf.outputPath || '',
    type: pdf.type as any,
    format: pdf.format as any,
    isInteractive: pdf.isInteractive || false,
    isFillable: pdf.isFillable || false,
    category: pdf.category,
    tier: pdf.tier as any,
    formats: ['A4'], // Default
    fileSize: pdf.fileSize || '0 KB',
    lastModified: pdf.lastModified || new Date().toISOString(),
    exists: pdf.exists || false,
    tags: pdf.tags || [],
    requiresAuth: pdf.requiresAuth || false,
    version: pdf.version || '1.0.0',
    priority: pdf.priority,
    preload: pdf.preload,
    placeholder: pdf.placeholder,
    md5: pdf.md5,
    fileUrl: pdf.fileUrl,
    error: pdf.error,
    isGenerating: pdf.isGenerating,
    downloadCount: pdf.downloadCount,
    rating: pdf.rating,
  };
}

// Get all PDFs with converted types
export function getAllDashboardPDFs(): PDFDashboardItem[] {
  const { getAllPDFItems } = require('@/scripts/pdf-registry');
  const registryItems = getAllPDFItems();
  return registryItems.map(convertRegistryToDashboardItem);
}

// Get PDF by ID with converted type
export function getDashboardPDFById(id: string): PDFDashboardItem | null {
  const { getPDFItemById } = require('@/scripts/pdf-registry');
  const registryItem = getPDFItemById(id);
  return registryItem ? convertRegistryToDashboardItem(registryItem) : null;
}