// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Support JSON or URL-encoded bodies
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || "").trim();
    const honeypot = String(body.hp || body["bot-field"] || "");

    // Silently succeed if the honeypot is filled (bot)
    if (honeypot) return res.status(200).json({ message: "OK" });

    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email" });

    const provider = (process.env.EMAIL_PROVIDER || "buttondown").toLowerCase();

    if (provider === "buttondown") {
      const apiKey = process.env.BUTTONDOWN_API_KEY;
      if (!apiKey) {
        console.warn("Missing BUTTONDOWN_API_KEY");
        return res.status(500).json({ error: "Email provider not configured" });
      }

      const resp = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          // tags: ["website"],          // optional tag
          // metadata: { source: "site"} // optional metadata
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data?.detail || data?.message || "Subscription failed";
        return res.status(resp.status).json({ error: msg });
      }
      return res.status(200).json({ message: "Subscribed successfully" });
    }

    // Fallback (no provider wired): just log
    console.log("Subscribed (mock):", email);
    return res.status(200).json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter API error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
