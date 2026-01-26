# Redis Setup Guide for Edge Runtime Compatibility

## Overview

The rate-limit system now supports **multiple storage backends** with automatic fallback:

1. **Memory Store** (default, always available, zero config)
2. **Upstash Redis** (Edge Runtime compatible, recommended)
3. **Vercel KV** (Edge Runtime compatible, best for Vercel)
4. **ioredis** (Node.js only, falls back gracefully)

---

## Quick Start Options

### Option 1: Use Memory Store Only (No Setup Required) ✅

If you don't set any Redis environment variables, the system automatically uses an in-memory store.

**Pros:**
- ✅ No setup required
- ✅ Works everywhere (Windows, Linux, Edge Runtime)
- ✅ Zero cost
- ✅ Perfect for development

**Cons:**
- ⚠️ Data lost on restart
- ⚠️ Doesn't sync across multiple instances
- ⚠️ Limited to single-server deployments

**When to use:** Development, testing, or low-traffic single-server deployments.

---

### Option 2: Upstash Redis (Recommended for Production) ⭐

Upstash Redis works in both Node.js and Edge Runtime.

#### Setup Steps:

**1. Create Upstash Account**
- Go to https://upstash.com
- Create a free account (no credit card required)
- Click "Create Database"

**2. Get Credentials**
- In your database dashboard, find the **REST API** section
- Copy the **UPSTASH_REDIS_REST_URL**
- Copy the **UPSTASH_REDIS_REST_TOKEN**

**3. Add to Environment Variables**

Create/update `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

For production, add to `.env.production`:
```bash
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**4. Install Package**
```bash
pnpm add @upstash/redis
```

**Free Tier Limits:**
- 10,000 commands per day
- 256 MB storage
- Perfect for most applications!

---

### Option 3: Vercel KV (Best for Vercel Deployments) 🚀

If you're deploying to Vercel, use Vercel KV (powered by Upstash).

#### Setup Steps:

**1. Enable in Vercel Dashboard**
- Go to your project in Vercel
- Navigate to **Storage** → **KV** → **Create Database**
- Choose your region
- Click "Create"

**2. Environment Variables (Auto-configured)**

Vercel automatically adds these to your project:
```bash
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

**3. Install Package**
```bash
pnpm add @vercel/kv
```

**4. Deploy**
```bash
vercel --prod
```

**Free Tier Limits:**
- 30,000 commands per day
- 256 MB storage
- Automatic scaling

---

### Option 4: Traditional ioredis (Node.js Only, Legacy)

For traditional Redis servers (only works in Node.js runtime, NOT Edge).

**Setup:**

Your existing Redis configuration in `lib/redis.ts` continues to work in Node.js routes.

**Note:** This won't work in Edge Runtime routes, but the system will automatically fall back to Upstash/Vercel KV or memory store.

---

## Storage Priority

The system tries storage backends in this order:

### In Edge Runtime:
```
1. Vercel KV (if KV_REST_API_URL exists)
   ↓ (if unavailable)
2. Upstash Redis (if UPSTASH_REDIS_REST_URL exists)
   ↓ (if unavailable)
3. Memory Store (always works)
```

### In Node.js Runtime:
```
1. Vercel KV (if KV_REST_API_URL exists)
   ↓ (if unavailable)
2. Upstash Redis (if UPSTASH_REDIS_REST_URL exists)
   ↓ (if unavailable)
3. ioredis (if configured in lib/redis.ts)
   ↓ (if unavailable)
4. Memory Store (always works)
```

---

## Testing Your Setup

### Test Endpoint

Create `pages/api/test-redis.ts`:

```typescript
import { getRedisStats, safePing } from '@/lib/redis-safe';

export default async function handler(req: any, res: any) {
  const stats = await getRedisStats();
  const ping = await safePing();
  
  res.json({
    stats,
    ping,
    message: stats.available 
      ? '✅ Redis is working!' 
      : '⚠️ Using memory store (no Redis configured)'
  });
}
```

Visit: http://localhost:3000/api/test-redis

**Expected Response:**
```json
{
  "stats": {
    "available": true,
    "type": "upstash",
    "runtime": "node",
    "connectionStatus": "connected"
  },
  "ping": true,
  "message": "✅ Redis is working!"
}
```

---

## Environment Variables Reference

```bash
# ===== UPSTASH REDIS (Edge Compatible) =====
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxx...

# ===== VERCEL KV (Auto-configured by Vercel) =====
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# ===== TRADITIONAL REDIS (Node.js only) =====
REDIS_URL=redis://localhost:6379
# OR separate values:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# ===== OPTIONAL =====
ADMIN_API_KEY=your-admin-secret
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## Migration Guides

