import { NextApiRequest, NextApiResponse } from 'next';
import { withInnerCircleAccess } from '@/lib/server/inner-circle-access';

// Premium content data (would normally come from database)
const PREMIUM_CONTENT = {
  exclusiveReports: [
    {
      id: 'report-001',
      title: 'Global Market Intelligence Report Q4 2024',
      description: 'Exclusive analysis of global market movements and predictions',
      content: 'Detailed report content...',
      category: 'market-intelligence',
      accessLevel: 'premium',
      confidentialLevel: 'high',
      fileSize: '15.2 MB',
      pages: 42,
      publishedDate: '2024-01-15',
      expiresAt: '2024-06-15',
      tags: ['global', 'intelligence', 'quarterly', 'exclusive']
    },
    {
      id: 'report-002',
      title: 'Industry Disruption Analysis: Tech Sector',
      description: 'In-depth analysis of upcoming disruptions in technology',
      content: 'Detailed report content...',
      category: 'industry-analysis',
      accessLevel: 'premium',
      confidentialLevel: 'medium',
      fileSize: '8.7 MB',
      pages: 28,
      publishedDate: '2024-01-10',
      tags: ['tech', 'disruption', 'analysis', 'forecast']
    }
  ],
  masterclasses: [
    {
      id: 'masterclass-001',
      title: 'Advanced Negotiation Strategies',
      instructor: 'Dr. Sarah Chen',
      duration: '3h 15m',
      modules: 8,
      releaseDate: '2024-01-20',
      accessLevel: 'premium',
      materials: ['workbook', 'templates', 'case-studies']
    }
  ],
  tools: [
    {
      id: 'tool-001',
      name: 'Strategic Decision Matrix Pro',
      description: 'Advanced decision-making framework tool',
      version: '2.1.0',
      lastUpdated: '2024-01-12',
      accessLevel: 'premium'
    }
  ]
};

