// @/lib/pdf/types.ts
// ============================================================================
// CANONICAL PDF TYPES - SINGLE SOURCE OF TRUTH
// ============================================================================

import type { ReactNode } from "react";

// ----------------------------------------------------------------------------
// 1. CORE PDF ITEM
// ----------------------------------------------------------------------------
export interface PDFItem {
  // Required fields
  id: string;
  title: string;
  slug: string;
  type: string;
  category: string;
  tier: "free" | "premium" | "pro" | "legacy";
  
  // File information
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileUrl: string;
  downloadUrl: string;
  
  // Status flags
  exists: boolean;
  isGenerating: boolean;
  isGeneratable: boolean;
  isInteractive: boolean;
  isFillable: boolean;
  isDownloadable: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  
  // Metadata
  description?: string;
  excerpt?: string;
  tags: string[];
  version?: string;
  author?: string;
  license?: string;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  lastAccessed?: string;
  lastGenerated?: string; 
  
  // Generation info
  error?: string;
  warnings?: string[];
  generationTime?: number;
  
  // Content/source info
  sourceType: "mdx" | "template" | "manual" | "api";
  sourceId: string;
  sourcePath?: string;
  
  // Template info
  template?: string;
  templateVersion?: string;
  
  // SEO & display
  thumbnail?: string;
  previewUrl?: string;
  sortOrder: number;
  featuredOrder?: number;
  
  // Usage stats
  downloadCount: number;
  viewCount: number;
  generationCount: number;
  
  // Access control
  accessLevel: "public" | "members" | "premium" | "admin";
  requiresLogin: boolean;
  requiresPurchase: boolean;
  
  // Pricing (if applicable)
  price?: number;
  currency?: string;
  discountedPrice?: number;
  
  // Related content
  relatedPDFs?: string[];
  bundleId?: string;
  
  // Validation
  isValid: boolean;
  validationErrors?: string[];
  
  // Custom fields
  metadata?: Record<string, any>;
  customFields?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// 2. PDF GENERATION
// ----------------------------------------------------------------------------
export interface PDFGenerationOptions {
  // Output options
  format: "A4" | "Letter" | "A3" | "Legal";
  orientation: "portrait" | "landscape";
  quality: "low" | "medium" | "high" | "print";
  
  // Content options
  includeCover: boolean;
  includeToc: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  includeAnnotations: boolean;
  
  // Styling
  theme: "light" | "dark" | "custom";
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Advanced
  compress: boolean;
  optimizeForWeb: boolean;
  passwordProtect?: boolean;
  password?: string;
  
  // Metadata
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  
  // Watermark
  watermark?: {
    text?: string;
    image?: string;
    opacity: number;
    position: "center" | "diagonal" | "tiled";
  };
  
  // Custom
  customCss?: string;
  customHtml?: string;
  variables?: Record<string, any>;
  
  // Callbacks/triggers
  onProgress?: (progress: number) => void;
  onComplete?: (result: PDFGenerationResult) => void;
  onError?: (error: Error) => void;
}

export interface PDFGenerationResult {
  success: boolean;
  pdf: PDFItem;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  generationTime: number;
  warnings: string[];
  metadata: Record<string, any>;
  thumbnail?: string;
  preview?: string;
}

export interface PDFGenerationRequest {
  pdfId: string;
  options?: Partial<PDFGenerationOptions>;
  userId?: string;
  sessionId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  callbackUrl?: string;
  webhook?: string;
  metadata?: Record<string, any>;
}

export interface PDFGenerationResponse {
  requestId: string;
  status: "queued" | "processing" | "completed" | "failed";
  pdf?: PDFItem;
  progress?: number;
  estimatedTime?: number;
  result?: PDFGenerationResult;
  error?: string;
  timestamp: string;
}

// ----------------------------------------------------------------------------
// 3. PDF TEMPLATES
// ----------------------------------------------------------------------------
export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Template definition
  layout: "portrait" | "landscape" | "custom";
  sections: PDFTemplateSection[];
  components: PDFTemplateComponent[];
  
  // Styling
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    spacing: number;
  };
  
  // Content slots
  header?: PDFTemplateSection;
  footer?: PDFTemplateSection;
  cover?: PDFTemplateSection;
  toc?: PDFTemplateSection;
  
  // Metadata
  category: string;
  tags: string[];
  author: string;
  license: string;
  
  // Usage
  isActive: boolean;
  isDefault: boolean;
  usedBy: string[];
  usageCount: number;
  
  // Files
  thumbnail?: string;
  previewUrl?: string;
  sourceFile?: string;
  cssFile?: string;
  
  // Validation
  schema?: Record<string, any>;
  validationRules?: Record<string, any>;
}

