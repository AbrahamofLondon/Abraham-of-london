// pages/api/inner-circle/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendInnerCircleEmail } from "@/lib/email/sendInnerCircleEmail";
import { recordInnerCircleJoin } from "@/lib/innerCircleMembership";
import {
  checkRateLimit,
  getClientKeyFromReq,
} from "@/lib/security";

type Success = {
  ok: true;
  accessKey: string;
  unlockUrl: string;
};

type Failure = {
  ok: false;
  error: string;
};

type Data = Success | Failure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Basic IP-based rate limit: 5 joins per 10 minutes per client
  const clientKey = getClientKeyFromReq(req);
  const allowed = checkRateLimit(clientKey + ":inner-circle-register", {
    windowMs: 10 * 60 * 1000,
    maxHits: 5,
  });

  if (!allowed) {
    return res.status(429).json({
      ok: false,
      error:
        "Too many attempts from this device. Please try again in a few minutes.",
    });
  }

  const { email, name, returnTo } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email" });
  }

  const accessKey = process.env.INNER_CIRCLE_ACCESS_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!accessKey || !siteUrl) {
    return res.status(500).json({
      ok: false,
      error: "Inner Circle is not configured on the server",
    });
  }

  const safeReturnTo =
    typeof returnTo === "string" && returnTo.startsWith("/")
      ? returnTo
      : "/canon";

  const unlockUrl = `${siteUrl}/api/inner-circle/unlock?key=${encodeURIComponent(
    accessKey,
  )}&returnTo=${encodeURIComponent(safeReturnTo)}`;

  try {
    await sendInnerCircleEmail({
      email,
      name: typeof name === "string" ? name : "",
      accessKey,
      unlockUrl,
    });

    void recordInnerCircleJoin({
      email,
      name: typeof name === "string" ? name : undefined,
    });

    return res.status(200).json({
      ok: true,
      accessKey,
      unlockUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to send Inner Circle email";
    return res.status(500).json({ ok: false, error: message });
  }
}