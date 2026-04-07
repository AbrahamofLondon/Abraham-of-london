// pages/api/analytics/event.ts (for Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string | null;
  userTraits?: Record<string, any>;
  timestamp?: string;
  url?: string;
  referrer?: string;
  userAgent?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event: AnalyticsEvent = req.body;

  // Log analytics in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event Received:', {
      name: event.name,
      timestamp: event.timestamp,
      properties: event.properties,
    });
  }

  // In production, you could send to a real analytics service
  // Example: send to Google Analytics, Mixpanel, etc.
  
  // For now, just acknowledge receipt
  return res.status(200).json({ 
    success: true, 
    message: 'Event received',
    timestamp: new Date().toISOString()
  });
}