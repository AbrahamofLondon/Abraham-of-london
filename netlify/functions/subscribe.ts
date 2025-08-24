// netlify/functions/subscribe.ts
import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const isEmail = (v: unknown): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const json = { "Content-Type": "application/json" };

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: json, body: JSON.stringify({ ok: false, message: "Method Not Allowed" }) };
  }

  try {
    const { email, hp } = JSON.parse(event.body || "{}") as { email?: string; hp?: string };

    // Basic validations
    if (hp) return { statusCode: 204, headers: json, body: "" }; // honeypot (hidden field) → silent drop
    if (!isEmail(email)) {
      return { statusCode: 422, headers: json, body: JSON.stringify({ ok: false, message: "Valid email is required" }) };
    }

    // Provider switch (defaults to Resend)
    const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

    if (provider === "resend") {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("RESEND_API_KEY not configured");

      const resend = new Resend(key);
      const from = process.env.EMAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
      const adminTo = process.env.ADMIN_NOTIFY_TO || "info@abrahamoflondon.org";

      // 1) Send a quick welcome (you can upgrade to double-opt-in later)
      await resend.emails.send({
        from,
        to: [email],
        subject: "You’re in — Abraham of London Newsletter",
        text: "Thanks for subscribing. You’ll hear from me soon.",
      });

      // 2) Notify you internally
      await resend.emails.send({
        from,
        to: [adminTo],
        subject: "New newsletter subscriber",
        text: `Subscriber: ${email}`,
      });
    } else {
      // Fallback behavior if you ever swap providers via env
      console.log("[subscribe] Provider:", provider, "Email:", email);
    }

    return { statusCode: 200, headers: json, body: JSON.stringify({ ok: true, message: "You’re subscribed. Welcome!" }) };
  } catch (err) {
    console.error("[subscribe] error:", err);
    return { statusCode: 500, headers: json, body: JSON.stringify({ ok: false, message: "Subscription failed." }) };
  }
};
