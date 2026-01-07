// pages/api/endpoint.ts
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limit-unified';

export default withApiRateLimit(
  async (req, res) => {
    // Your API logic
    res.status(200).json({ success: true });
  },
  RATE_LIMIT_CONFIGS.API_STRICT
);