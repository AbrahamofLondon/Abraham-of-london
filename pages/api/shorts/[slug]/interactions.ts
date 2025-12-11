// pages/api/shorts/[slug]/interactions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInteractionStats } from '@/lib/db/interactions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      error: `Method ${req.method} Not Allowed` 
    });
  }

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    // Get user session if exists
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id || session?.user?.email;
    
    const stats = await getInteractionStats(slug, userId);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interaction data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}