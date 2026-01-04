// types/pdf-dashboard.ts
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

export interface GenerationResponse {
  success: boolean;
  filename?: string;
  error?: string;
  count?: number;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
}

export interface DashboardStats {
  totalPDFs: number;
  availablePDFs: number;
  missingPDFs: number;
  categories: string[];
}