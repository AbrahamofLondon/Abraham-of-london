// types/pdf-dashboard.ts
import type React from "react";
import type { PDFItem as CanonPDFItem } from "@/lib/pdf/types";

// ------------------------------------------------------------
// Core domain types
// ------------------------------------------------------------
export type ViewMode = "list" | "grid" | "detail";

// Re-export PDFItem from canon types
export type PDFType = CanonPDFItem['type'];

// ✅ SINGLE SOURCE OF TRUTH
export type PDFItem = CanonPDFItem;

// AdminUser type
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Analytics specific types
export type MetricType = "generations" | "views" | "downloads" | "errors" | "size" | "categories";

export interface PDFAnalyticsItem {
  id: string;
  title: string;
  exists: boolean;
  error?: string;
  category: string;
  tier?: string;
  fileSize?: string;
  lastModified?: string;
  updatedAt?: string;
}

// ------------------------------------------------------------
// Responses / status
// ------------------------------------------------------------
export interface GenerationResponse {
  success: boolean;
  pdfId?: string;
  filename?: string;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: string;
  count?: number;
  message?: string;
  error?: string;
  details?: any;
}

export interface GenerationStatus {
  type: "success" | "error" | "info" | "warning";
  message: string;
  details?: string;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
}

// ------------------------------------------------------------
// Filters / stats
// ------------------------------------------------------------
export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  sortBy: "title" | "date" | "size" | "category";
  sortOrder: "asc" | "desc";
  statusFilter: "all" | "generated" | "missing" | "error" | "generating";
}

export interface DashboardStats {
  totalPDFs: number;
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];

  generated: number;
  errors: number;
  generating: number;

  lastUpdated: string;

  byTier?: Record<string, number>;
  byType?: Record<string, number>;
  byCategory?: Record<string, number>;
  averageFileSize?: string;
  /** Adjusted to allow ISO strings from registry stats */
  newest?: string | PDFItem | null; 
  oldest?: string | PDFItem | null;
}

// ------------------------------------------------------------
// Analytics types
// ------------------------------------------------------------
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
}

export interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent) => void;
  trackError: (error: Error | string, details?: any) => void;
  trackPageView: (path: string) => void;
  setUser: (userId: string, traits?: Record<string, any>) => void;
}

// ------------------------------------------------------------
// PDF Metadata types
// ------------------------------------------------------------
export interface PDFMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  version?: string;
  generatedBy?: string;
  [key: string]: any;
}

// ------------------------------------------------------------
// Share & Export types
// ------------------------------------------------------------
export interface ShareOptions {
  method: "link" | "email" | "download";
  recipients?: string[];
  expiresAt?: string;
  permissions: string[];
  password?: string;
  watermark?: boolean;
}

export interface BatchOperation {
  ids: string[];
  operation: "delete" | "export" | "tag" | "generate" | "rename" | "duplicate";
  options?: any;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  score: number;
  type?: string;
  tags?: string[];
}

export interface ExportOptions {
  format: "pdf" | "html" | "text" | "json" | "csv" | "excel";
  includeAnnotations?: boolean;
  includeMetadata?: boolean;
  quality?: "low" | "medium" | "high";
  paperSize?: "A4" | "Letter" | "A3";
  orientation?: "portrait" | "landscape";
}

// ------------------------------------------------------------
// Service & API types
// ------------------------------------------------------------
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  statusCode?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PDFListResponse {
  pdfs: PDFItem[];
  pagination: Pagination;
  stats: DashboardStats;
  filters?: FilterState;
}

export interface PDFPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canGenerate: boolean;
  canDownload: boolean;
  canAnnotate?: boolean;
  canExport?: boolean;
  canBatch?: boolean;
}

// ------------------------------------------------------------
// Component Props
// ------------------------------------------------------------
export interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  stats: {
    total: number;
    available: number;
    missing: number;
  };
  user?: AdminUser;
  onRefresh: () => void;
  onGenerateAll: () => void;
  isGenerating: boolean;
}