export interface PDFTemplateSection {
  id: string;
  type: "header" | "footer" | "body" | "sidebar" | "cover" | "toc";
  name: string;
  content: string | PDFTemplateComponent[];
  position: "fixed" | "relative" | "absolute";
  repeatOnEachPage: boolean;
  conditions?: Record<string, any>;
  styles?: Record<string, any>;
}

export interface PDFTemplateComponent {
  id: string;
  type: "text" | "image" | "table" | "list" | "chart" | "qr" | "barcode" | "form" | "custom";
  name: string;
  content: any;
  props: Record<string, any>;
  styles: Record<string, any>;
  validation?: Record<string, any>;
  dataBinding?: string;
  visibilityConditions?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// 4. PDF BATCH OPERATIONS
// ----------------------------------------------------------------------------
export interface PDFBatchOperation {
  id: string;
  type: "generate" | "delete" | "export" | "compress" | "watermark" | "convert";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  pdfIds: string[];
  options?: Record<string, any>;
  
  // Progress tracking
  total: number;
  processed: number;
  successful: number;
  failed: number;
  
  // Results
  results: PDFBatchResult[];
  errors: PDFBatchError[];
  
  // Metadata
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  
  // Priority
  priority: "low" | "normal" | "high";
  
  // Notification
  notifyOnComplete: boolean;
  notificationEmail?: string;
}

export interface PDFBatchResult {
  pdfId: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface PDFBatchError {
  pdfId: string;
  error: string;
  code?: string;
  retryCount: number;
  lastAttempt: string;
}

// ----------------------------------------------------------------------------
// 5. PDF ANALYTICS & USAGE
// ----------------------------------------------------------------------------
export interface PDFAnalytics {
  pdfId: string;
  period: "day" | "week" | "month" | "year" | "custom";
  
  // Views
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Record<string, number>;
  viewsByCountry: Record<string, number>;
  viewsByDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Downloads
  totalDownloads: number;
  uniqueDownloads: number;
  downloadsByDate: Record<string, number>;
  downloadSources: Record<string, number>;
  
  // Generation
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  generationsByTemplate: Record<string, number>;
  
  // User engagement
  averageTimeSpent: number;
  bounceRate: number;
  completionRate: number;
  
  // Referral
  referralSources: Record<string, number>;
  topReferrers: string[];
  
  // Timestamps
  firstSeen: string;
  lastSeen: string;
  lastUpdated: string;
}

export interface PDFUsageStats {
  totalPDFs: number;
  totalSize: number;
  totalDownloads: number;
  totalViews: number;
  totalGenerations: number;
  
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byTier: Record<string, number>;
  
  mostPopular: Array<{
    pdfId: string;
    title: string;
    downloads: number;
    views: number;
  }>;
  
  recentActivity: Array<{
    timestamp: string;
    type: "download" | "view" | "generation" | "error";
    pdfId: string;
    userId?: string;
    details?: string;
  }>;
  
  storage: {
    used: number;
    available: number;
    quota: number;
    byMonth: Record<string, number>;
  };
}

// ----------------------------------------------------------------------------
// 6. PDF VALIDATION & QUALITY
// ----------------------------------------------------------------------------
export interface PDFValidationResult {
  pdfId: string;
  isValid: boolean;
  score: number; // 0-100
  
  // Checks
  fileExists: boolean;
  fileSize: {
    valid: boolean;
    actual: number;
    max: number;
  };
  fileFormat: {
    valid: boolean;
    detected: string;
    required: string;
  };
  
  // Content
  metadata: {
    complete: boolean;
    missingFields: string[];
    invalidFields: string[];
  };
  
  // Quality
  resolution: {
    dpi: number;
    recommended: number;
    valid: boolean;
  };
  compression: {
    ratio: number;
    recommended: number;
    valid: boolean;
  };
  
  // Accessibility
  accessibility: {
    hasTags: boolean;
    hasBookmarks: boolean;
    hasAltText: boolean;
    score: number;
  };
  
  // Security
  security: {
    encrypted: boolean;
    passwordProtected: boolean;
    allowsPrinting: boolean;
    allowsCopying: boolean;
  };
  
  // Issues
  warnings: string[];
  errors: string[];
  suggestions: string[];
  
  // Timestamp
  validatedAt: string;
}

// ----------------------------------------------------------------------------
// 7. PDF SEARCH & INDEXING
// ----------------------------------------------------------------------------
export interface PDFSearchOptions {
  query: string;
  fields?: ("title" | "content" | "metadata" | "tags" | "all")[];
  categories?: string[];
  types?: string[];
  tiers?: string[];
  
