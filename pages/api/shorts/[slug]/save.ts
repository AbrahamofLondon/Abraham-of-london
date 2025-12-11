// pages/api/shorts/[slug]/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { toggleInteraction } from '@/lib/db/interactions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  
  try {
    await limiter.check(res, 10, 'CACHE_TOKEN');
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || session?.user?.email;

  try {
    if (req.method === 'POST' || req.method === 'DELETE') {
      const action = 'save';
      const stats = await toggleInteraction(slug, action, userId);
      
      return res.status(200).json({
        ...stats,
        message: req.method === 'POST' ? 'Short saved successfully' : 'Save removed successfully'
      });
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ 
      error: `Method ${req.method} Not Allowed` 
    });
    
  } catch (error) {
    console.error('Error toggling save:', error);
    
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return res.status(409).json({ 
        error: 'Duplicate interaction detected',
        message: 'You have already performed this action'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process save action',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}