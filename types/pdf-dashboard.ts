// types/pdf-dashboard.ts

// PDF Item Interface
export interface PDFItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: string;
  exists: boolean;
  isGenerating?: boolean;
  error?: string;
  fileUrl?: string;
  fileSize?: string;
  lastGenerated?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  status?: 'generated' | 'pending' | 'error';
  metadata?: Record<string, any>;
  outputPath?: string;
}

// For backward compatibility
export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  exists: boolean;
  fileSize?: number;
  outputPath: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generation Response
export interface GenerationResponse {
  success: boolean;
  filename?: string;
  fileUrl?: string;
  error?: string;
  count?: number;
  pdfId?: string;
  generatedAt?: string;
  fileSize?: string;
}

// Filter State
export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'title' | 'date' | 'size' | 'category';
  sortOrder: 'asc' | 'desc';
  statusFilter: 'all' | 'generated' | 'missing' | 'error' | 'generating';
}

// Dashboard Statistics
export interface DashboardStats {
  totalPDFs: number;
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];
  generated: number;
  errors: number;
  generating: number;
  lastUpdated: string;
}

// Generation Status
export interface GenerationStatus {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: string;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
}

// Analytics Event
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

// PDF Metadata
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

// Share Options
export interface ShareOptions {
  method: 'link' | 'email';
  recipients?: string[];
  expiresAt?: string;
  permissions: string[];
}

// Batch Operation
export interface BatchOperation {
  ids: string[];
  operation: 'delete' | 'export' | 'tag' | 'generate';
  options?: any;
}

// Search Result
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  score: number;
}

// Export Options
export interface ExportOptions {
  format: 'pdf' | 'html' | 'text' | 'json';
  includeAnnotations?: boolean;
  includeMetadata?: boolean;
  quality?: 'low' | 'medium' | 'high';
}

// Service Response
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// PDF List with Pagination
export interface PDFListResponse {
  pdfs: PDFItem[];
  pagination: Pagination;
  stats: DashboardStats;
}

// User Permissions
export interface PDFPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canGenerate: boolean;
  canDownload: boolean;
}

// Dashboard Settings
export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  defaultView: 'list' | 'grid' | 'detail';
  showStats: boolean;
  showRecentActivity: boolean;
  enableAnalytics: boolean;
  enableSharing: boolean;
  enableAnnotations: boolean;
}

// Hook Return Types
export interface UsePDFDashboardReturn {
  // State
  pdfs: PDFItem[];
  filteredPDFs: PDFItem[];
  selectedPDF: PDFItem | null;
  selectedPDFId: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  viewMode: 'list' | 'grid' | 'detail';
  filterState: FilterState;
  categories: string[];
  stats: DashboardStats;
  generationStatus: GenerationStatus | null;
  error: Error | null;
  
  // Actions
  setSelectedPDFId: (id: string | null) => void;
  setViewMode: (mode: 'list' | 'grid' | 'detail') => void;
  setGenerationStatus: (status: GenerationStatus | null) => void;
  refreshPDFList: () => Promise<void>;
  generatePDF: (pdfId?: string, options?: any) => Promise<GenerationResponse>;
  generateAllPDFs: () => Promise<GenerationResponse>;
  updateFilter: (updates: Partial<FilterState>) => void;
  searchPDFs: (query: string) => void;
  sortPDFs: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  clearFilters: () => void;
  deletePDF: (pdfId: string) => Promise<void>;
  duplicatePDF: (pdfId: string) => Promise<PDFItem>;
  renamePDF: (pdfId: string, newTitle: string) => Promise<void>;
  updatePDFMetadata: (pdfId: string, metadata: Partial<PDFItem>) => Promise<void>;
}

// PDF Service Interface
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
}