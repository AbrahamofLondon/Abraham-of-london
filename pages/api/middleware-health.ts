// pages/api/middleware-health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { securityMonitor } from '@/lib/security/middleware-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic health check
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: securityMonitor.getMetrics(),
  };

  res.status(200).json(health);
}