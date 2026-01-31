import { safeTrimSlice } from "@/lib/utils/safe";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSecurity } from "@/lib/apiGuard";
import { rateLimit, getClientIp, createRateLimitHeaders } from "@/lib/server/rateLimit";

// (Internal helper functions abs, escapeHtml, ownerNoticeHtml, etc. remain as defined in previous blocks)

async function contactHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method Not Allowed" });

  const ip = getClientIp(req);
  const rl = rateLimit({ key: `contact:${ip}`, limit: 10, windowMs: 60_000 });
  Object.entries(createRateLimitHeaders(rl)).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.ok) return res.status(429).json({ ok: false, message: "Too many requests.", error: "RATE_LIMITED" });

  try {
    const body = req.body || {};
    const name = safeTrimSlice(String(body.name || ""), 0, 100);
    const email = String(body.email || "").trim().toLowerCase();
    const message = safeTrimSlice(String(body.message || ""), 0, 5000);

    if (body.botField) return res.status(200).json({ ok: true, message: "Protocol initiated." });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && (process.env.CONTACT_PROVIDER || "").toLowerCase() === "resend") {
      // Logic for ownerNotice and teaserAutoReply remains as provided in previous verified code
      // ... (calling sendViaResend here)
    }

    return res.status(200).json({ ok: true, message: "Engagement request submitted." });
  } catch (e) {
    console.error("[contact] error:", e);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

export default withSecurity(contactHandler, {
  requireRecaptcha: true,
  expectedAction: "contact_form",
  requireHoneypot: false,
});