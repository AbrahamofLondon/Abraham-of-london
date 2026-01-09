// pages/api/frameworks/[slug]/protected.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyInnerCircleToken } from '@/lib/inner-circle/jwt';
import { getFrameworkProtectedContent } from '@/lib/resources/strategic-frameworks';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = await verifyInnerCircleToken(token);
    
    if (!['inner-circle', 'founder'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const protectedContent = await getFrameworkProtectedContent(slug as string);
    
    if (!protectedContent) {
      return res.status(404).json({ error: 'Framework not found' });
    }

    // Log access for audit trail
    console.log(`Inner Circle access: ${decoded.email} accessed ${slug} at ${new Date().toISOString()}`);

    res.status(200).json(protectedContent);
  } catch (error) {
    console.error('Protected content access failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}