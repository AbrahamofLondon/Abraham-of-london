/* pages/api/endpoint.ts - Use canonical rate-limit module (Pages Router) */
import type { NextApiRequest, NextApiResponse } from "next";
import { withApiRateLimit } from "@/lib/server/rate-limit-unified";

/**
 * FIXED: Pass an options object with the 'key' identifier.
 * withApiRateLimit will look up RATE_LIMIT_CONFIGS[key] internally.
 */
export default withApiRateLimit(
  async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
      success: true,
      message: "API endpoint working with rate limiting",
      timestamp: new Date().toISOString(),
    });
  },
  { 
    key: "API_STRICT" // ✅ Correct: Matches RateLimitKey type
  }
);