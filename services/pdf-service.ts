// services/pdf-service.ts
import { PDFItem, GenerationResponse } from '@/types/pdf-dashboard';

export class PDFService {
  static async getPDFs(): Promise<PDFItem[]> {
    try {
      const response = await fetch('/api/pdfs/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch PDFs: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch PDFs');
      }
      
      // Transform the API response to match PDFItem format
      return result.pdfs.map((pdf: any) => ({
        id: pdf.id,
        title: pdf.title,
        description: pdf.description || '',
        category: pdf.category || 'uncategorized',
        type: pdf.type || 'pdf',
        exists: pdf.exists || false,
        isGenerating: pdf.isGenerating || false,
        error: pdf.error,
        fileUrl: pdf.fileUrl,
        fileSize: pdf.fileSize,
        lastGenerated: pdf.lastGenerated,
        createdAt: pdf.createdAt || new Date().toISOString(),
        updatedAt: pdf.updatedAt || new Date().toISOString(),
        tags: pdf.tags || [],
        status: pdf.status || (pdf.exists ? 'generated' : 'pending'),
        metadata: pdf.metadata || {},
        outputPath: pdf.outputPath,
        downloadCount: pdf.downloadCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      throw error;
    }
  }

  static async getPDFById(pdfId: string): Promise<PDFItem | null> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch PDF');
      }
      
      return result.pdf;
    } catch (error) {
      console.error(`Error fetching PDF ${pdfId}:`, error);
      throw error;
    }
  }

  static async generatePDF(pdfId: string, options?: any): Promise<{
    fileUrl: string;
    fileSize: string;
    generatedAt: string;
  }> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate PDF: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
      
      return {
        fileUrl: result.fileUrl || `/pdfs/${pdfId}.pdf`,
        fileSize: result.fileSize || '0KB',
        generatedAt: result.generatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error generating PDF ${pdfId}:`, error);
      throw error;
    }
  }

  static async deletePDF(pdfId: string): Promise<void> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete PDF: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting PDF ${pdfId}:`, error);
      throw error;
    }
  }

  static async duplicatePDF(pdfId: string): Promise<PDFItem> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to duplicate PDF: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate PDF');
      }
      
      return result.pdf;
    } catch (error) {
      console.error(`Error duplicating PDF ${pdfId}:`, error);
      throw error;
    }
  }

  static async renamePDF(pdfId: string, newTitle: string): Promise<void> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to rename PDF: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error renaming PDF ${pdfId}:`, error);
      throw error;
    }
  }

  static async updateMetadata(pdfId: string, metadata: Partial<PDFItem>): Promise<void> {
    try {
      const response = await fetch(`/api/pdfs/${pdfId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update metadata: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error updating metadata for PDF ${pdfId}:`, error);
      throw error;
    }
  }

  // Optional: Additional methods for batch operations
  static async batchDelete(pdfIds: string[]): Promise<void> {
    try {
      const response = await fetch('/api/pdfs/batch/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to batch delete PDFs');
      }
    } catch (error) {
      console.error('Error batch deleting PDFs:', error);
      throw error;
    }
  }

  static async batchExport(pdfIds: string[], format: string): Promise<Blob> {
    try {
      const response = await fetch('/api/pdfs/batch/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfIds, format }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to batch export PDFs');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error batch exporting PDFs:', error);
      throw error;
    }
  }
}