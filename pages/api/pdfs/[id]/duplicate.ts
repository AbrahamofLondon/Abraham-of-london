// pages/api/pdfs/[id]/duplicate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid PDF ID' });
  }

  try {
    // Simulate duplication - replace with actual duplication logic
    const duplicateId = `${id}-copy-${Date.now()}`;
    
    return res.status(200).json({
      success: true,
      pdf: {
        id: duplicateId,
        title: `Copy of ${id}`,
        description: `Duplicated from ${id}`,
        category: 'uncategorized',
        type: 'pdf',
        exists: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error duplicating PDF:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate PDF' 
    });
  }
}