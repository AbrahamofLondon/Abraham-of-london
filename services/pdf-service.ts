// services/pdf-service.ts
import { PDFItem } from '@/types/pdf-dashboard';

export class PDFService {
  static async getPDFs(): Promise<PDFItem[]> {
    const response = await fetch('/api/pdf/list');
    if (!response.ok) throw new Error('Failed to fetch PDFs');
    return response.json();
  }

  static async generatePDF(pdfId: string, options?: any): Promise<{
    fileUrl: string;
    fileSize: string;
    generatedAt: string;
  }> {
    const response = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfId, options }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate PDF');
    }
    
    return response.json();
  }

  static async deletePDF(pdfId: string): Promise<void> {
    const response = await fetch(`/api/pdf/${pdfId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete PDF');
    }
  }

  static async duplicatePDF(pdfId: string): Promise<PDFItem> {
    const response = await fetch(`/api/pdf/${pdfId}/duplicate`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to duplicate PDF');
    }
    
    return response.json();
  }

  static async renamePDF(pdfId: string, newTitle: string): Promise<void> {
    const response = await fetch(`/api/pdf/${pdfId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to rename PDF');
    }
  }

  static async updateMetadata(pdfId: string, metadata: Partial<PDFItem>): Promise<void> {
    const response = await fetch(`/api/pdf/${pdfId}/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update metadata');
    }
  }
}