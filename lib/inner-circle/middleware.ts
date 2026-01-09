// lib/inner-circle/middleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from '@/lib/inner-circle';

export function withInnerCircleApi(
  handler: (req: NextApiRequest, res: NextApiResponse, access: any) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // For API routes, we need to check headers
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      // Validate token (simplified - in production use proper JWT validation)
      const access = getInnerCircleAccess(); // This needs server adaptation
      
      if (!access.hasAccess) {
        return res.status(403).json({ 
          error: 'Inner Circle access required',
          reason: access.reason 
        });
      }

      await handler(req, res, access);
    } catch (error) {
      console.error('Inner Circle API middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}