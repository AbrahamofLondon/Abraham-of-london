// pages/api/pdfs/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Dynamic import to keep Node.js code server-side only
    const { getAllPDFs } = await import('@/scripts');
    const pdfs = getAllPDFs();
    
    return res.status(200).json({ success: true, pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch PDFs' 
    });
  }
}