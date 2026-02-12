// services/pdf-service.ts
import {
  PDFItem,
  PDFConfig,
  GenerationResponse,
  ServiceResponse,
  SearchResult,
  ExportOptions,
  BatchOperation,
  PDFListResponse,
  DashboardStats,
} from "@/types/pdf-dashboard";

export class PDFService {
  // ------------------------------------------------------------------
  // READ OPERATIONS
  // ------------------------------------------------------------------
  static async getPDFs(page: number = 1, limit: number = 50): Promise<PDFListResponse> {
    const response = await fetch(`/api/pdfs/list?page=${page}&limit=${limit}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async getPDFById(id: string): Promise<PDFItem | null> {
    const response = await fetch(`/api/pdfs/${id}`, {
      credentials: "include",
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.pdf ?? null;
  }

  static async searchPDFs(query: string): Promise<SearchResult[]> {
    const response = await fetch(`/api/pdfs/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.results ?? [];
  }

  // ------------------------------------------------------------------
  // GENERATION
  // ------------------------------------------------------------------
  static async generatePDF(id: string, options?: any): Promise<GenerationResponse> {
    const response = await fetch(`/api/pdfs/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ options }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async generateAllPDFs(): Promise<GenerationResponse> {
    const response = await fetch("/api/pdfs/generate-all", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // ------------------------------------------------------------------
  // MUTATIONS
  // ------------------------------------------------------------------
  static async deletePDF(id: string): Promise<void> {
    const response = await fetch(`/api/pdfs/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  static async duplicatePDF(id: string): Promise<PDFItem> {
    const response = await fetch(`/api/pdfs/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.pdf;
  }

  static async renamePDF(id: string, newTitle: string): Promise<void> {
    const response = await fetch(`/api/pdfs/${id}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: newTitle }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  static async updateMetadata(id: string, metadata: Partial<PDFItem>): Promise<void> {
    const response = await fetch(`/api/pdfs/${id}/metadata`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(metadata),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  // ------------------------------------------------------------------
  // BATCH OPERATIONS
  // ------------------------------------------------------------------
  static async batchDelete(ids: string[]): Promise<void> {
    const response = await fetch("/api/pdfs/batch/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  }

  static async batchExport(ids: string[], format: string): Promise<Blob> {
    const response = await fetch("/api/pdfs/batch/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids, format }),
    });
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    return response.blob();
  }

  static async batchOperation(operation: BatchOperation): Promise<ServiceResponse> {
    const response = await fetch("/api/pdfs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(operation),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
    return response.json();
  }

  // ------------------------------------------------------------------
  // EXPORT SINGLE PDF
  // ------------------------------------------------------------------
  static async exportPDF(id: string, options: ExportOptions): Promise<Blob> {
    const response = await fetch(`/api/pdfs/${id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(options),
    });
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    return response.blob();
  }

  // ------------------------------------------------------------------
  // LEGACY COMPATIBILITY (if needed)
  // ------------------------------------------------------------------
  static async getAllPDFs(): Promise<PDFConfig[]> {
    const { pdfs } = await this.getPDFs(1, 1000);
    return pdfs.map((pdf) => ({
      id: pdf.id,
      title: pdf.title,
      description: pdf.description || "",
      category: pdf.category,
      type: pdf.type,
      exists: pdf.exists,
      fileSize: pdf.fileSize ? parseFloat(pdf.fileSize) : undefined,
      outputPath: pdf.fileUrl || "",
      createdAt: pdf.createdAt ? new Date(pdf.createdAt) : undefined,
      updatedAt: pdf.updatedAt ? new Date(pdf.updatedAt) : undefined,
    }));
  }
}

// Legacy named exports
export const getAllPDFs = PDFService.getAllPDFs;
export const getPDFById = PDFService.getPDFById;
export const generatePDF = PDFService.generatePDF;
export const generateAllPDFs = PDFService.generateAllPDFs;