  // Filtering
  minSize?: number;
  maxSize?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
  
  // Status
  exists?: boolean;
  isGeneratable?: boolean;
  isPremium?: boolean;
  
  // Sorting
  sortBy?: "relevance" | "title" | "date" | "size" | "downloads" | "views";
  sortOrder?: "asc" | "desc";
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Advanced
  fuzzy?: boolean;
  boostFields?: Record<string, number>;
  highlight?: boolean;
}

export interface PDFSearchResult {
  pdf: PDFItem;
  score: number;
  highlights?: Record<string, string[]>;
  matchedFields: string[];
}

export interface PDFSearchResponse {
  results: PDFSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  took: number; // milliseconds
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

// ----------------------------------------------------------------------------
// 8. PDF EXPORT & CONVERSION
// ----------------------------------------------------------------------------
export interface PDFExportOptions {
  format: "pdf" | "html" | "png" | "jpeg" | "txt" | "json" | "csv" | "excel";
  
  // For images
  dpi?: number;
  quality?: number;
  pages?: number[] | "all";
  
  // For HTML
  includeStyles?: boolean;
  includeImages?: boolean;
  responsive?: boolean;
  
  // For text
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  
  // For data
  fields?: string[];
  flatten?: boolean;
  
  // General
  compress?: boolean;
  password?: string;
  watermark?: boolean;
}

export interface PDFExportResult {
  success: boolean;
  format: string;
  fileUrl: string;
  fileSize: number;
  fileName: string;
  pages?: number;
  metadata?: Record<string, any>;
  error?: string;
}

// ----------------------------------------------------------------------------
// 9. PDF STORAGE & ORGANIZATION
// ----------------------------------------------------------------------------
export interface PDFCollection {
  id: string;
  name: string;
  description?: string;
  slug: string;
  
  // Content
  pdfIds: string[];
  pdfCount: number;
  
  // Organization
  category: string;
  tags: string[];
  isFeatured: boolean;
  isPublic: boolean;
  
  // Display
  thumbnail?: string;
  coverImage?: string;
  sortOrder: number;
  
  // Access
  accessLevel: "public" | "private" | "shared";
  sharedWith?: string[];
  password?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  
  // Usage
  viewCount: number;
  downloadCount: number;
  
  // Custom
  metadata?: Record<string, any>;
}

export interface PDFFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  
  // Content
  pdfCount: number;
  subfolderCount: number;
  totalSize: number;
  
  // Permissions
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
    admin: string[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Settings
  isSystem: boolean;
  isHidden: boolean;
  syncEnabled: boolean;
}

// ----------------------------------------------------------------------------
// 10. PDF SERVICE INTERFACES
// ----------------------------------------------------------------------------
export interface IPDFService {
  // Core CRUD
  getPDFs(options?: any): Promise<PDFItem[]>;
  getPDFById(id: string): Promise<PDFItem | null>;
  createPDF(data: Partial<PDFItem>): Promise<PDFItem>;
  updatePDF(id: string, data: Partial<PDFItem>): Promise<PDFItem>;
  deletePDF(id: string): Promise<void>;
  
  // Generation
  generatePDF(id: string, options?: PDFGenerationOptions): Promise<PDFGenerationResult>;
  generateMultiplePDFs(ids: string[], options?: PDFGenerationOptions): Promise<PDFGenerationResult[]>;
  getGenerationStatus(requestId: string): Promise<PDFGenerationResponse>;
  cancelGeneration(requestId: string): Promise<boolean>;
  
  // Batch operations
  startBatchOperation(operation: Omit<PDFBatchOperation, "id" | "status" | "createdAt">): Promise<string>;
  getBatchOperation(id: string): Promise<PDFBatchOperation>;
  cancelBatchOperation(id: string): Promise<boolean>;
  
  // Search & Filter
  searchPDFs(options: PDFSearchOptions): Promise<PDFSearchResponse>;
  getCategories(): Promise<string[]>;
  getTags(): Promise<string[]>;
  
  // Analytics
  getPDFAnalytics(pdfId: string, period?: string): Promise<PDFAnalytics>;
  getUsageStats(): Promise<PDFUsageStats>;
  
  // Export & Conversion
  exportPDF(id: string, options: PDFExportOptions): Promise<PDFExportResult>;
  convertPDF(id: string, format: string): Promise<PDFExportResult>;
  
