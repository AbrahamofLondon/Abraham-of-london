// pages/api/generate-pdfs/batch.ts - FULLY CORRECTED
import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFGenerationOrchestrator } from '../../../scripts/generate-pdfs';

// Types for the response
interface GenerationResult {
  id: string;
  success: boolean;
  size?: number;
  duration: number;
  error?: string;
}

interface BatchResponse {
  success: boolean;
  summary?: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
  details?: GenerationResult[];
  error?: string;
  timestamp?: string;
}

// Helper function to get specific generation methods
async function generateSpecificIDs(orchestrator: PDFGenerationOrchestrator, ids: string[]): Promise<GenerationResult[]> {
  // Since the orchestrator doesn't have a generateSingle method in the provided code,
  // we'll need to adapt. Looking at the code, we should use the content scanning approach.
  
  const results: GenerationResult[] = [];
  
  // Initialize the orchestrator (this will do content scanning)
  const init = await orchestrator.initialize();
  
  if (init.contentScan) {
    // Filter entries to only include requested IDs
    const filteredEntries = init.contentScan.entries.filter(entry => ids.includes(entry.id));
    
    // Generate only the filtered entries
    const generationResult = await orchestrator.generateFromContent(filteredEntries);
    
    // Convert results to the expected format
    generationResult.results.forEach(result => {
      results.push({
        id: result.id,
        success: result.success,
        duration: result.duration,
        size: result.size,
        error: result.error
      });
    });
  }
  
  return results;
}

async function generateByType(orchestrator: PDFGenerationOrchestrator, types: string[]): Promise<GenerationResult[]> {
  const init = await orchestrator.initialize();
  const results: GenerationResult[] = [];
  
  if (init.contentScan) {
    // Filter entries by type
    const filteredEntries = init.contentScan.entries.filter(entry => 
      types.includes(entry.type) || types.includes(entry.category)
    );
    
    // Generate the filtered entries
    const generationResult = await orchestrator.generateFromContent(filteredEntries);
    
    // Convert results
    generationResult.results.forEach(result => {
      results.push({
        id: result.id,
        success: result.success,
        duration: result.duration,
        size: result.size,
        error: result.error
      });
    });
  }
  
  return results;
}

async function generateAll(orchestrator: PDFGenerationOrchestrator): Promise<GenerationResult[]> {
  const init = await orchestrator.initialize();
  const results: GenerationResult[] = [];
  
  if (init.contentScan) {
    // Generate all entries
    const generationResult = await orchestrator.generateFromContent(init.contentScan.entries);
    
    // Convert results
    generationResult.results.forEach(result => {
      results.push({
        id: result.id,
        success: result.success,
        duration: result.duration,
        size: result.size,
        error: result.error
      });
    });
  }
  
  return results;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BatchResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { types, tiers: _tiers, ids } = req.body; // Fixed: prefixed unused variable with underscore
    
    console.log(`[API] Batch generation requested`);
    
    const orchestrator = new PDFGenerationOrchestrator();
    let results: GenerationResult[];
    
    if (ids && Array.isArray(ids)) {
      // Generate specific IDs
      console.log(`[API] Generating specific IDs: ${ids.join(', ')}`);
      results = await generateSpecificIDs(orchestrator, ids);
    } else if (types && Array.isArray(types)) {
      // Generate by type
      console.log(`[API] Generating by types: ${types.join(', ')}`);
      results = await generateByType(orchestrator, types);
    } else {
      // Generate all
      console.log(`[API] Generating all content`);
      results = await generateAll(orchestrator);
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
    
    console.log(`[API] Generation complete: ${successful} successful, ${failed} failed`);
    
    return res.status(200).json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
        duration: totalDuration
      },
      details: results.map(r => ({
        id: r.id,
        success: r.success,
        size: r.size,
        duration: r.duration,
        error: r.error
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API] Batch generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}