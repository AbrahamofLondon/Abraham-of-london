// pages/api/generate-pdfs/batch.ts 
import type { NextApiRequest, NextApiResponse } from 'next';
import { PDFGenerationOrchestrator } from '../../../scripts/generate-pdfs';
import { PDF_REGISTRY } from '../../../scripts/pdf-registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { types, tiers, ids } = req.body;
    
    console.log(`[API] Batch generation requested`);
    
    const orchestrator = new PDFGenerationOrchestrator();
    let results;
    
    if (ids && Array.isArray(ids)) {
      // Generate specific IDs
      results = await Promise.all(
        ids.map(id => orchestrator.generateSingle(id))
      );
    } else if (types && Array.isArray(types)) {
      // Generate by type
      results = [];
      for (const type of types) {
        const typeResults = await orchestrator.generateByType(type);
        results.push(...typeResults);
      }
    } else {
      // Generate all
      results = await orchestrator.generateAll();
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return res.status(200).json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
        duration: results.reduce((acc, r) => acc + r.duration, 0)
      },
      details: results.map(r => ({
        id: r.id,
        success: r.success,
        size: r.size,
        duration: r.duration,
        error: r.error
      }))
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