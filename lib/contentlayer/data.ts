// lib/contentlayer/data.ts
/**
 * ContentLayer data export for build-time usage
 * This file provides the getContentlayerData function that pages need during build
 */

export interface ContentLayerDocument {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title?: string;
  description?: string;
  date?: string;
  slug: string;
  body: {
    raw: string;
    code: string;
  };
  [key: string]: any;
}

let cachedContentlayerData: ContentLayerDocument[] | null = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadContentlayerData(): Promise<ContentLayerDocument[]> {
  // Check cache
  const now = Date.now();
  if (cachedContentlayerData && (now - lastLoadTime) < CACHE_DURATION) {
    return cachedContentlayerData;
  }

  try {
    // Try to import from contentlayer/generated
    // Using dynamic import to avoid build-time errors
    const contentlayer = await import('contentlayer/generated');
    
    // Extract documents from various possible exports
    const allDocuments = 
      contentlayer.allDocuments || 
      contentlayer.documents || 
      (contentlayer as any).default?.allDocuments ||
      [];
    
    cachedContentlayerData = allDocuments as ContentLayerDocument[];
    lastLoadTime = now;
    
    return cachedContentlayerData;
  } catch (error) {
    console.warn('[ContentLayer] Could not load from contentlayer/generated:', error);
    
    // Fallback: try to read from filesystem
    try {
      const fs = require('fs');
      const path = require('path');
      const generatedDir = path.join(process.cwd(), '.contentlayer/generated');
      
      if (fs.existsSync(generatedDir)) {
        const files = fs.readdirSync(generatedDir)
          .filter((f: string) => f.endsWith('.json'));
        
        const documents: ContentLayerDocument[] = [];
        
        for (const file of files) {
          try {
            const filePath = path.join(generatedDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            // Only include if it has required fields
            if (data._id && data.slug) {
              documents.push(data);
            }
          } catch (e) {
            console.warn(`[ContentLayer] Failed to parse ${file}:`, e);
          }
        }
        
        cachedContentlayerData = documents;
        lastLoadTime = now;
        return documents;
      }
    } catch (fsError) {
      console.warn('[ContentLayer] Filesystem fallback failed:', fsError);
    }
    
    // Return empty array if all attempts fail
    return [];
  }
}

export async function getContentlayerData(): Promise<{
  available: boolean;
  documentCount: number;
  documents: ContentLayerDocument[];
  types: string[];
  error?: string;
  warning?: string;
}> {
  try {
    const documents = await loadContentlayerData();
    
    if (documents.length === 0) {
      return {
        available: false,
        documentCount: 0,
        documents: [],
        types: [],
        warning: 'No ContentLayer documents found. Run "pnpm contentlayer build" to generate content.'
      };
    }
    
    // Extract unique document types
    const types = Array.from(
      new Set(
        documents.map(doc => doc.type || doc._raw?.sourceFileDir || 'unknown')
      )
    );
    
    return {
      available: true,
      documentCount: documents.length,
      documents: documents.slice(0, 50), // Limit for performance
      types
    };
  } catch (error) {
    console.error('[ContentLayer] getContentlayerData failed:', error);
    
    return {
      available: false,
      documentCount: 0,
      documents: [],
      types: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getAllDocuments(): Promise<ContentLayerDocument[]> {
  return await loadContentlayerData();
}

export async function getDocumentsByType(type: string): Promise<ContentLayerDocument[]> {
  const documents = await loadContentlayerData();
  return documents.filter(doc => 
    doc.type === type || doc._raw?.sourceFileDir === type
  );
}

export async function getDocumentBySlug(slug: string): Promise<ContentLayerDocument | null> {
  const documents = await loadContentlayerData();
  return documents.find(doc => doc.slug === slug) || null;
}

export async function getStaticPathsData() {
  const documents = await loadContentlayerData();
  
  return documents.map(doc => ({
    params: { 
      slug: doc.slug,
      type: doc.type || doc._raw?.sourceFileDir || 'unknown'
    }
  }));
}

// Default export for backward compatibility
const dataApi = {

  getContentlayerData,
  getAllDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getStaticPathsData

};
export default dataApi;

