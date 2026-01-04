// pages/api/generate-all-pdfs.ts - UPDATED VERSION
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPDFsRequiringGeneration } from '../../scripts/pdf-registry';
import { PDFGenerationPipeline } from '../../scripts/generate-pdfs'; // Import actual generator

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers.authorization?.split(' ')[1] || req.query.apiKey as string;
    
    // Validate API key
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🚀 Starting bulk PDF generation...');
    
    // Get PDFs requiring generation
    const pdfsToGenerate = getPDFsRequiringGeneration();
    
    if (pdfsToGenerate.length === 0) {
      return res.status(200).json({ 
        message: 'No PDFs require generation',
        generated: [],
        stats: { total: 0, successful: 0, failed: 0 }
      });
    }

    const pipeline = new PDFGenerationPipeline();
    const results = [];
    
    // Generate each PDF
    for (const pdf of pdfsToGenerate) {
      try {
        console.log(`🔄 Generating: ${pdf.title} (${pdf.id})`);
        
        const result = await pipeline.generatePDF(pdf.id);
        
        results.push({ 
          id: pdf.id, 
          success: true,
          duration: result.duration || 0
        });
        
        console.log(`✅ Generated: ${pdf.title}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to generate ${pdf.id}:`, error.message);
        results.push({ 
          id: pdf.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json({
      message: `Generated ${successful} PDFs, ${failed} failed`,
      generated: results,
      stats: {
        total: pdfsToGenerate.length,
        successful,
        failed
      }
    });

  } catch (error: any) {
    console.error('💥 PDF generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}