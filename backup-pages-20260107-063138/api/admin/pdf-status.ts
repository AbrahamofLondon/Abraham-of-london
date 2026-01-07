import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

interface PDFInfo {
  name: string;
  path: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
  type?: string;
}

interface PDFStatusResponse {
  success: boolean;
  data?: {
    pdfs: PDFInfo[];
    stats: {
      total: number;
      existing: number;
      missing: number;
      totalSize: number;
    };
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PDFStatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const pdfDir = path.join(publicDir, 'pdfs');

    // Check if directory exists
    try {
      await fs.access(pdfDir);
    } catch {
      // Create directory if it doesn't exist
      await fs.mkdir(pdfDir, { recursive: true });
    }

    // Read all files in the PDF directory
    const files = await fs.readdir(pdfDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    // Get detailed info for each PDF
    const pdfs: PDFInfo[] = await Promise.all(
      pdfFiles.map(async (file) => {
        const filePath = path.join(pdfDir, file);
        try {
          const stat = await fs.stat(filePath);
          return {
            name: file,
            path: `/pdfs/${file}`,
            exists: true,
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
            type: 'application/pdf',
          };
        } catch (error) {
          return {
            name: file,
            path: `/pdfs/${file}`,
            exists: false,
          };
        }
      })
    );

    // Calculate statistics
    const stats = {
      total: pdfs.length,
      existing: pdfs.filter(p => p.exists).length,
      missing: pdfs.filter(p => !p.exists).length,
      totalSize: pdfs.reduce((sum, p) => sum + (p.size || 0), 0),
    };

    return res.status(200).json({
      success: true,
      data: { pdfs, stats },
    });
  } catch (error) {
    console.error('Error in PDF status API:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
