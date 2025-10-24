// netlify/functions/subscribe.ts
import type { Handler } from "@netlify/functions";

type Json = Record<string, unknown>;

const json = (status: number, body: Json) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const ok = (message: string, extra: Json = {}) => json(200, { ok: true, message, ...extra });
const bad = (message: string, extra: Json = {}) => json(400, { ok: false, message, ...extra });
const oops = (message = "Unexpected error") => json(500, { ok: false, message });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const handler: Handler = async (evt) => {
  if (evt.httpMethod !== "POST") return json(405, { ok: false, message: "Method Not Allowed" });

  try {
    const { email } = JSON.parse(evt.body || "{}");
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return bad("Please enter a valid email address.");
    }

    const provider = String(process.env.EMAIL_PROVIDER || "buttondown").toLowerCase();

    if (provider === "buttondown") {
      const apiKey = process.env.BUTTONDOWN_API_KEY || "";
      if (!apiKey) return oops("Missing BUTTONDOWN_API_KEY");

      const payload: Record<string, unknown> = {
        email,
        referrer_url: evt.headers?.referer || "",
      };
      const tags = (process.env.BUTTONDOWN_TAGS || "").trim();
      if (tags) payload.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);

      const res = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) return ok("Thanks—check your inbox to confirm.");
      const text = await res.text();
      if (res.status === 400 && /already.*subscribed/i.test(text)) {
        return ok("You’re already subscribed.");
      }
      return oops(`Buttondown error (${res.status}): ${text}`);
    }

    if (provider === "mailchimp") {
      const key = process.env.MAILCHIMP_API_KEY || "";
      const list = process.env.MAILCHIMP_AUDIENCE_ID || "";
      const region = process.env.MAILCHIMP_SERVER_PREFIX || "";
      if (!key || !list || !region) {
        return oops("Missing Mailchimp env: MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID, MAILCHIMP_SERVER_PREFIX");
      }

      const url = `https://${region}.api.mailchimp.com/3.0/lists/${list}/members`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `apikey ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: email, status: "pending" }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) return ok("Thanks—check your inbox to confirm.");
      if (res.status === 400 && String((body as any)?.title).toLowerCase().includes("member exists")) {
        return ok("You’re already subscribed.");
      }
      return oops(`Mailchimp error (${res.status}): ${(body as any)?.detail || "unknown"}`);
    }

    return bad("EMAIL_PROVIDER must be 'mailchimp' or 'buttondown'.");
  } catch (err: any) {
    return oops(err?.message || "Failed to subscribe");
  }
};
