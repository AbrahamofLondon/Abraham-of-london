// pages/api/subscribe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type Json = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const asBool = (v?: string, def = true) =>
  v == null ? def : /^true$/i.test(v.trim());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Json>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // Next.js parses JSON/x-www-form-urlencoded by default, but handle string just in case
    const rawBody = typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
    const email = String(rawBody?.email ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required" });
    }

    const provider = String(process.env.EMAIL_PROVIDER || "").toLowerCase();

    // --- Mailchimp ---
    if (provider === "mailchimp") {
      const key = process.env.MAILCHIMP_API_KEY || "";
      const listId = process.env.MAILCHIMP_LIST_ID || "";
      const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

      // Mailchimp keys end with "-usX"
      if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
        return res.status(500).json({ ok: false, message: "Mailchimp not configured" });
      }

      const dc = key.split("-").pop()!; // data center suffix (e.g. "us6")
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");

      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
      const payload = {
        email_address: email,
        status_if_new: doubleOpt ? "pending" : "subscribed",
      };

      const r = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Never log this; Mailchimp uses Basic auth with an arbitrary username
          Authorization: "Basic " + Buffer.from(`anystring:${key}`).toString("base64"),
        },
        body: JSON.stringify(payload),
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

      // Treat "Member Exists" as success
      const detail = String(resp?.title || resp?.detail || "");
      if (/exists/i.test(detail)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res
        .status(r.status || 500)
        .json({ ok: false, message: detail || "Mailchimp error" });
    }

    // --- Buttondown ---
    if (provider === "buttondown") {
      const token = process.env.BUTTONDOWN_API_KEY || "";
      if (!token) {
        return res.status(500).json({ ok: false, message: "Buttondown not configured" });
      }

      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Keep token only in env
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const resp: any = await safeJson(r);

      if (r.ok || r.status === 201) {
        return res.status(200).json({ ok: true, message: "You’re subscribed. Welcome!" });
      }

      const msg = String(resp?.detail || resp?.message || "");
      if (/already/i.test(msg)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res.status(r.status || 500).json({ ok: false, message: msg || "Buttondown error" });
    }

    // Unknown / unset provider
    return res
      .status(500)
      .json({ ok: false, message: "EMAIL_PROVIDER must be 'mailchimp' or 'buttondown'" });
  } catch {
    // Never expose internals
    return res.status(500).json({ ok: false, message: "Unexpected server error" });
  }
}

/* ---------------- helpers ---------------- */

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
