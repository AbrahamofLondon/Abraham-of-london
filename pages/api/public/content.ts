import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicApiHandler } from '@/lib/server/inner-circle-access';

// Public content data
const PUBLIC_CONTENT = {
  blogPosts: [
    {
      id: 'blog-001',
      title: 'Introduction to Business Strategy',
      excerpt: 'Learn the fundamentals of business strategy in this comprehensive guide.',
      content: 'Full article content here...',
      publishedAt: '2024-01-01',
      readTime: '5 min',
      tags: ['beginners', 'strategy']
    },
    {
      id: 'blog-002',
      title: 'Market Trends 2024',
      excerpt: 'Analysis of emerging market trends for the coming year.',
      content: 'Full article content here...',
      publishedAt: '2024-01-08',
      readTime: '8 min',
      tags: ['trends', 'analysis']
    }
  ],
  resources: [
    {
      id: 'resource-001',
      title: 'Free Strategy Template',
      description: 'Download our free business strategy template',
      url: '/assets/public/templates/strategy-template.pdf',
      type: 'pdf',
      size: '2.4 MB'
    },
    {
      id: 'resource-002',
      title: 'Market Analysis Worksheet',
      description: 'Worksheet for conducting market analysis',
      url: '/assets/public/templates/market-analysis.xlsx',
      type: 'excel',
      size: '1.1 MB'
    }
  ],
  announcements: [
    {
      id: 'announce-001',
      title: 'New Features Released',
      content: 'Check out our latest platform updates',
      date: '2024-01-15',
      priority: 'normal'
    }
  ]
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const access = (req as any).innerCircleAccess;
    const { method } = req;
    const { contentType, id } = req.query;

    // Log access for analytics
    console.log(`[PUBLIC CONTENT API] ${method} request from ${access.userData?.ip}`, {
      contentType,
      userAgent: access.userData?.userAgent?.substring(0, 100) // Truncate long UA strings
    });

    switch (method) {
      case 'GET':
        if (contentType === 'blogs' || !contentType) {
          // Return blog posts
          return res.status(200).json({
            success: true,
            contentType: 'blogs',
            data: PUBLIC_CONTENT.blogPosts,
            metadata: {
              total: PUBLIC_CONTENT.blogPosts.length,
              requestId: res.getHeader('X-Request-ID'),
              rateLimit: access.rateLimit ? {
                remaining: access.rateLimit.remaining,
                limit: access.rateLimit.limit,
                resetsIn: access.rateLimit.resetTime - Date.now()
              } : undefined
            }
          });
        } else if (contentType === 'resources') {
          // Return resources
          return res.status(200).json({
            success: true,
            contentType: 'resources',
            data: PUBLIC_CONTENT.resources,
            metadata: {
              total: PUBLIC_CONTENT.resources.length
            }
          });
        } else if (contentType === 'announcements') {
          // Return announcements
          return res.status(200).json({
            success: true,
            contentType: 'announcements',
            data: PUBLIC_CONTENT.announcements,
            metadata: {
              total: PUBLIC_CONTENT.announcements.length
            }
          });
        } else if (contentType === 'health') {
          // Health check endpoint
          return res.status(200).json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
          });
        } else {
          return res.status(400).json({
            error: 'Invalid content type',
            message: `Content type '${contentType}' not recognized. Valid types: blogs, resources, announcements, health`
          });
        }

      case 'POST':
        // For newsletter signups, feedback, etc.
        const { action, data } = req.body;
        
        if (action === 'newsletter') {
          // Handle newsletter signup
          const { email, name } = data;
          
          if (!email) {
            return res.status(400).json({
              error: 'Validation failed',
              message: 'Email is required'
            });
          }
          
          // In production: Save to database or send to email service
          console.log(`[NEWSLETTER] New signup: ${email} (${name || 'no name'})`);
          
          return res.status(200).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: { email, subscribedAt: new Date().toISOString() }
          });
        }
        
        if (action === 'feedback') {
          // Handle feedback submission
          const { message, rating, category } = data;
          
          if (!message || message.length < 10) {
            return res.status(400).json({
              error: 'Validation failed',
              message: 'Feedback message must be at least 10 characters'
            });
          }
          
          // In production: Save feedback to database
          console.log(`[FEEDBACK] New feedback: ${category} - ${rating}/5`);
          
          return res.status(200).json({
            success: true,
            message: 'Thank you for your feedback!',
            data: {
              receivedAt: new Date().toISOString(),
              category,
              rating
            }
          });
        }
        
        return res.status(400).json({
          error: 'Invalid action',
          message: `Action '${action}' not recognized. Valid actions: newsletter, feedback`
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          error: 'Method Not Allowed',
          message: `Method ${method} not supported`
        });
    }
  } catch (error) {
    console.error('[PUBLIC CONTENT API] Error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      requestId: res.getHeader('X-Request-ID'),
      timestamp: new Date().toISOString()
    });
  }
};

export default createPublicApiHandler(handler);