// pages/api/generate-all-pdfs.ts - UPDATED FOR API ROUTE
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPDFsRequiringGeneration } from '../../scripts/pdf-registry';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key from environment
    const apiKey = req.headers.authorization?.split(' ')[1] || req.query.apiKey as string;
    
    if (!apiKey || apiKey !== process.env.PDF_GENERATION_API_KEY) {
      console.warn('Unauthorized PDF generation attempt');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Valid API key required'
      });
    }

    console.log('🚀 Starting bulk PDF generation via API...');
    
    // Get PDFs requiring generation from your registry
    const pdfsToGenerate = getPDFsRequiringGeneration();
    
    if (pdfsToGenerate.length === 0) {
      return res.status(200).json({ 
        message: 'No PDFs require generation',
        generated: [],
        stats: { total: 0, successful: 0, failed: 0 }
      });
    }

    console.log(`📊 Found ${pdfsToGenerate.length} PDFs to generate:`);
    pdfsToGenerate.forEach(pdf => {
      console.log(`  - ${pdf.title} (${pdf.id})`);
    });

    const results = [];
    
    // Generate each PDF
    for (const pdf of pdfsToGenerate) {
      try {
        console.log(`🔄 Generating: ${pdf.title} (${pdf.id})`);
        
        const result = await generateSinglePDF(pdf);
        
        results.push({ 
          id: pdf.id,
          title: pdf.title,
          success: true,
          duration: result.duration,
          outputPath: result.outputPath,
          fileSize: result.fileSize
        });
        
        console.log(`✅ Generated: ${pdf.title}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to generate ${pdf.id}:`, error.message);
        results.push({ 
          id: pdf.id,
          title: pdf.title,
          success: false, 
          error: error.message 
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Return comprehensive results
    res.status(200).json({
      message: `Generated ${successful} PDFs, ${failed} failed`,
      generated: results,
      stats: {
        total: pdfsToGenerate.length,
        successful,
        failed,
        timestamp: new Date().toISOString(),
        duration: results.reduce((acc, r) => acc + (r.duration || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('💥 PDF generation API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Helper function to generate a single PDF
async function generateSinglePDF(pdfConfig: any): Promise<{
  duration: number;
  outputPath: string;
  fileSize: string;
}> {
  const start = Date.now();
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'public', 'assets', 'downloads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `${pdfConfig.id}.pdf`);
  const relativePath = `/assets/downloads/${pdfConfig.id}.pdf`;
  
  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  // Background watermark
  page.drawText('Abraham of London', {
    x: width / 2 - 100,
    y: height / 2,
    size: 48,
    font: timesRomanFont,
    color: rgb(0.95, 0.95, 0.95),
    opacity: 0.1,
    rotate: { type: 'degrees', angle: 45 }
  });
  
  // Title
  page.drawText(pdfConfig.title, {
    x: 50,
    y: height - 100,
    size: 28,
    font: timesRomanBold,
    color: rgb(0, 0, 0),
  });
  
  // Description
  page.drawText(pdfConfig.description, {
    x: 50,
    y: height - 140,
    size: 14,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
    maxWidth: width - 100,
  });
  
  // Content type-specific
  page.drawText('Type: ' + pdfConfig.type, {
    x: 50,
    y: height - 180,
    size: 12,
    font: timesRomanFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Generate date
  page.drawText(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, {
    x: 50,
    y: height - 210,
    size: 11,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Add surrender-specific content if applicable
  if (pdfConfig.id.includes('surrender')) {
    await addSurrenderContent(page, pdfDoc, pdfConfig);
  }
  
  // Footer
  page.drawLine({
    start: { x: 50, y: 80 },
    end: { x: width - 50, y: 80 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  page.drawText('© Abraham of London • Surrender Framework', {
    x: 50,
    y: 60,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText('www.abrahamoflondon.com', {
    x: width - 180,
    y: 60,
    size: 10,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  
  const duration = Date.now() - start;
  const fileSize = formatFileSize(pdfBytes.length);
  
  return {
    duration,
    outputPath: relativePath,
    fileSize
  };
}

// Add surrender-specific content
async function addSurrenderContent(page: any, pdfDoc: PDFDocument, pdfConfig: any): Promise<void> {
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = height - 250;
  
  // Add framework summary
  page.drawText('SURRENDER FRAMEWORK', {
    x: 50, y, size: 16, font: boldFont, color: rgb(0.8, 0.6, 0.1)
  });
  y -= 25;
  
  page.drawText('Surrender, not submission. Agency, not obligation.', {
    x: 70, y, size: 12, font: font, color: rgb(0.3, 0.3, 0.3)
  });
  y -= 30;
  
  // Add specific content based on PDF type
  switch(pdfConfig.id) {
    case 'surrender-framework-worksheet':
      page.drawText('4D Framework:', { x: 70, y, size: 14, font: boldFont });
      y -= 20;
      ['1. DISCERN - Rule or Principle?', '2. DETACH - Release outcomes', 
       '3. DECIDE - Conscious choice', '4. DEMONSTRATE - Live the choice'].forEach(text => {
        page.drawText(text, { x: 90, y, size: 12, font: font });
        y -= 20;
      });
      break;
      
    case 'weekly-surrender-audit':
      page.drawText('Daily Practice:', { x: 70, y, size: 14, font: boldFont });
      y -= 20;
      ['Monday: Principle Alignment', 'Tuesday: Submission Detection', 
       'Wednesday: Control Release', 'Thursday: Vertical Alignment',
       'Friday: Evidence Collection', 'Weekend: Integration'].forEach(text => {
        page.drawText(text, { x: 90, y, size: 12, font: font });
        y -= 20;
      });
      break;
      
    case 'surrender-diagnostic':
      page.drawText('Assessment Areas:', { x: 70, y, size: 14, font: boldFont });
      y -= 20;
      ['1. Agency & Choice', '2. Internal vs External', '3. Control & Release',
       '4. Love Orientation', '5. Principle Alignment'].forEach(text => {
        page.drawText(text, { x: 90, y, size: 12, font: font });
        y -= 20;
      });
      break;
  }
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// Type safety for response
interface PDFGenerationResult {
  id: string;
  title: string;
  success: boolean;
  duration?: number;
  outputPath?: string;
  fileSize?: string;
  error?: string;
}

interface APIResponse {
  message: string;
  generated: PDFGenerationResult[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    timestamp: string;
    duration: number;
  };
}