// Custom rate limit configuration for premium content
const PREMIUM_RATE_LIMIT_CONFIG = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 100, // 100 requests per 5 minutes
  keyPrefix: 'premium_api'
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const access = (req as any).innerCircleAccess;
    const { method } = req;
    const { contentType, id, action } = req.query;

    // Enhanced logging for premium access
    console.log(`[PREMIUM CONTENT API] ${method} request`, {
      ip: access.userData?.ip,
      contentType,
      userAgent: access.userData?.userAgent?.substring(0, 50),
      accessLevel: 'premium',
      timestamp: new Date().toISOString()
    });

    // Check for premium-specific access
    const premiumAccess = await verifyPremiumAccess(req);
    if (!premiumAccess.isValid) {
      return res.status(403).json({
        error: 'Premium Access Required',
        message: 'This content requires premium subscription level',
        code: 'PREMIUM_REQUIRED',
        upgradeUrl: '/inner-circle/upgrade'
      });
    }

    switch (method) {
      case 'GET':
        if (contentType === 'reports') {
          if (id) {
            // Get specific report
            const report = PREMIUM_CONTENT.exclusiveReports.find(r => r.id === id);
            if (!report) {
              return res.status(404).json({
                error: 'Report not found',
                message: `No premium report found with ID: ${id}`
              });
            }

            // Check if report is expired
            if (report.expiresAt && new Date(report.expiresAt) < new Date()) {
              return res.status(410).json({
                error: 'Report expired',
                message: 'This report is no longer available',
                expiredAt: report.expiresAt
              });
            }

            return res.status(200).json({
              success: true,
              contentType: 'report',
              data: {
                ...report,
                // Don't send full content for list view
                content: report.content.substring(0, 500) + '...'
              },
              downloadUrl: `/api/premium/content/download?reportId=${id}&token=${generateDownloadToken(id)}`,
              metadata: {
                accessedBy: access.userData?.ip,
                accessedAt: new Date().toISOString(),
                premiumTier: premiumAccess.tier,
                rateLimit: {
                  remaining: access.rateLimit?.remaining,
                  limit: access.rateLimit?.limit
                }
              }
            });
          } else {
            // List all reports
            const { page = '1', limit = '5', category, sortBy = 'publishedDate' } = req.query;
            
            let filteredReports = PREMIUM_CONTENT.exclusiveReports;
            
            // Filter by category
            if (category) {
              filteredReports = filteredReports.filter(report => 
                report.category === category
              );
            }
            
            // Filter out expired reports
            filteredReports = filteredReports.filter(report => 
              !report.expiresAt || new Date(report.expiresAt) > new Date()
            );
            
            // Sort
            filteredReports.sort((a, b) => {
              if (sortBy === 'publishedDate') {
                return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
              }
              return 0;
            });
            
            // Pagination
            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = pageNum * limitNum;
            const paginatedReports = filteredReports.slice(startIndex, endIndex);
            
            return res.status(200).json({
              success: true,
              contentType: 'reports',
              data: paginatedReports.map(report => ({
                ...report,
                // Hide content in list view
                content: undefined
              })),
              pagination: {
                total: filteredReports.length,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(filteredReports.length / limitNum)
              },
              metadata: {
                totalReports: filteredReports.length,
                availableCategories: [...new Set(filteredReports.map(r => r.category))]
              }
            });
          }
        } else if (contentType === 'masterclasses') {
          return res.status(200).json({
            success: true,
            contentType: 'masterclasses',
            data: PREMIUM_CONTENT.masterclasses
          });
        } else if (contentType === 'tools') {
          return res.status(200).json({
            success: true,
            contentType: 'tools',
            data: PREMIUM_CONTENT.tools
          });
        } else if (contentType === 'dashboard') {
          // Premium user dashboard data
          return res.status(200).json({
            success: true,
            contentType: 'dashboard',
            data: {
              userStats: {
                reportsAccessed: 12,
                masterclassesCompleted: 3,
                toolsUsed: 2,
                memberSince: premiumAccess.joinedDate || '2024-01-01'
              },
              recentActivity: [
                { action: 'report_viewed', reportId: 'report-001', timestamp: '2024-01-15T10:30:00Z' },
                { action: 'masterclass_started', classId: 'masterclass-001', timestamp: '2024-01-14T14:20:00Z' }
              ],
              upcomingContent: [
                { type: 'report', title: 'Q1 2025 Forecast', releaseDate: '2024-03-01' },
                { type: 'masterclass', title: 'AI Strategy Implementation', releaseDate: '2024-02-15' }
              ]
            }
          });
        } else {
          return res.status(400).json({
            error: 'Invalid content type',
            message: `Content type '${contentType}' not recognized for premium content`
          });
        }

      case 'POST':
        if (action === 'download') {
          // Handle download requests
          const { reportId } = req.body;
          
          if (!reportId) {
            return res.status(400).json({
              error: 'Report ID required',
              message: 'Please specify which report to download'
            });
          }
          
          // Generate secure download link
          const downloadToken = generateDownloadToken(reportId);
          const downloadUrl = `/api/premium/content/download/${reportId}?token=${downloadToken}`;
          
          // Track download in analytics
          trackDownload(access.userData?.ip, reportId);
          
          return res.status(200).json({
            success: true,
            message: 'Download ready',
            downloadUrl,
            tokenExpiresIn: '15 minutes',
            metadata: {
              requestedBy: access.userData?.ip,
              requestedAt: new Date().toISOString()
            }
          });
        }
        
        return res.status(400).json({
          error: 'Invalid action',
          message: `Action '${action}' not recognized`
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          error: 'Method Not Allowed',
          message: `Method ${method} not supported for premium content`
        });
    }
  } catch (error) {
    console.error('[PREMIUM CONTENT API] Error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred with premium content',
      requestId: res.getHeader('X-Request-ID'),
      supportContact: 'premium-support@example.com',
      timestamp: new Date().toISOString()
    });
  }
};

// Helper functions
async function verifyPremiumAccess(req: NextApiRequest): Promise<{
  isValid: boolean;
  tier?: string;
  joinedDate?: string;
}> {
  // In production, verify premium status from database or token
  // This is a simplified example
  const premiumCookie = req.cookies?.premiumAccess;
  
  if (premiumCookie === 'true') {
    return {
      isValid: true,
      tier: 'premium_plus',
      joinedDate: '2024-01-01'
    };
  }
  
  // Fallback: check if user has inner circle access
  const innerCircleAccess = req.cookies?.innerCircleAccess;
  if (innerCircleAccess === 'true') {
    return {
      isValid: true,
      tier: 'basic_premium',
      joinedDate: new Date().toISOString().split('T')[0]
    };
  }
  
  return { isValid: false };
}

function generateDownloadToken(reportId: string): string {
  // In production, use JWT or similar
  const timestamp = Date.now();
  const data = `${reportId}:${timestamp}:${process.env.DOWNLOAD_SECRET || 'secret'}`;
  return Buffer.from(data).toString('base64').replace(/=/g, '');
}

function trackDownload(ip: string, reportId: string): void {
  // In production, log to analytics service
  console.log(`[PREMIUM DOWNLOAD] ${ip} downloaded ${reportId} at ${new Date().toISOString()}`);
}

// Export with premium rate limiting
export default withInnerCircleAccess(handler, {
  requireAuth: true,
  rateLimitConfig: PREMIUM_RATE_LIMIT_CONFIG
});