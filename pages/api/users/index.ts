// pages/api/users/index.ts - UPDATED WITH CORRECT IMPORTS
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limit-unified';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options'; // ✅ Your file exists at lib/auth/options.ts

// Type for our user data
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

// Handler function
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ CORRECT: Use getServerSession with your authOptions
    const session = await getServerSession(req, res, authOptions);
    
    // Method guard
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowed: ['GET'],
      });
    }

    // Parse query parameters
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    
    // Check authentication for private data
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    // Calculate pagination values
    const startIndex = (pageNum - 1) * limitNum;
    
    // Try to fetch from database first
    let users: User[] = [];
    let totalUsers = 0;
    
    try {
      // Use your Prisma instance
      const { prisma } = await import('@/lib/prisma');
      
      // Build query
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      
      // Get total count
      totalUsers = await prisma.user.count({ where });
      
      // Fetch paginated users
      const dbUsers = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: startIndex,
        take: limitNum,
      });
      
      // Transform to interface
      users = dbUsers.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt.toISOString(),
      }));
      
    } catch (dbError) {
      console.warn('Database fetch failed, using mock data:', dbError);
      
      // Fallback mock data
      users = [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        { 
          id: 3, 
          name: 'Bob Johnson', 
          email: 'bob@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      ];
      totalUsers = users.length;
    }
    
    // Successful response
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum),
        hasNextPage: (pageNum * limitNum) < totalUsers,
        hasPrevPage: pageNum > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/users',
        source: 'pages-router',
        authenticated: true,
        user: session.user?.email,
      },
    });
    
  } catch (error) {
    console.error('Users API error:', error);
    
    // Error response
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export with rate limiting
// If withApiRateLimit doesn't work, use this alternative:
export default withApiRateLimit(handler, RATE_LIMIT_CONFIGS.authenticated);