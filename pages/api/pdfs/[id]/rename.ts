// pages/api/pdfs/[id]/rename.ts
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
    const { title } = req.body;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Invalid title' });
    }

    // Simulate rename - replace with actual rename logic
    return res.status(200).json({
      success: true,
      message: `PDF ${id} renamed to ${title}`,
    });
  } catch (error) {
    console.error('Error renaming PDF:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to rename PDF' 
    });
  }
}