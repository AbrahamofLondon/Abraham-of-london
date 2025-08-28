// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type Json = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const asBool = (v?: string, def = true) => (v == null ? def : /^true$/i.test(v.trim()));

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  // --- Debug probe: GET /api/newsletter?debug=1 shows provider and works for health checks
  if (req.method === "GET" && req.query.debug === "1") {
    const provider = resolveProvider();
    return res.status(200).json({ ok: true, message: `newsletter endpoint OK (provider=${provider || "unset"})` });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // Accept *either* { email } or { payload: { email_address } } from callers (backward-compatible)
    const body = typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
    const topEmail = String((body as any)?.email ?? "").trim().toLowerCase();
    const payloadEmail = String((body as any)?.payload?.email_address ?? "").trim().toLowerCase();
    const email = topEmail || payloadEmail;

    if (!EMAIL_RE.test(email)) {
      return res.status(422).json({ ok: false, message: "Valid email is required" });
    }

    const provider = resolveProvider();

    /* ---------------- Buttondown ---------------- */
    if (provider === "buttondown") {
      const token = (process.env.BUTTONDOWN_API_KEY || "").trim();
      if (!token) {
        return res.status(500).json({ ok: false, message: "Buttondown not configured" });
      }

      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
        // Buttondown (your account) expects: { payload: { email_address } }
        body: JSON.stringify({ payload: { email_address: email } }),
      });

      const text = await r.text();
      const resp = asJson(text);
      const msg = extractMessage(resp);

      if (r.ok || r.status === 201) {
        return res.status(200).json({ ok: true, message: "You’re subscribed. Welcome!" });
      }

      // Consider “already exists” a success UX-wise
      if ((r.status === 400 || r.status === 422) && /already|exist/i.test(msg || "")) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res.status(r.status || 500).json({
        ok: false,
        message: msg || `Buttondown error (HTTP ${r.status})`,
      });
    }

    /* ---------------- Mailchimp ---------------- */
    if (provider === "mailchimp") {
      const key = (process.env.MAILCHIMP_API_KEY || "").trim();
      const listId = (process.env.MAILCHIMP_LIST_ID || "").trim();
      const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

      if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
        return res.status(500).json({ ok: false, message: "Mailchimp not configured" });
      }

      const dc = key.split("-").pop()!; // e.g. "us6"
      const subscriberHash = crypto.createHash("md5").update(email).digest("hex");
      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

      const r = await fetch(url, {
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

      const text = await r.text();
      const resp = asJson(text);
      const detail = String((resp as any)?.title || (resp as any)?.detail || "");

      if (r.ok) {
        return res.status(200).json({
          ok: true,
          message: doubleOpt
            ? "Check your email to confirm your subscription."
            : "You’re subscribed. Welcome!",
        });
      }

      if (/exists|already/i.test(detail)) {
        return res.status(200).json({ ok: true, message: "You’re already subscribed." });
      }

      return res.status(r.status || 500).json({
        ok: false,
        message: detail || `Mailchimp error (HTTP ${r.status})`,
      });
    }

    return res.status(500).json({
      ok: false,
      message: "EMAIL_PROVIDER must be 'buttondown' or 'mailchimp'",
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Unexpected server error" });
  }
}

/* ---------------- helpers ---------------- */
function resolveProvider(): string | undefined {
  let provider = (process.env.EMAIL_PROVIDER || process.env.NEXT_PUBLIC_EMAIL_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (!provider) {
    if ((process.env.BUTTONDOWN_API_KEY || "").trim()) provider = "buttondown";
    else if ((process.env.MAILCHIMP_API_KEY || "").trim() && (process.env.MAILCHIMP_LIST_ID || "").trim())
      provider = "mailchimp";
  }
  return provider || undefined;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
function asJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
function extractMessage(resp: any): string | undefined {
  // FastAPI/Pydantic typical shape
  if (resp?.detail) {
    if (Array.isArray(resp.detail)) {
      const msgs = resp.detail
        .map((d: any) => (typeof d?.msg === "string" ? d.msg : undefined))
        .filter(Boolean);
      if (msgs.length) return msgs.join("; ");
    }
    if (typeof resp.detail === "string") return resp.detail;
  }
  if (typeof resp?.message === "string") return resp.message;
  return undefined;
}
