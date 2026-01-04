// services/pdfService.ts
import { PDFConfig, GenerationResponse } from '@/types/pdf-dashboard';

// Mock implementations - replace with actual implementations
export const getAllPDFs = (): PDFConfig[] => {
  // Implementation from your scripts
  return [];
};

export const getPDFById = (id: string): PDFConfig | null => {
  // Implementation from your scripts
  return null;
};

export class PDFService {
  static async generatePDF(id: string): Promise<GenerationResponse> {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async generateAllPDFs(): Promise<GenerationResponse> {
    const response = await fetch('/api/generate-all-pdfs', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}