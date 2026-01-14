// services/pdfService.ts
import { 
  PDFItem, 
  PDFConfig, 
  GenerationResponse, 
  ServiceResponse,
  SearchResult,
  ExportOptions,
  BatchOperation,
  PDFListResponse,
  Pagination
} from '@/types/pdf-dashboard';

// Mock data for development
const MOCK_PDFS: PDFItem[] = [
  {
    id: '1',
    title: 'Annual Report 2024',
    description: 'Complete financial report for fiscal year 2024',
    category: 'reports',
    type: 'financial',
    exists: true,
    fileUrl: '/pdfs/annual-report-2024.pdf',
    fileSize: '2.4 MB',
    lastGenerated: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['financial', 'annual', 'report'],
    status: 'generated'
  },
  {
    id: '2',
    title: 'Product Catalog Q1',
    description: 'Product catalog for first quarter',
    category: 'catalogs',
    type: 'product',
    exists: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    tags: ['product', 'catalog', 'q1'],
    status: 'pending'
  },
  {
    id: '3',
    title: 'User Manual v3.0',
    description: 'Complete user manual for software version 3.0',
    category: 'manuals',
    type: 'documentation',
    exists: true,
    fileUrl: '/pdfs/user-manual-v3.pdf',
    fileSize: '1.8 MB',
    lastGenerated: '2024-01-10T14:20:00Z',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-10T14:20:00Z',
    tags: ['manual', 'documentation', 'v3'],
    status: 'generated'
  },
  {
    id: '4',
    title: 'Marketing Brochure',
    description: 'Company marketing brochure',
    category: 'marketing',
    type: 'brochure',
    exists: false,
    isGenerating: true,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    tags: ['marketing', 'brochure'],
    status: 'generating'
  },
  {
    id: '5',
    title: 'Technical Specifications',
    description: 'Detailed technical specifications document',
    category: 'technical',
    type: 'specifications',
    exists: true,
    error: 'Failed to generate',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    tags: ['technical', 'specs'],
    status: 'error'
  }
];

export class PDFService {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all PDFs
  static async getPDFs(page: number = 1, limit: number = 50): Promise<PDFListResponse> {
    await this.delay(300); // Simulate network delay
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPDFs = MOCK_PDFS.slice(startIndex, endIndex);
    
    const stats = this.calculateStats(MOCK_PDFS);
    
    return {
      pdfs: paginatedPDFs,
      pagination: {
        page,
        limit,
        total: MOCK_PDFS.length,
        totalPages: Math.ceil(MOCK_PDFS.length / limit)
      },
      stats
    };
  }

  // Get PDF by ID
  static async getPDFById(id: string): Promise<PDFItem | null> {
    await this.delay(200);
    return MOCK_PDFS.find(pdf => pdf.id === id) || null;
  }

  // Generate single PDF
  static async generatePDF(id: string, options?: any): Promise<GenerationResponse> {
    try {
      // Simulate API call
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ id, options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback simulation for development
      await this.delay(2000);
      
      const pdf = MOCK_PDFS.find(p => p.id === id);
      if (!pdf) {
        return {
          success: false,
          error: `PDF with ID ${id} not found`
        };
      }

      return {
        success: true,
        filename: `${pdf.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        fileUrl: `/pdfs/${pdf.id}.pdf`,
        pdfId: id,
        generatedAt: new Date().toISOString(),
        fileSize: '1.5 MB'
      };
    }
  }

  // Generate all PDFs
  static async generateAllPDFs(): Promise<GenerationResponse> {
    try {
      const response = await fetch('/api/pdf/generate-all', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating all PDFs:', error);
      
      // Fallback simulation
      await this.delay(3000);
      
      const missingPDFs = MOCK_PDFS.filter(p => !p.exists && !p.error);
      
      return {
        success: true,
        count: missingPDFs.length,
        message: `Generated ${missingPDFs.length} PDFs successfully`
      };
    }
  }

  // Delete PDF
  static async deletePDF(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/pdf/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw error;
    }
  }

  // Duplicate PDF
  static async duplicatePDF(id: string): Promise<PDFItem> {
    try {
      const response = await fetch(`/api/pdf/${id}/duplicate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error duplicating PDF:', error);
      
      // Fallback simulation
      await this.delay(1000);
      
      const original = MOCK_PDFS.find(p => p.id === id);
      if (!original) {
        throw new Error(`PDF with ID ${id} not found`);
      }

      const duplicate: PDFItem = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        title: `${original.title} (Copy)`,
        exists: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return duplicate;
    }
  }

  // Rename PDF
  static async renamePDF(id: string, newTitle: string): Promise<void> {
    try {
      const response = await fetch(`/api/pdf/${id}/rename`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error renaming PDF:', error);
      throw error;
    }
  }

  // Update metadata
  static async updateMetadata(id: string, metadata: Partial<PDFItem>): Promise<void> {
    try {
      const response = await fetch(`/api/pdf/${id}/metadata`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  // Search PDFs
  static async searchPDFs(query: string): Promise<SearchResult[]> {
    await this.delay(300);
    
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return MOCK_PDFS
      .filter(pdf => 
        pdf.title.toLowerCase().includes(searchTerm) ||
        pdf.description?.toLowerCase().includes(searchTerm) ||
        pdf.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .map(pdf => ({
        id: pdf.id,
        title: pdf.title,
        description: pdf.description,
        category: pdf.category,
        score: 0.8 // Simulated relevance score
      }));
  }

  // Export PDF
  static async exportPDF(id: string, options: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch(`/api/pdf/${id}/export`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  // Batch operation
  static async batchOperation(operation: BatchOperation): Promise<ServiceResponse> {
    try {
      const response = await fetch('/api/pdf/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(operation)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing batch operation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Calculate statistics
  private static calculateStats(pdfs: PDFItem[]): DashboardStats {
    const totalPDFs = pdfs.length;
    const availablePDFs = pdfs.filter(p => p.exists && !p.error).length;
    const missingPDFs = pdfs.filter(p => !p.exists && !p.error && !p.isGenerating).length;
    const categories = Array.from(new Set(pdfs.map(p => p.category)));
    const generated = pdfs.filter(p => p.exists && !p.error).length;
    const errors = pdfs.filter(p => p.error).length;
    const generating = pdfs.filter(p => p.isGenerating).length;

    return {
      totalPDFs,
      availablePDFs,
      missingPDFs,
      categories,
      generated,
      errors,
      generating,
      lastUpdated: new Date().toISOString()
    };
  }

  // Legacy function for backward compatibility
  static async getAllPDFs(): Promise<PDFConfig[]> {
    const response = await this.getPDFs();
    return response.pdfs.map(pdf => ({
      id: pdf.id,
      title: pdf.title,
      description: pdf.description || '',
      category: pdf.category,
      type: pdf.type,
      exists: pdf.exists,
      fileSize: pdf.fileSize ? parseFloat(pdf.fileSize) : undefined,
      outputPath: pdf.fileUrl || '',
      createdAt: pdf.createdAt ? new Date(pdf.createdAt) : undefined,
      updatedAt: pdf.updatedAt ? new Date(pdf.updatedAt) : undefined
    }));
  }
}

// Export legacy functions for backward compatibility
export const getAllPDFs = PDFService.getAllPDFs;
export const getPDFById = PDFService.getPDFById;
export const generatePDF = PDFService.generatePDF;
export const generateAllPDFs = PDFService.generateAllPDFs;