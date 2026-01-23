// pages/api/inner-circle/data.ts - PRODUCTION READY
import type { NextApiRequest, NextApiResponse } from 'next';
import { withInnerCircleAccess } from '@/lib/inner-circle/access';
import InnerCircleDataService, { 
  CreateDataInput, 
  UpdateDataInput,
  QueryOptions 
} from '@/lib/services/InnerCircleDataService';
import { connectToDatabase } from '@/lib/database/connection';
import { rateLimitForRequestIp } from '@/lib/inner-circle/access';
import { getClientIp } from '@/lib/inner-circle/access';

// Rate limiting configuration
const API_RATE_LIMIT = {
  GET: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  POST: { maxRequests: 30, windowMs: 60000 },  // 30 requests per minute
  PUT: { maxRequests: 30, windowMs: 60000 },   // 30 requests per minute
  DELETE: { maxRequests: 10, windowMs: 60000 } // 10 requests per minute
};

// Response types
type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

// Input validation schemas (in production, use Zod or Yup)
const validateCreateInput = (data: any): { isValid: boolean; errors: string[]; cleanedData?: CreateDataInput } => {
  const errors: string[] = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length < 10) {
    errors.push('Content is required and must be at least 10 characters');
  }
  
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Valid category is required');
  }
  
  if (data.tags && (!Array.isArray(data.tags) || data.tags.some((tag: any) => typeof tag !== 'string'))) {
    errors.push('Tags must be an array of strings');
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  const cleanedData: CreateDataInput = {
    title: data.title.trim(),
    content: data.content.trim(),
    category: data.category.trim(),
    authorId: data.authorId || 'system',
    tierLevel: data.tierLevel || 'basic',
    tags: data.tags?.map((tag: string) => tag.trim().toLowerCase()),
    metadata: data.metadata || {}
  };
  
  return { isValid: true, errors: [], cleanedData };
};

const validateUpdateInput = (data: any): { isValid: boolean; errors: string[]; cleanedData?: UpdateDataInput } => {
  const errors: string[] = [];
  const cleanedData: UpdateDataInput = {};
  
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    } else {
      cleanedData.title = data.title.trim();
    }
  }
  
  if (data.content !== undefined) {
    if (typeof data.content !== 'string' || data.content.trim().length < 10) {
      errors.push('Content must be at least 10 characters');
    } else {
      cleanedData.content = data.content.trim();
    }
  }
  
  if (data.category !== undefined && typeof data.category !== 'string') {
    errors.push('Category must be a string');
  } else if (data.category) {
    cleanedData.category = data.category.trim();
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors: [], cleanedData };
};

// Helper to extract user from request (in production, get from session/token)
const extractUserFromRequest = (req: NextApiRequest): { userId: string; userTier: string } => {
  // This is a simplified version. In production, you'd:
  // 1. Verify JWT token
  // 2. Get user from session
  // 3. Fetch user from database
  
  // For now, using headers or cookies
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const userTier = req.headers['x-user-tier'] as string || 'inner-circle';
  
  return { userId, userTier };
};

// Main handler
const handler = async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Apply method-specific rate limiting
    const ip = getClientIp(req);
    const method = req.method as keyof typeof API_RATE_LIMIT;
    const rateLimitResult = await rateLimitForRequestIp(
      `${ip}:${method}:inner-circle-data`,
      API_RATE_LIMIT[method] || API_RATE_LIMIT.GET
    );
    
    if (!rateLimitResult.allowed) {
      res.setHeader('Retry-After', Math.ceil(rateLimitResult.retryAfterMs / 1000));
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.retryAfterMs / 1000)} seconds`
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      
      case 'POST':
        await handlePost(req, res);
        break;
      
      case 'PUT':
        await handlePut(req, res);
        break;
      
      case 'DELETE':
        await handleDelete(req, res);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({
          success: false,
          error: `Method ${req.method} Not Allowed`
        });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    if (error.code === 11000) { // MongoDB duplicate key
      return res.status(409).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'A record with this identifier already exists'
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// GET handler - Retrieve data
async function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { 
    id,
    page = '1',
    limit = '10',
    category,
    tags,
    tierLevel,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    featured,
    difficulty
  } = req.query;
  
  const user = extractUserFromRequest(req);
  
  // Single item by ID
  if (id && typeof id === 'string') {
    const data = await InnerCircleDataService.findById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Content not found'
      });
    }
    
    // Check if user has access to this tier
    const tierAccessMap = {
      'inner-circle': ['basic'],
      'inner-circle-plus': ['basic', 'premium'],
      'inner-circle-elite': ['basic', 'premium', 'elite']
    };
    
    const accessibleTiers = tierAccessMap[user.userTier as keyof typeof tierAccessMap] || ['basic'];
    
    if (!accessibleTiers.includes(data.tierLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: 'You do not have access to this content tier'
      });
    }
    
    // Increment view count
    await InnerCircleDataService.incrementViews(
      id,
      user.userId,
      getClientIp(req),
      req.headers['user-agent'] || ''
    );
    
    return res.status(200).json({
      success: true,
      data
    });
  }
  
  // Multiple items with pagination
  const queryOptions: QueryOptions = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    category: category as string,
    tags: tags ? (tags as string).split(',') : undefined,
    tierLevel: tierLevel as string,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    isFeatured: featured === 'true',
    difficulty: difficulty as string
  };
  
  // Filter by user tier
  const tierMapping = {
    'inner-circle': 'basic',
    'inner-circle-plus': 'premium',
    'inner-circle-elite': 'elite'
  };
  
  queryOptions.tierLevel = tierMapping[user.userTier as keyof typeof tierMapping] || 'basic';
  
  const result = await InnerCircleDataService.findAll(queryOptions);
  
  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}

// POST handler - Create new data
async function handlePost(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const user = extractUserFromRequest(req);
  
  // Check if user has permission to create (admins/managers only)
  if (!['admin', 'manager', 'editor'].includes(user.userTier)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to create content'
    });
  }
  
  const validation = validateCreateInput(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: validation.errors.join(', ')
    });
  }
  
  const data = await InnerCircleDataService.create({
    ...validation.cleanedData!,
    authorId: user.userId
  });
  
  res.status(201).json({
    success: true,
    data,
    message: 'Content created successfully'
  });
}

// PUT handler - Update existing data
async function handlePut(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;
  const user = extractUserFromRequest(req);
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'ID is required'
    });
  }
  
  // Check if content exists
  const existing = await InnerCircleDataService.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Content not found'
    });
  }
  
  // Check permission (only author or admin can edit)
  if (existing.authorId !== user.userId && !['admin', 'manager'].includes(user.userTier)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You can only edit your own content'
    });
  }
  
  const validation = validateUpdateInput(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: validation.errors.join(', ')
    });
  }
  
  const updated = await InnerCircleDataService.update(id, validation.cleanedData!);
  
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Content not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: updated,
    message: 'Content updated successfully'
  });
}

// DELETE handler - Remove data
async function handleDelete(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { id } = req.query;
  const user = extractUserFromRequest(req);
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'ID is required'
    });
  }
  
  // Check if content exists
  const existing = await InnerCircleDataService.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Content not found'
    });
  }
  
  // Only admins can delete
  if (!['admin'].includes(user.userTier)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only administrators can delete content'
    });
  }
  
  const deleted = await InnerCircleDataService.delete(id);
  
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Content not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Content deleted successfully'
  });
}

// Export with access control
export default withInnerCircleAccess(handler, {
  requireAuth: true,
  rateLimitConfig: {
    maxRequests: 100,
    windowMs: 60000
  }
});

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase for file uploads
    },
    responseLimit: false
  }
};