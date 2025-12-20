// pages/api/example/protected-route.ts
// Template for a secure API route with rate limiting and security checks

import type { NextApiRequest, NextApiResponse } from 'next';
import { checkRateLimit, RATE_LIMIT_CONFIGS, markRequestSuccess } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-monitor';
import { validateApiInput } from '@/lib/input-validator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Security check
  const security = securityMiddleware(req, '/api/example/protected-route');
  if (!security.safe) {
    return res.status(400).json({ 
      error: 'Invalid request',
      details: security.issues,
    });
  }

  // 2. Rate limiting
  const rateLimit = await checkRateLimit(req, res, RATE_LIMIT_CONFIGS.API_WRITE);
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: res.getHeader('Retry-After'),
    });
  }

  // 3. Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 4. Input validation
  const validation = validateApiInput(req.body, {
    email: { type: 'email', required: true },
    name: { type: 'string', required: true, maxLength: 100 },
    message: { type: 'string', required: true, maxLength: 1000 },
  });

  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  // 5. Your business logic here
  try {
    const { email, name, message } = validation.sanitized;
    
    // Do something with the validated data
    console.log('Processing request:', { email, name, message });

    // Mark as successful (won't count against rate limit if skipSuccessfulRequests is true)
    markRequestSuccess(rateLimit.result?.key || '');

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Request processed successfully',
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
    });
  }
}

// Export config for API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size
    },
  },
};