### From ioredis to Upstash

**Before:**
```typescript
// Only works in Node.js
import { redisClient } from '@/lib/redis';
```

**After:**
```typescript
// Works in Edge + Node.js
import { getRedis } from '@/lib/redis-safe';

const redis = await getRedis();
if (redis) {
  await redis.set('key', 'value');
}
```

**Steps:**
1. Create Upstash database
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Install `@upstash/redis`
4. Deploy - automatic detection!

---

### From Memory to Redis

**Steps:**
1. Choose Upstash or Vercel KV
2. Add environment variables
3. Install package
4. Deploy - zero code changes needed!

---

## Troubleshooting

### "Using memory store" in production

**Symptom:** App works but rate limits reset on restart

**Cause:** No Redis environment variables configured

**Fix:** 
1. Add `UPSTASH_REDIS_REST_URL` and token, OR
2. Enable Vercel KV in dashboard

---

### Edge Runtime warnings about ioredis

**Symptom:** Build warnings about `process.nextTick`

**Cause:** Some file imports `@/lib/redis` directly in Edge context

**Fix:** Use `@/lib/redis-safe` in Edge routes:
```typescript
// ❌ BAD (breaks Edge)
import { redisClient } from '@/lib/redis';

// ✅ GOOD (works in Edge)
import { getRedis } from '@/lib/redis-safe';
```

---

### Rate limits not persisting

**Symptom:** Rate limits reset after deployment

**Cause:** Using memory store (no Redis configured)

**Fix:** Configure Upstash or Vercel KV

---

### Connection errors in logs

**Symptom:** "Redis connection failed" errors

**Cause:** Wrong credentials or network issues

**Fix:**
1. Verify `UPSTASH_REDIS_REST_URL` is correct
2. Verify `UPSTASH_REDIS_REST_TOKEN` is correct
3. Check Upstash dashboard for region issues
4. System automatically falls back to memory - app still works!

---

## Cost Comparison

| Solution | Free Tier | Cost After Free | Edge Compatible | Best For |
|----------|-----------|-----------------|-----------------|----------|
| Memory Store | ∞ | $0 | ✅ | Development, single-server |
| Upstash Redis | 10k commands/day | $0.20/100k commands | ✅ | Most production apps |
| Vercel KV | 30k commands/day | $0.20/100k commands | ✅ | Vercel deployments |
| Self-hosted Redis | - | Server costs | ❌ | Legacy/special cases |

---

## Recommendations by Use Case

| Use Case | Recommended Solution |
|----------|---------------------|
| **Local Development** | Memory Store (no setup) |
| **Production (Vercel)** | Vercel KV (best integration) |
| **Production (Netlify)** | Upstash Redis |
| **Production (Cloudflare)** | Upstash Redis |
| **High Traffic (>1M req/day)** | Upstash Pro |
| **Testing/Staging** | Upstash Free Tier |

---

## Package Installation Commands

```bash
# For Upstash Redis (recommended)
pnpm add @upstash/redis

# For Vercel KV (Vercel only)
pnpm add @vercel/kv

# Both are lightweight (<50KB) and Edge-compatible
```

---

## Health Check Usage

```typescript
import { redisHealthCheck } from '@/lib/redis-safe';

const health = await redisHealthCheck();

console.log({
  healthy: health.healthy,        // true/false
  type: health.details.type,      // 'upstash' | 'vercel-kv' | 'none'
  latency: health.latencyMs,      // connection speed
  runtime: health.details.runtime // 'edge' | 'node'
});
```

---

## Example: System Health Endpoint

```typescript
// pages/api/health.ts
import { redisHealthCheck } from '@/lib/redis-safe';
import { getRateLimiterStats } from '@/lib/server/rate-limit-unified';

export default async function handler(req: any, res: any) {
  const [redisHealth, rlStats] = await Promise.all([
    redisHealthCheck(),
    getRateLimiterStats()
  ]);

  res.json({
    ok: redisHealth.healthy,
    redis: redisHealth.details,
    rateLimiter: rlStats,
    timestamp: new Date().toISOString()
  });
}
```

---

## Ready to Go! 🚀

The rate-limit system now works seamlessly across:

- ✅ Windows, macOS, Linux
- ✅ Node.js runtime
- ✅ Edge runtime
- ✅ Vercel, Netlify, Cloudflare, Railway, Render
- ✅ Development and production

**No Redis? No problem!** It falls back to memory store automatically.

**Need Redis?** Just add two environment variables and you're done!