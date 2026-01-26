import { NextApiRequest, NextApiResponse } from 'next';
import { createStrictApiHandler } from '@/lib/server/inner-circle-access';
import { safeSlice } from "@/lib/utils/safe";


// Example strategy data
const STRATEGIES_DATA = [
  {
    id: 'strat-001',
    title: 'Market Dominance Strategy',
    description: 'Advanced market penetration techniques for established businesses',
    content: 'Detailed implementation guide with case studies and metrics...',
    accessLevel: 'inner-circle',
    lastUpdated: '2024-01-15',
    tags: ['growth', 'scaling', 'market-leadership']
  },
  {
    id: 'strat-002',
    title: 'Innovation Pipeline Development',
    description: 'Building sustainable innovation systems',
    content: 'Step-by-step framework for continuous innovation...',
    accessLevel: 'inner-circle',
    lastUpdated: '2024-01-10',
    tags: ['innovation', 'rd', 'future-proofing']
  },
  {
    id: 'strat-003',
    title: 'Competitive Intelligence Framework',
    description: 'Systematic competitor analysis and response strategies',
    content: 'Complete competitive intelligence methodology...',
    accessLevel: 'inner-circle',
    lastUpdated: '2024-01-05',
    tags: ['competitive-analysis', 'intelligence', 'strategy']
  }
];

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const access = (req as any).innerCircleAccess;
    const { method } = req;
    const { id } = req.query;

    console.log(`[STRATEGIES API] ${method} request from ${access.userData?.ip}`, {
      userAgent: access.userData?.userAgent,
      timestamp: new Date().toISOString()
    });

    switch (method) {
      case 'GET':
        if (id) {
          // Get specific strategy
          const strategy = STRATEGIES_DATA.find(s => s.id === id);
          if (!strategy) {
            return res.status(404).json({
              error: 'Strategy not found',
              message: `No strategy found with ID: ${id}`
            });
          }
          
          return res.status(200).json({
            success: true,
            data: strategy,
            metadata: {
              accessedBy: access.userData?.ip,
              accessedAt: new Date().toISOString(),
              rateLimit: access.rateLimit ? {
                remaining: access.rateLimit.remaining,
                limit: access.rateLimit.limit,
                resetsIn: access.rateLimit.resetTime - Date.now()
              } : undefined
            }
          });
        } else {
          // Get all strategies
          const { page = '1', limit = '10', tag } = req.query;
          const pageNum = parseInt(page as string, 10);
          const limitNum = parseInt(limit as string, 10);
          
          let filteredStrategies = STRATEGIES_DATA;
          
          // Filter by tag if provided
          if (tag) {
            filteredStrategies = filteredStrategies.filter(strategy =>
              strategy.tags.includes(tag as string)
            );
          }
          
          // Pagination
          const startIndex = (pageNum - 1) * limitNum;
          const endIndex = pageNum * limitNum;
          const paginatedStrategies = safeSlice(filteredStrategies, startIndex, endIndex);
          
          return res.status(200).json({
            success: true,
            data: paginatedStrategies,
            pagination: {
              total: filteredStrategies.length,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(filteredStrategies.length / limitNum)
            },
            metadata: {
              accessedBy: access.userData?.ip,
              accessedAt: new Date().toISOString()
            }
          });
        }

      case 'POST':
        // Create new strategy (admin only)
        const newStrategy = req.body;
        
        // Validation
        if (!newStrategy.title || !newStrategy.description) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Title and description are required'
          });
        }
        
        const createdStrategy = {
          id: `strat-${Date.now()}`,
          ...newStrategy,
          accessLevel: 'inner-circle',
          lastUpdated: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        
        // In a real app, you would save to database
        // STRATEGIES_DATA.push(createdStrategy);
        
        return res.status(201).json({
          success: true,
          message: 'Strategy created successfully',
          data: createdStrategy,
          metadata: {
            createdBy: access.userData?.ip,
            createdAt: new Date().toISOString()
          }
        });

      case 'PUT':
        // Update strategy
        if (!id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Strategy ID is required for updates'
          });
        }
        
        const updateData = req.body;
        // Find and update logic here
        
        return res.status(200).json({
          success: true,
          message: 'Strategy updated successfully',
          data: { id, ...updateData }
        });

      case 'DELETE':
        // Delete strategy
        if (!id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Strategy ID is required for deletion'
          });
        }
        
        // Delete logic here
        
        return res.status(200).json({
          success: true,
          message: `Strategy ${id} deleted successfully`
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          error: 'Method Not Allowed',
          message: `Method ${method} not supported`
        });
    }
  } catch (error) {
    console.error('[STRATEGIES API] Error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      requestId: res.getHeader('X-Request-ID'),
      timestamp: new Date().toISOString()
    });
  }
};

export default createStrictApiHandler(handler);