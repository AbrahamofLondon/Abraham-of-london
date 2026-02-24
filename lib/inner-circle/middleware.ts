// lib/inner-circle/middleware.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import { verifyInnerCircleToken } from "./jwt";

export function withInnerCircleApi(
  handler: (req: NextApiRequest, res: NextApiResponse, access: any) => Promise<void>,
  requiredTier: "basic" | "premium" | "enterprise" | "restricted" = "basic"
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      // Verify the token and extract user info
      const verified = await verifyInnerCircleToken(token);
      
      if (!verified) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check access level
      const access = getInnerCircleAccess({ 
        userTier: verified.role,
        requiresTier: requiredTier
      });
      
      if (!access.ok) {
        return res.status(403).json({ 
          error: 'Inner Circle access required',
          userTier: access.tier,
          requiredTier
        });
      }

      // Pass both access and verified user info to handler
      await handler(req, res, { ...access, user: verified });
    } catch (error) {
      console.error('Inner Circle API middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}