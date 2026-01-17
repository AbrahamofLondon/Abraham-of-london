/* pages/api/endpoint.ts - Use canonical rate-limit module (Pages Router) */
import type { NextApiRequest, NextApiResponse } from "next";
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";

export default withApiRateLimit(
  async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({
      success: true,
      message: "API endpoint working with rate limiting",
    });
  },
  RATE_LIMIT_CONFIGS.API_STRICT
);