import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  rateLimit, 
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS 
} from '@/lib/rate-limit';
import { getAllUnifiedContent } from '@/lib/server/unified-content';

type ContentResponse = {
  ok: boolean;
  data?: any[];
  timestamp?: string;
  count?: number;
  error?: string;
};

function logContentApi(action: string, meta: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[ContentAPI] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContentResponse>
) {
  // Rate limiting
  const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0] || 
                   req.socket?.remoteAddress || "unknown";
  
  // Use CONTENT_API config from rate-limit.ts
  const rl = rateLimit(
    `content-api:${clientIp}`,
    RATE_LIMIT_CONFIGS.CONTENT_API
  );
  
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    logContentApi("rate_limited", { ip: clientIp });
    res.status(429).json({ 
      ok: false, 
      error: "Too many requests. Please try again later." 
    });
    return;
  }

  try {
    logContentApi("fetching", { 
      ip: clientIp,
      userAgent: req.headers["user-agent"]?.substring(0, 100)
    });
    
    const content = await getAllUnifiedContent();
    
    // Cache headers for CDN
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'application/json');
    
    logContentApi("success", { 
      ip: clientIp,
      count: content.length,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      ok: true,
      data: content,
      timestamp: new Date().toISOString(),
      count: content.length
    });
  } catch (error) {
    logContentApi("error", { 
      ip: clientIp,
      error: error instanceof Error ? error.message : 'unknown'
    });
    
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch content. Please try again later.' 
    });
  }
}

// Configure API to avoid body parsing for GET requests
export const config = {
  api: {
    responseLimit: false,
  },
};