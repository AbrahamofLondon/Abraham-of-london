// pages/api/protected-content.ts - Use working imports
import { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// Fallback inner circle check if needed
function checkInnerCircleAccess(req: NextApiRequest) {
  const cookie = req.cookies?.innerCircleAccess;
  return cookie === 'true';
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!checkInnerCircleAccess(req)) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Inner circle access required'
    });
  }

  // Protected content
  res.status(200).json({
    success: true,
    data: {
      protectedContent: 'This is exclusive inner circle content'
    }
  });
};

// Apply rate limiting
export default withRateLimit(RATE_LIMIT_CONFIGS.API_WRITE)(handler);