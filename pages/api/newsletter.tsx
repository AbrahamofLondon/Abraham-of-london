// pages/api/newsletter.tsx
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type Json = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const asBool = (v?: string, def = true) => (v == null ? def : /^true$/i.test(v.trim()));

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // Body may arrive as a string (raw) or as an object depending on host
    const raw = typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
    const email = String((raw as any)?.email ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required" });
    }

    // Decide provider from env; fall back to auto-detect by available keys
    let provider = (process.env.EMAIL_PROVIDER || process.env.NEXT_PUBLIC_EMAIL_PROVIDER || "")
      .trim()
      .toLowerCase();

    if (!provider) {
      if ((process.env.BUTTONDOWN_API_KEY || "").trim()) provider = "buttondown";
      else if (
        (process.env.MAILCHIMP_API_KEY || "").trim() &&
        (process.env.MAILCHIMP_LIST_ID || "").trim()
      )
        provider = "mailchimp";
    }

    /* ---------------- Mailchimp ---------------- */
    if (provider === "mailchimp") {
      const key = (process.env.MAILCHIMP_API_KEY || "").trim();
      const listId = (process.env.MAILCHIMP_LIST_ID || "").trim();
      const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

      // Mailchimp API key must include -usX data center suffix
      if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
        return res.status(500).json({ ok: false, message: "Mailchimp not configured" });
      }

      const dc = key.split("-").pop()!; // e.g. "us6"
      const subscriberHash = crypto.createHash("md5").update(email).digest("hex");
      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

      const r = await fetchWithTimeout(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`anystring:${key}`).toString("base64"),
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: doubleOpt ? "pending" : "subscribed",
        }),
      });

      const resp: any = await safeJson(r);

      if (r.ok) {
        return res.status(200).json({
          ok: true,
          message: doubleOpt
            ? "Check your email to confirm your subscription."
            : "You’re subscribed. Welcome!",
        });
      }

      const detail = String(resp?.title || resp?.detail || "");
      if (/exists|already/i.test(detail)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res.status(r.status || 500).json({ ok: false, message: detail || "Mailchimp error" });
    }

    /* ---------------- Buttondown ---------------- */
    if (provider === "buttondown") {
      const token = (process.env.BUTTONDOWN_API_KEY || "").trim();
      if (!token) {
        return res.status(500).json({ ok: false, message: "Buttondown not configured" });
      }

      const r = await fetchWithTimeout("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const resp: any = await safeJson(r);

      if (r.ok || r.status === 201) {
        return res.status(200).json({ ok: true, message: "You’re subscribed. Welcome!" });
      }

      const txt = JSON.stringify(resp || {}).toLowerCase();
      if (r.status === 400 && (txt.includes("already") || txt.includes("exists"))) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      const msg = resp?.detail || resp?.message || firstErrorString(resp) || "Buttondown error";
      return res.status(r.status || 500).json({ ok: false, message: msg });
    }

    // Unknown/missing provider
    return res
      .status(500)
      .json({ ok: false, message: "EMAIL_PROVIDER must be 'mailchimp' or 'buttondown'" });
  } catch {
    return res.status(500).json({ ok: false, message: "Unexpected server error" });
  }
}

/* -------------- helpers -------------- */
function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return {};
  }
}
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 10_000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}
function firstErrorString(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return;
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
}
