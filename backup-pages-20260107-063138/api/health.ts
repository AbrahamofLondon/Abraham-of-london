// pages/api/health.ts - Fixed version
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple health check that doesn't depend on contentlayer
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json(health);
}

