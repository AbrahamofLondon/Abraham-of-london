// lib/pdf/types.ts - UPDATED VERSION
export interface PDFBase {
  id: string;
  title: string;
  description: string;
  type: string;
  exists: boolean;
  error?: string;
  isGenerating?: boolean;
  lastGenerated?: string;
}

export interface PDFConfig extends PDFBase {
  fileSize?: number; // Number type in config
  fileUrl?: string;
}

export interface PDFItem extends PDFBase {
  fileSize?: string; // String type in UI
  fileUrl?: string;
}

export interface PDFStats {
  totalPDFs: number;
  generated: number;
  missing: number;
  errors: number;
}

export interface GenerationResult {
  id: string;
  success: boolean;
  error?: string;
  duration: number;
  outputPath?: string;
}

// Utility function to convert PDFConfig to PDFItem
export const configToItem = (config: PDFConfig): PDFItem => ({
  ...config,
  fileSize: config.fileSize ? `${config.fileSize} KB` : undefined,
});

// Utility function to convert array of PDFConfig to PDFItem
export const configsToItems = (configs: PDFConfig[]): PDFItem[] => 
  configs.map(configToItem);

