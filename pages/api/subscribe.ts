// pages/api/subscribe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type Json = { ok: boolean; message: string };

const asBool = (v: string | undefined, def = true) =>
  v == null ? def : /^true$/i.test(v.trim());

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required" });
    }

    const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
    if (provider === "mailchimp") {
      const key = process.env.MAILCHIMP_API_KEY || "";
      const listId = process.env.MAILCHIMP_LIST_ID || "";
      const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

      if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
        return res.status(500).json({ ok: false, message: "Mailchimp not configured" });
      }
      const dc = key.split("-").pop()!;
      const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

      // Use PUT upsert — handles “already subscribed” cleanly.
      const mcUrl = https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash};
      const payload = {
        email_address: email,
        status_if_new: doubleOpt ? "pending" : "subscribed",
      };

      const r = await fetch(mcUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(anystring:${key}).toString("base64")}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await r.json().catch(() => ({}));

      if (r.ok) {
        const msg = doubleOpt
          ? "Check your email to confirm your subscription."
          : "You’re subscribed. Welcome!";
        return res.status(200).json({ ok: true, message: msg });
      }

      // Gracefully treat “Member Exists” as success
      const details = (body?.title || body?.detail || "").toString();
      if (/exists/i.test(details) || /member\s+exists/i.test(details)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res
        .status(r.status || 500)
        .json({ ok: false, message: details || "Mailchimp error" });
    }

    if (provider === "buttondown") {
      const token = process.env.BUTTONDOWN_API_KEY || "";
      if (!token) return res.status(500).json({ ok: false, message: "Buttondown not configured" });

      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Token ${token},
        },
        body: JSON.stringify({ email }),
      });

      const body = await r.json().catch(() => ({}));

      if (r.ok || r.status === 201) {
        return res.status(200).json({ ok: true, message: "You’re subscribed. Welcome!" });
      }

      // Buttondown often returns 400 with a helpful message if already exists
      const msg = (body?.detail || body?.message || "").toString();
      if (/already/i.test(msg)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res.status(r.status || 500).json({ ok: false, message: msg || "Buttondown error" });
    }

    return res.status(500).json({ ok: false, message: "EMAIL_PROVIDER must be 'mailchimp' or 'buttondown'" });
  } catch (err: any) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ ok: false, message: "Unexpected server error" });
  }
}