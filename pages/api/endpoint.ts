// pages/api/endpoint.ts - Use the working rate-limit module
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// Use API_WRITE which is equivalent to API_STRICT
export default withRateLimit(RATE_LIMIT_CONFIGS.API_WRITE)(
  async (req, res) => {
    // Your API logic
    res.status(200).json({ 
      success: true,
      message: 'API endpoint working with rate limiting'
    });
  }
);