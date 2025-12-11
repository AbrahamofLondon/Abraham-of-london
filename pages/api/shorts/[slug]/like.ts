// pages/api/shorts/[slug]/like.ts
import type { NextApiRequest, NextApiResponse } from 'next';

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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (!['POST', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: 'Use POST to like or DELETE to unlike'
    });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Short slug is required'
    });
  }

  try {
    // For now, simulate a successful response
    // In production, you would update your database
    
    const isLikeAction = req.method === 'POST';
    
    // Generate response based on action
    const response: SuccessResponse = {
      likes: isLikeAction ? 26 : 25, // Increment/decrement
      saves: 12, // Unchanged
      userLiked: isLikeAction,
      userSaved: false,
      message: isLikeAction ? 'Short liked successfully' : 'Like removed successfully'
    };

    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in like API:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process like action'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1kb',
    },
  },
};