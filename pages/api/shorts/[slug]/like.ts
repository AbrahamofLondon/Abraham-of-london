// pages/api/shorts/[slug]/like.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { toggleInteraction, getInteractionStats } from '@/lib/db/interactions';

// Define response types
interface SuccessResponse {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST and DELETE methods
  if (!['POST', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: 'Use POST to like or DELETE to unlike'
    });
  }

  const { slug } = req.query;

  // Validate slug
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Short slug is required and must be a valid string'
    });
  }

  // Sanitize slug
  const sanitizedSlug = slug.trim().toLowerCase();

  // Apply rate limiting
  try {
    const rateLimitResult = await checkRateLimit(
      req,
      res,
      RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS
    );

    if (!rateLimitResult.allowed) {
      // Add rate limit headers if available
      if (rateLimitResult.headers) {
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many like requests. Please try again later.'
      });
    }
  } catch (rateLimitError) {
    console.error('Rate limit check failed:', rateLimitError);
    // Continue without rate limiting if it fails
  }

  // Get user session
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (authError) {
    console.error('Auth session error:', authError);
    // Continue with anonymous user if auth fails
  }

  // Get user identifier
  const userId = session?.user?.id || session?.user?.email || null;
  
  // For anonymous users, use IP as identifier (anonymized)
  let anonymousId = null;
  if (!userId) {
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.socket?.remoteAddress;
    
    if (ip && typeof ip === 'string') {
      // Create a simple hash of the IP for anonymous tracking
      anonymousId = `anon_${Buffer.from(ip).toString('base64').slice(0, 16)}`;
    }
  }

  const userIdentifier = userId || anonymousId;

  try {
    // Toggle the like interaction
    const action = 'like';
    const stats = await toggleInteraction(sanitizedSlug, action, userIdentifier);

    // Log the action (optional, for analytics)
    if (process.env.NODE_ENV === 'production') {
      console.log(`Like action: ${req.method} for slug "${sanitizedSlug}" by user ${userIdentifier || 'anonymous'}`);
    }

    const message = req.method === 'POST' 
      ? 'Short liked successfully' 
      : 'Like removed successfully';

    // Add rate limit headers to successful response
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    };

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({
      ...stats,
      message,
    });

  } catch (error) {
    console.error('Error in like API handler:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Database constraint violation (duplicate like)
      if (error.message.includes('unique constraint') || 
          error.message.includes('duplicate key')) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'You have already performed this action on this short.'
        });
      }

      // Database connection error
      if (error.message.includes('connect') || 
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({
          error: 'Service unavailable',
          message: 'Database connection failed. Please try again later.'
        });
      }
    }

    // Default error response
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process like action. Please try again.',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    });
  }
}

// Helper function to validate request body (if needed for future extensions)
function validateRequestBody(body: any): { valid: boolean; error?: string } {
  // Currently no body validation needed for like/unlike
  // This function can be extended if additional parameters are added
  
  // Example: If we add a "intensity" parameter in the future
  // if (body.intensity && typeof body.intensity !== 'number') {
  //   return { valid: false, error: 'Intensity must be a number' };
  // }
  
  return { valid: true };
}

// Export config for Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1kb', // Very small limit for like/unlike requests
    },
    // Disable Next.js default response size limit
    responseLimit: false,
    // Configure external resolver for better error handling
    externalResolver: true,
  },
};