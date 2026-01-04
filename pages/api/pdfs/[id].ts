// pages/api/pdfs/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid PDF ID' });
  }

  try {
    const { getPDFById } = await import('@/scripts');
    const pdf = getPDFById(id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    return res.status(200).json({ success: true, pdf });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch PDF' 
    });
  }
}