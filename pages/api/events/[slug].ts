// pages/api/events/[slug].ts - CORRECT API ROUTE (no JSX)
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerEventBySlug } from '@/lib/content/server';
import { requiredTierFromDoc } from '@/lib/access/tiers';
import { normalizeSlug } from '@/lib/content/shared';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const slug = normalizeSlug(String(req.query.slug || ''));
    const event = getServerEventBySlug(slug);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Return only the body code for authenticated requests
    return res.status(200).json({
      ok: true,
      bodyCode: event.body?.code || null,
      requiredTier: requiredTierFromDoc(event)
    });
  } catch (error) {
    console.error('Event API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}