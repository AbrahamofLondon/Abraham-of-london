// pages/api/inner-circle/register.ts
import {
  rateLimitForRequestIp,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";

const { result } = rateLimitForRequestIp(
  req,
  "inner-circle-register",
  RATE_LIMIT_CONFIGS.INNER_CIRCLE_REGISTER,
);

if (!result.allowed) {
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  return res
    .status(429)
    .json({ ok: false, error: "Too many registration attempts. Please try again later." });
}