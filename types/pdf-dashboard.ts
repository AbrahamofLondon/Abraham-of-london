// types/pdf-dashboard.ts 
import type React from "react";
import type { PDFItem as CanonPDFItem } from "@/lib/pdf/types";

// ------------------------------------------------------------
// Core domain types
// ------------------------------------------------------------
export type ViewMode = "list" | "grid" | "detail";

// ✅ SINGLE SOURCE OF TRUTH
export type PDFItem = CanonPDFItem;


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
  averageFileSize?: string;
  newest?: PDFItem | null;
  oldest?: PDFItem | null;
}

// ------------------------------------------------------------
// Hook types
// ------------------------------------------------------------
export interface UsePDFDashboardOptions {
  initialViewMode?: ViewMode;
  defaultCategory?: string;

  /**
   * Milliseconds. Set to 0 or undefined to disable auto-refresh.
   * @default 30000
   */
  autoRefreshInterval?: number;
  
  /**
   * Whether to enable auto-refresh
   * @default true
   */
  enableAutoRefresh?: boolean;
  
  /**
   * Initial filter state
   */
  initialFilter?: Partial<FilterState>;
  
  /**
   * Maximum number of items to display
   */
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

  // Actions — use proper React setters to match the hook implementation
  setSelectedPDFId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  setGenerationStatus: React.Dispatch<React.SetStateAction<GenerationStatus | null>>;

  refreshPDFList: () => Promise<void>;

  generatePDF: (pdfId?: string, options?: any) => Promise<GenerationResponse>;
  generateAllPDFs: () => Promise<GenerationResponse>;

  updateFilter: (updates: Partial<FilterState>) => void;
  searchPDFs: (query: string) => void;
  sortPDFs: (sortBy: string) => void;
  clearFilters: () => void;

  deletePDF: (pdfId: string) => Promise<void>;
  duplicatePDF: (pdfId: string) => Promise<PDFItem>;
  renamePDF: (pdfId: string, newTitle: string) => Promise<void>;
  updatePDFMetadata: (pdfId: string, metadata: Partial<PDFItem>) => Promise<void>;
}

// ------------------------------------------------------------
// Other supporting types (kept, but trimmed of duplicates)
// ------------------------------------------------------------
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

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

export interface IPDFService {
  getPDFs(): Promise<PDFItem[]>;
  getPDFById(id: string): Promise<PDFItem | null>;
  generatePDF(id: string, options?: any): Promise<GenerationResponse>;
  generateAllPDFs(): Promise<GenerationResponse>;
  deletePDF(id: string): Promise<void>;
  duplicatePDF(id: string): Promise<PDFItem>;
  renamePDF(id: string, newTitle: string): Promise<void>;
  updateMetadata(id: string, metadata: Partial<PDFItem>): Promise<void>;
  searchPDFs(query: string): Promise<SearchResult[]>;
  exportPDF(id: string, options: ExportOptions): Promise<Blob>;
  batchOperation(operation: BatchOperation): Promise<ServiceResponse>;
  getStats(): Promise<DashboardStats>;
  getCategories(): Promise<string[]>;
}

// Convenience re-exports (kept)
export type {
  PDFItem as PDFDocument,
  FilterState as PDFFilterState,
  DashboardStats as PDFStats,
  GenerationStatus as PDFGenerationStatus,
  UsePDFDashboardReturn as PDFDashboardHookReturn,
};

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredKeys<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T>, K>;

// Events
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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CacheState<T> {
  data: T | null;
  timestamp: number;
  expiresAt: number;
  isValid: () => boolean;
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