export interface PDFActionsBarProps {
  pdf: PDFItem & {
    status?: 'generated' | 'pending' | 'error' | 'missing';
    fileSize?: number;
  };
  isGenerating: boolean;
  onGeneratePDF: () => void;
  onDeletePDF: () => void;
  onDuplicatePDF: () => void;
  onRenamePDF: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PDFViewerPanelProps {
  pdf: (PDFItem & {
    fileSize?: number;
    outputPath: string;
    status?: 'generated' | 'pending' | 'error' | 'missing';
  }) | null;
  isGenerating: boolean;
  onGeneratePDF: (id: string) => void;
  refreshKey: number;
}

// ------------------------------------------------------------
// Hook types
// ------------------------------------------------------------
export interface UsePDFDashboardOptions {
  initialViewMode?: ViewMode;
  defaultCategory?: string;
  autoRefreshInterval?: number;
  enableAutoRefresh?: boolean;
  initialFilter?: Partial<FilterState>;
  maxItems?: number;
}

export interface UsePDFDashboardReturn {
  // State
  pdfs: PDFItem[];
  filteredPDFs: PDFItem[];
  selectedPDF: PDFItem | null;
  selectedPDFId: string | null;

  isLoading: boolean;
  isGenerating: boolean;

  viewMode: ViewMode;
  filterState: FilterState;

  categories: string[];
  stats: DashboardStats;

  generationStatus: GenerationStatus | null;
  error: Error | null;

  // Setters
  setSelectedPDFId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setGenerationStatus: React.Dispatch<React.SetStateAction<GenerationStatus | null>>;

  // Actions
  refreshPDFList: () => Promise<void>;
  generatePDF: (pdfId?: string, options?: any) => Promise<GenerationResponse>;
  generateAllPDFs: () => Promise<GenerationResponse>;

  // Filters
  updateFilter: (updates: Partial<FilterState>) => void;
  searchPDFs: (query: string) => void;
  sortPDFs: (sortBy: string) => void;
  clearFilters: () => void;

  // CRUD
  deletePDF: (pdfId: string) => Promise<void>;
  duplicatePDF: (pdfId: string) => Promise<PDFItem>;
  renamePDF: (pdfId: string, newTitle: string) => Promise<void>;
  updatePDFMetadata: (pdfId: string, metadata: Partial<PDFItem>) => Promise<void>;
}

// ------------------------------------------------------------
// Settings & Preferences
// ------------------------------------------------------------
export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  defaultView: ViewMode;
  showStats: boolean;
  showRecentActivity: boolean;
  enableAnalytics: boolean;
  enableSharing: boolean;
  enableAnnotations: boolean;
  enableBatchOperations?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
}

export interface ThemeSettings {
  mode: "light" | "dark" | "auto";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable" | "spacious";
}

export interface NotificationSettings {
  enabled: boolean;
  types: {
    generationComplete: boolean;
    generationFailed: boolean;
    batchComplete: boolean;
    sharedWithMe: boolean;
    comments: boolean;
  };
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailEnabled: boolean;
}

export interface UserPreferences {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  shortcuts: Record<string, string>;
  recentSearches: string[];
  favoritePDFs: string[];
}

// ------------------------------------------------------------
// Service Interface
// ------------------------------------------------------------
export interface IPDFService {
  getPDFs: () => Promise<PDFItem[]>;
  getPDFById: (id: string) => Promise<PDFItem | null>;
  generatePDF: (id: string, options?: any) => Promise<GenerationResponse>;
  generateAllPDFs: () => Promise<GenerationResponse>;
  deletePDF: (id: string) => Promise<void>;
  duplicatePDF: (id: string) => Promise<PDFItem>;
  renamePDF: (id: string, newTitle: string) => Promise<void>;
  updateMetadata: (id: string, metadata: Partial<PDFItem>) => Promise<void>;
  searchPDFs: (query: string) => Promise<SearchResult[]>;
  exportPDF: (id: string, options: ExportOptions) => Promise<Blob>;
  batchOperation: (operation: BatchOperation) => Promise<ServiceResponse>;
  getStats: () => Promise<DashboardStats>;
  getCategories: () => Promise<string[]>;
}

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------
export type PDFEventType =
  | "pdf_open" 
  | "pdf_generated" 
  | "pdf_deleted" 
  | "pdf_shared" 
  | "pdf_exported"
  | "pdf_view_changed" 
  | "pdf_filter_changed" 
  | "pdf_search_performed"
  | "batch_operation" 
  | "error_occurred";

export interface PDFEvent {
  type: PDFEventType;
  payload: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

// ------------------------------------------------------------
// Re-exports for convenience
// ------------------------------------------------------------
export type {
  PDFItem as PDFDocument,
  FilterState as PDFFilterState,
  DashboardStats as PDFStats,
  GenerationStatus as PDFGenerationStatus,
  UsePDFDashboardReturn as PDFDashboardHookReturn,
};