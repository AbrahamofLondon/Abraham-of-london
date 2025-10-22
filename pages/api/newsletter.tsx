// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto"; // only used for Mailchimp path
export const config = { api: { bodyParser: true } }; // ensure Node/API parsing
// Force node runtime (important on some hosts)
export const runtime = "nodejs";

type Json = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const asBool = (v?: string, def = true) => (v == null ? def : /^true$/i.test(v.trim()));

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  res.setHeader("Cache-Control", "no-store");

  // --- tiny health check ---
  if (req.method === "GET" && (req.query.debug === "1" || req.query.debug === "true")) {
    const provider = (process.env.EMAIL_PROVIDER || process.env.NEXT_PUBLIC_EMAIL_PROVIDER || "")
      .trim()
      .toLowerCase() || "auto";
    const hasBD = Boolean((process.env.BUTTONDOWN_API_KEY || "").trim());
    const hasMC = Boolean((process.env.MAILCHIMP_API_KEY || "").trim()) &&
                  Boolean((process.env.MAILCHIMP_LIST_ID || "").trim());
    return res.status(200).json({
      ok: true,
      message: `newsletter endpoint OK (provider=${provider}; buttondown=${hasBD}; mailchimp=${hasMC})`,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // Accept EITHER { email } OR { payload: { email_address } }
    const raw = typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
    const emailFromPlain = safeString((raw as any)?.email);
    const emailFromPayload = safeString((raw as any)?.payload?.email_address);
    const email = (emailFromPlain || emailFromPayload || "").toLowerCase().trim();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required" });
    }

    // Decide provider
    let provider = (process.env.EMAIL_PROVIDER || process.env.NEXT_PUBLIC_EMAIL_PROVIDER || "")
      .trim()
      .toLowerCase();

    if (!provider) {
      if ((process.env.BUTTONDOWN_API_KEY || "").trim()) provider = "buttondown";
      else if (
        (process.env.MAILCHIMP_API_KEY || "").trim() &&
        (process.env.MAILCHIMP_LIST_ID || "").trim()
      ) provider = "mailchimp";
    }

    // -------------------- BUTTONDOWN --------------------
    if (provider === "buttondown") {
      const token = (process.env.BUTTONDOWN_API_KEY || "").trim();
      if (!token) {
        return res.status(500).json({ ok: false, message: "Buttondown not configured" });
      }

      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Token ${token}`,
      };

      // 1) Try the canonical shape: { email }
      let r = await fetchWithTimeout("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
        timeoutMs: 12_000,
      });
      let resp: any = await safeJson(r);

      // Some Buttondown clusters reply 422 with a Pydantic error asking for payload.email_address
      const needsAltShape =
        r.status === 422 &&
        isPydanticArray(resp) &&
        resp.some(
          (e: any) =>
            String(e?.loc?.join(".") || "").toLowerCase().includes("payload.email_address") ||
            String(e?.msg || "").toLowerCase().includes("field required")
        );

      if (needsAltShape) {
        r = await fetchWithTimeout("https://api.buttondown.email/v1/subscribers", {
          method: "POST",
          headers,
          body: JSON.stringify({ payload: { email_address: email } }),
          timeoutMs: 12_000,
        });
        resp = await safeJson(r);
      }

      if (r.ok || r.status === 201) {
        return res.status(200).json({ ok: true, message: "You're subscribed. Welcome!" });
      }

      // Friendly already-subscribed
      const txt = JSON.stringify(resp || {}).toLowerCase();
      if (r.status === 400 || r.status === 422) {
        if (txt.includes("already") || txt.includes("exists")) {
          return res.status(200).json({ ok: true, message: "You're already subscribed." });
        }
      }
      if (r.status === 401) {
        return res.status(401).json({ ok: false, message: "Buttondown auth failed (check API key)." });
      }
      if (r.status === 429) {
        return res.status(429).json({ ok: false, message: "Rate limited by Buttondown. Try again shortly." });
      }

      // Optional debug echo: pass ?debug=post=1 to surface Buttondown's message
      const showDebug = String(req.query.debug || "").includes("post");
      const msg =
        (typeof resp?.detail === "string" && resp.detail) ||
        (typeof resp?.message === "string" && resp.message) ||
        firstErrorString(resp) ||
        (showDebug ? `Buttondown error (status ${r.status}): ${JSON.stringify(resp)}` : "Buttondown error");
      return res.status(r.status || 500).json({ ok: false, message: msg });
    }

    // -------------------- MAILCHIMP --------------------
    if (provider === "mailchimp") {
      const key = (process.env.MAILCHIMP_API_KEY || "").trim();
      const listId = (process.env.MAILCHIMP_LIST_ID || "").trim();
      const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

      if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
        return res.status(500).json({ ok: false, message: "Mailchimp not configured" });
      }

      const dc = key.split("-").pop()!; // e.g. "us6"
      const hash = crypto.createHash("md5").update(email).digest("hex");
      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`;

      const r = await fetchWithTimeout(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`anystring:${key}`).toString("base64"),
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: doubleOpt ? "pending" : "subscribed",
        }),
        timeoutMs: 12_000,
      });

      const resp: any = await safeJson(r);
      if (r.ok) {
        return res.status(200).json({
          ok: true,
          message: doubleOpt
            ? "Check your email to confirm your subscription."
            : "You're subscribed. Welcome!",
        });
      }

      const detail = String(resp?.title || resp?.detail || "");
      if (/exists|already/i.test(detail)) {
        return res.status(200).json({ ok: true, message: "You're already subscribed." });
      }
      return res.status(r.status || 500).json({ ok: false, message: detail || "Mailchimp error" });
    }

    // --- Unknown/missing provider
    return res
      .status(500)
      .json({ ok: false, message: "EMAIL_PROVIDER must be 'buttondown' or 'mailchimp'" });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      message: "Unexpected server error",
    });
  }
}

/* ---------------- helpers ---------------- */
function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return {}; }
}
async function safeJson(r: Response) {
  try { return await r.json(); } catch { return {}; }
}
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 10_000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input as any, { ...rest, signal: controller.signal } as any);
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
function safeString(v: any): string {
  return typeof v === "string" ? v : "";
}
function isPydanticArray(x: any): boolean {
  return Array.isArray(x) && x.every(e => e && typeof e === "object" && "loc" in e && "msg" in e);
}
