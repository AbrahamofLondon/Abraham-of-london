// 1. Database Migration for Predictive Insights
// prisma/migrations/20240325_add_predictive_insights/migration.sql
CREATE TABLE IF NOT EXISTS predictive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES alignment_campaigns(id) ON DELETE CASCADE,
    insight_data JSONB NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    validation_metrics JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictive_insights_campaign ON predictive_insights(campaign_id, generated_at DESC);
CREATE INDEX idx_predictive_insights_expires ON predictive_insights(expires_at);

// 2. Simple Rate Limiting
// lib/predictive/rate-limit.ts
export class PredictiveRateLimiter {
  private static instance: PredictiveRateLimiter | null = null;
  private store = new Map<string, { count: number; resetAt: number }>();
  private readonly LIMIT = 50; // requests per hour
  private readonly WINDOW_MS = 60 * 60 * 1000;

  static getInstance(): PredictiveRateLimiter {
    if (!PredictiveRateLimiter.instance) {
      PredictiveRateLimiter.instance = new PredictiveRateLimiter();
    }
    return PredictiveRateLimiter.instance;
  }

  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.store.get(identifier);
    
    if (!record || now >= record.resetAt) {
      this.store.set(identifier, { count: 1, resetAt: now + this.WINDOW_MS });
      return { allowed: true };
    }
    
    if (record.count >= this.LIMIT) {
      return { allowed: false, retryAfter: record.resetAt - now };
    }
    
    record.count++;
    return { allowed: true };
  }
}

// 3. Simple Redis Cache (optional, can start without)
// lib/predictive/cache.ts
export class PredictiveCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

// 4. Add to API route
// app/api/predictive/insights/[campaignId]/route.ts (add at top)
import { PredictiveRateLimiter } from '@/lib/predictive/rate-limit';
import { PredictiveCache } from '@/lib/predictive/cache';

const rateLimiter = PredictiveRateLimiter.getInstance();
const cache = PredictiveCache.getInstance();

// Inside GET handler:
const clientId = request.headers.get('x-forwarded-for') || 'unknown';
const rateLimit = rateLimiter.check(clientId);
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfter / 1000)) } }
  );
}

const cacheKey = `${campaignId}:${query.horizon}:${query.confidence}`;
const cached = cache.get(cacheKey);
if (cached) {
  return NextResponse.json(cached);
}

// After generating insight:
cache.set(cacheKey, insight, 300);