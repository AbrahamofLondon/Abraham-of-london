import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllUnifiedContent } from '@/lib/server/unified-content';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const content = await getAllUnifiedContent();
    res.status(200).json(content);
  } catch (error) {
    console.error('Error in /api/content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
}