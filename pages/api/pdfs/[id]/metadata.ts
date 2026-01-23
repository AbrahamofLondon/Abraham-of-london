// pages/api/pdfs/[id]/metadata.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid PDF ID' });
  }

  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'Invalid metadata' });
    }

    // Simulate metadata update - replace with actual update logic
    return res.status(200).json({
      success: true,
      message: `Metadata updated for PDF ${id}`,
      metadata,
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update metadata' 
    });
  }
}