  // Validation
  validatePDF(id: string): Promise<PDFValidationResult>;
  validateAllPDFs(): Promise<PDFValidationResult[]>;
  
  // Templates
  getTemplates(): Promise<PDFTemplate[]>;
  getTemplate(id: string): Promise<PDFTemplate>;
  applyTemplate(pdfId: string, templateId: string): Promise<PDFItem>;
  
  // Collections
  getCollections(): Promise<PDFCollection[]>;
  getCollection(id: string): Promise<PDFCollection>;
  addToCollection(pdfId: string, collectionId: string): Promise<void>;
  removeFromCollection(pdfId: string, collectionId: string): Promise<void>;
  
  // File operations
  uploadPDF(file: File, metadata?: Partial<PDFItem>): Promise<PDFItem>;
  downloadPDF(id: string): Promise<Blob>;
  getPDFPreview(id: string): Promise<string>;
  
  // System
  cleanupOrphanedFiles(): Promise<number>;
  optimizeStorage(): Promise<{ saved: number; optimized: number }>;
  backupPDFs(options?: any): Promise<string>;
  restoreFromBackup(backupId: string): Promise<boolean>;
}

// ----------------------------------------------------------------------------
// 11. REACT COMPONENT PROPS
// ----------------------------------------------------------------------------
export interface PDFViewerProps {
  pdf: PDFItem | string; // PDFItem or PDF ID
  width?: number | string;
  height?: number | string;
  showToolbar?: boolean;
  showNavigation?: boolean;
  showThumbnails?: boolean;
  zoom?: number | "auto" | "page-width" | "page-height";
  page?: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onLoad?: (pdf: PDFItem) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface PDFThumbnailProps {
  pdf: PDFItem;
  size?: "sm" | "md" | "lg" | "xl";
  showTitle?: boolean;
  showBadges?: boolean;
  onClick?: (pdf: PDFItem) => void;
  className?: string;
}

export interface PDFListProps {
  pdfs: PDFItem[];
  layout?: "grid" | "list" | "detailed";
  onSelect?: (pdf: PDFItem) => void;
  onAction?: (action: string, pdf: PDFItem) => void;
  selectedIds?: string[];
  isLoading?: boolean;
  emptyMessage?: string | ReactNode;
  className?: string;
}

export interface PDFGeneratorProps {
  pdfId?: string;
  templateId?: string;
  data?: Record<string, any>;
  options?: Partial<PDFGenerationOptions>;
  onGenerate?: (result: PDFGenerationResult) => void;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  children?: ReactNode;
  className?: string;
}

// ----------------------------------------------------------------------------
// 12. UTILITY TYPES
// ----------------------------------------------------------------------------
export type PDFSortField = "title" | "createdAt" | "updatedAt" | "fileSize" | "downloadCount" | "viewCount";
export type PDFSortOrder = "asc" | "desc";

export interface PDFFilter {
  search?: string;
  categories?: string[];
  types?: string[];
  tiers?: string[];
  tags?: string[];
  exists?: boolean;
  isGeneratable?: boolean;
  isPremium?: boolean;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sizeRange?: {
    min?: number;
    max?: number;
  };
}

export interface PDFPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ----------------------------------------------------------------------------
// 13. EVENT TYPES
// ----------------------------------------------------------------------------
export type PDFEventType = 
  | "pdf:created"
  | "pdf:updated"
  | "pdf:deleted"
  | "pdf:generated"
  | "pdf:downloaded"
  | "pdf:viewed"
  | "pdf:exported"
  | "pdf:converted"
  | "pdf:validated"
  | "batch:started"
  | "batch:completed"
  | "batch:failed"
  | "generation:started"
  | "generation:completed"
  | "generation:failed"
  | "storage:optimized"
  | "backup:created"
  | "backup:restored";

export interface PDFEvent {
  type: PDFEventType;
  pdfId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// 14. ERROR TYPES
// ----------------------------------------------------------------------------
export class PDFError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public pdfId?: string
  ) {
    super(message);
    this.name = "PDFError";
  }
}

export class PDFGenerationError extends PDFError {
  constructor(message: string, details?: any, pdfId?: string) {
    super(message, "GENERATION_ERROR", details, pdfId);
    this.name = "PDFGenerationError";
  }
}

export class PDFValidationError extends PDFError {
  constructor(message: string, details?: any, pdfId?: string) {
    super(message, "VALIDATION_ERROR", details, pdfId);
    this.name = "PDFValidationError";
  }
}

export class PDFNotFoundError extends PDFError {
  constructor(pdfId: string) {
    super(`PDF not found: ${pdfId}`, "NOT_FOUND", undefined, pdfId);
    this.name = "PDFNotFoundError";
  }
}

export class PDFPermissionError extends PDFError {
  constructor(message: string, pdfId?: string) {
    super(message, "PERMISSION_DENIED", undefined, pdfId);
    this.name = "PDFPermissionError";
  }
}

// ----------------------------------------------------------------------------
// 15. CONSTANTS & ENUMS
// ----------------------------------------------------------------------------
export const PDF_CATEGORIES = [
  "worksheets",
  "guides",
  "templates",
  "checklists",
  "planners",
  "assessments",
  "reports",
  "certificates",
  "forms",
  "other"
] as const;

export const PDF_TYPES = [
  "fillable",
  "printable",
  "interactive",
  "digital",
  "editable",
  "static"
] as const;

export const PDF_TIERS = [
  "free",
  "premium",
  "pro",
  "legacy"
] as const;

export const PDF_FORMATS = [
  "A4",
  "Letter",
  "A3",
  "Legal",
  "Tabloid"
] as const;

export const PDF_ORIENTATIONS = [
  "portrait",
  "landscape"
] as const;

// ----------------------------------------------------------------------------
// 16. TYPE GUARDS & UTILITIES
// ----------------------------------------------------------------------------
export function isPDFItem(obj: any): obj is PDFItem {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.slug === "string" &&
    typeof obj.type === "string" &&
    typeof obj.category === "string" &&
    typeof obj.exists === "boolean"
  );
}

export function isPDFGenerationResult(obj: any): obj is PDFGenerationResult {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.success === "boolean" &&
    obj.pdf &&
    isPDFItem(obj.pdf)
  );
}

export function isValidPDFId(id: string): boolean {
  return /^pdf_[a-zA-Z0-9]{8,}$/.test(id);
}

// ----------------------------------------------------------------------------
// 17. DEFAULT VALUES & PRESETS
// ----------------------------------------------------------------------------
export const DEFAULT_PDF_GENERATION_OPTIONS: PDFGenerationOptions = {
  format: "A4",
  orientation: "portrait",
  quality: "high",
  includeCover: true,
  includeToc: false,
  includePageNumbers: true,
  includeWatermark: false,
  includeAnnotations: true,
  theme: "light",
  fontSize: 12,
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.5,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  compress: true,
  optimizeForWeb: true,
  passwordProtect: false
};

export const DEFAULT_PDF_SEARCH_OPTIONS: PDFSearchOptions = {
  query: "",
  fields: ["title", "content", "tags"],
  sortBy: "relevance",
  sortOrder: "desc",
  page: 1,
  limit: 20,
  fuzzy: true,
  highlight: true
};

// ----------------------------------------------------------------------------
// EXPORT ALL TYPES
// ----------------------------------------------------------------------------
export type {
  PDFItem as CanonPDFItem, // Alias for backward compatibility
};

export default {
  // Core types
  PDFItem,
  
  // Generation
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFGenerationRequest,
  PDFGenerationResponse,
  
  // Templates
  PDFTemplate,
  PDFTemplateSection,
  PDFTemplateComponent,
  
  // Batch operations
  PDFBatchOperation,
  PDFBatchResult,
  PDFBatchError,
  
  // Analytics
  PDFAnalytics,
  PDFUsageStats,
  
  // Validation
  PDFValidationResult,
  
  // Search
  PDFSearchOptions,
  PDFSearchResult,
  PDFSearchResponse,
  
  // Export
  PDFExportOptions,
  PDFExportResult,
  
  // Organization
  PDFCollection,
  PDFFolder,
  
  // Service interface
  IPDFService,
  
  // Component props
  PDFViewerProps,
  PDFThumbnailProps,
  PDFListProps,
  PDFGeneratorProps,
  
  // Utility types
  PDFSortField,
  PDFSortOrder,
  PDFFilter,
  PDFPagination,
  
  // Events
  PDFEventType,
  PDFEvent,
  
  // Errors
  PDFError,
  PDFGenerationError,
  PDFValidationError,
  PDFNotFoundError,
  PDFPermissionError,
  
  // Constants
  PDF_CATEGORIES,
  PDF_TYPES,
  PDF_TIERS,
  PDF_FORMATS,
  PDF_ORIENTATIONS,
  
  // Type guards
  isPDFItem,
  isPDFGenerationResult,
  isValidPDFId,
  
  // Defaults
  DEFAULT_PDF_GENERATION_OPTIONS,
  DEFAULT_PDF_SEARCH_OPTIONS,
};