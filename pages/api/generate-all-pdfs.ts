// pages/api/generate-all-pdfs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { LegacyCanvasGenerator } from '../../scripts/generate-legacy-canvas.tsx';
import { getPDFsRequiringGeneration, generateMissingPDFs } from '../../scripts/pdf-registry';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey } = req.headers;
    
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

    const results = [];
    
    // Generate each PDF
    for (const pdf of pdfsToGenerate) {
      try {
        if (pdf.id === 'legacy-architecture-canvas') {
          const generator = new LegacyCanvasGenerator();
          
          // Generate all formats
          for (const format of pdf.formats) {
            if (format !== 'bundle') {
              const pdfBytes = await generator.generate({
                format,
                includeWatermark: true,
                isPreview: false,
                quality: 'premium'
              });
              
              const outputPath = path.resolve(
                process.cwd(), 
                'public/assets/downloads',
                `legacy-architecture-canvas-${format.toLowerCase()}-premium.pdf`
              );
              
              require('fs').writeFileSync(outputPath, Buffer.from(pdfBytes));
              console.log(`✅ Generated ${format} format`);
            }
          }
          
          results.push({ id: pdf.id, success: true });
        } else {
          // Use the centralized generation function
          const generationResults = await generateMissingPDFs();
          const result = generationResults.find(r => r.id === pdf.id);
          
          if (result?.success) {
            results.push({ id: pdf.id, success: true });
          } else {
            results.push({ id: pdf.id, success: false, error: result?.error });
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to generate ${pdf.id}:`, error.message);
        results.push({ id: pdf.id, success: false, error: error.message });
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