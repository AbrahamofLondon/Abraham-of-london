// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; message: string };
type Err = { ok: false; error: string };
type Res = Ok | Err;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Res>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    // Next already parses JSON when content-type is application/json
    const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
    const email = String((body as any).email ?? "").trim().toLowerCase();
    const honeypot = String((body as any).hp ?? (body as any)["bot-field"] ?? "");

    // Honeypot: pretend success if bot filled it
    if (honeypot) return res.status(200).json({ ok: true, message: "Subscribed successfully" });

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    const provider = String(process.env.EMAIL_PROVIDER ?? "buttondown").toLowerCase();

    if (provider === "buttondown") {
      const apiKey = process.env.BUTTONDOWN_API_KEY;
      if (!apiKey) {
        console.warn("[newsletter] Missing BUTTONDOWN_API_KEY");
        return res.status(500).json({ ok: false, error: "Email provider not configured" });
      }

      // Short timeout so the API doesn’t hang
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);

      let resp: Response;
      try {
        resp = await fetch("https://api.buttondown.email/v1/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${apiKey}`,
          },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(t);
      }

      // Buttondown often responds with JSON error details
      const data: any = await resp
        .json()
        .catch(() => ({}));

      if (resp.ok) {
        return res.status(200).json({ ok: true, message: "Subscribed successfully" });
      }

      // Normalize common “already subscribed” cases to success
      const txt = JSON.stringify(data).toLowerCase();
      if (
        resp.status === 400 &&
        (txt.includes("already") || txt.includes("exists"))
      ) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed" });
      }

      const msg =
        data?.detail ||
        data?.message ||
        firstErrorString(data) ||
        "Subscription failed";
      return res.status(resp.status).json({ ok: false, error: msg });
    }

    // Fallback: mock “subscribe”
    if (process.env.NODE_ENV !== "production") {
      console.log("[newsletter] mock subscribe:", email.replace(/^(.).+(@.*)$/, "$1***$2"));
    }
    return res.status(200).json({ ok: true, message: "Subscribed successfully" });
  } catch (err: any) {
    console.error("[newsletter] API error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}

/* ---------------- helpers ---------------- */

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function firstErrorString(obj: any): string | undefined {
  // Buttondown may return shape like { email: ["..."], non_field_errors: ["..."] }
  if (!obj || typeof obj !== "object") return;
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
}
