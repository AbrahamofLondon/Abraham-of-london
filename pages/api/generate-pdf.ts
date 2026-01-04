// pages/api/generate-pdf.ts - UPDATED VERSION
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPDFById } from '../../scripts/pdf-registry';
import { PDFGenerationPipeline } from '../../scripts/generate-pdfs'; // Import actual generator

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, apiKey } = req.body;
    
    // Validate API key
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ error: 'PDF ID is required' });
    }

    const pdf = getPDFById(id);
    
    if (!pdf) {
      return res.status(404).json({ error: `PDF with ID "${id}" not found` });
    }

    console.log(`🚀 Generating PDF: ${pdf.title} (${pdf.id})`);
    
    // Use the REAL PDF generator (not the client mock)
    const pipeline = new PDFGenerationPipeline();
    
    try {
      // Generate the specific PDF
      const result = await pipeline.generatePDF(id);
      
      res.status(200).json({
        message: `Successfully generated ${pdf.title}`,
        pdf: {
          id: pdf.id,
          title: pdf.title,
          url: pdf.outputPath,
          generated: new Date().toISOString()
        },
        duration: result.duration || 0
      });
    } catch (genError: any) {
      res.status(500).json({
        error: `Failed to generate ${pdf.title}`,
        details: genError.message || 'Unknown generation error'
      });
    }

  } catch (error: any) {
    console.error('💥 PDF generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}