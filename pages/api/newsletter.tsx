// pages/api/newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type Json = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// little helpers
const asBool = (v?: string, def = true) => (v == null ? def : /^true$/i.test(v.trim()));
function isString(v: unknown): v is string { return typeof v === "string"; }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  // Lightweight probe to confirm which code is live
  if (req.method === "GET" && "debug" in req.query) {
    return res.status(200).json({
      ok: true,
      message: `newsletter endpoint OK (provider=${detectProvider() || "unknown"})`,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    // Body may arrive as a string or parsed object depending on host
    const raw = typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});
    const email = extractEmail(raw);

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, message: "Valid email is required" });
    }

    const provider = detectProvider();

    if (provider === "mailchimp") {
      const mc = await upsertMailchimp(email);
      return res.status(mc.ok ? 200 : mc.status || 500).json({ ok: mc.ok, message: mc.message });
    }

    if (provider === "buttondown") {
      const bd = await createButtondownSubscriber(email);
      return res.status(bd.ok ? 200 : bd.status || 500).json({ ok: bd.ok, message: bd.message });
    }

    return res
      .status(500)
      .json({ ok: false, message: "EMAIL_PROVIDER must be 'mailchimp' or 'buttondown'" });
  } catch {
    return res.status(500).json({ ok: false, message: "Unexpected server error" });
  }
}

/* ---------------- Provider detection ---------------- */

function detectProvider(): "buttondown" | "mailchimp" | undefined {
  const envProvider = (process.env.EMAIL_PROVIDER || process.env.NEXT_PUBLIC_EMAIL_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (envProvider === "buttondown" || envProvider === "mailchimp") return envProvider as any;

  const hasBD = !!(process.env.BUTTONDOWN_API_KEY || "").trim();
  const hasMC =
    !!(process.env.MAILCHIMP_API_KEY || "").trim() &&
    !!(process.env.MAILCHIMP_LIST_ID || "").trim();

  if (hasBD && !hasMC) return "buttondown";
  if (hasMC && !hasBD) return "mailchimp";

  // Prefer Buttondown if both are present
  if (hasBD) return "buttondown";
  if (hasMC) return "mailchimp";
  return undefined;
}

/* ---------------- Input parsing ---------------- */

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return {}; }
}

function extractEmail(body: any): string | undefined {
  if (!body || typeof body !== "object") return;

  // Most clients in your app use this:
  if (isString(body.email) && body.email.trim()) return body.email.trim().toLowerCase();

  // Accept several common Buttondown shapes just in case:
  if (isString(body.email_address) && body.email_address.trim())
    return body.email_address.trim().toLowerCase();

  if (body.payload && typeof body.payload === "object") {
    const pe = (body.payload as any).email || (body.payload as any).email_address;
    if (isString(pe) && pe.trim()) return pe.trim().toLowerCase();
  }

  return;
}

/* ---------------- Buttondown ---------------- */

async function createButtondownSubscriber(email: string) {
  const token = (process.env.BUTTONDOWN_API_KEY || "").trim();
  if (!token) {
    return { ok: false, status: 500, message: "Buttondown not configured" };
  }

  // Some accounts/endpoints expect { email }, some { email_address }, and some
  // (rarely) a nested { payload: { email_address } }. We’ll try in order.
  const attempts = [
    { body: { email }, label: "email" },
    { body: { email_address: email }, label: "email_address" },
    { body: { payload: { email_address: email } }, label: "payload.email_address" },
  ] as const;

  let lastMsg = "Buttondown error";
  let lastStatus: number | undefined;

  for (const a of attempts) {
    const r = await fetchWithTimeout("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(a.body),
      timeoutMs: 12_000,
    });

    const resp: any = await safeJson(r);

    if (r.ok || r.status === 201) {
      return { ok: true, status: 200, message: "You’re subscribed. Welcome!" };
    }

    // If schema complaint, try next shape
    const txt = JSON.stringify(resp || {}).toLowerCase();
    const likelySchemaError =
      r.status === 400 || r.status === 422 || txt.includes("field required");
    lastMsg =
      resp?.detail ||
      resp?.message ||
      firstErrorString(resp) ||
      `Buttondown rejected (${a.label})`;
    lastStatus = r.status;

    if (!likelySchemaError) break; // stop retrying on non-schema errors (e.g., 401/403)
  }

  // If the address is already on the list, normalize to success
  if ((lastMsg || "").toLowerCase().includes("already")) {
    return { ok: true, status: 200, message: "You’re already subscribed." };
  }

  return { ok: false, status: lastStatus || 500, message: lastMsg || "Buttondown error" };
}

/* ---------------- Mailchimp ---------------- */

async function upsertMailchimp(email: string) {
  const key = (process.env.MAILCHIMP_API_KEY || "").trim();
  const listId = (process.env.MAILCHIMP_LIST_ID || "").trim();
  const doubleOpt = asBool(process.env.MAILCHIMP_DOUBLE_OPT_IN, true);

  if (!key || !listId || !/-[a-z0-9]{2,}$/i.test(key)) {
    return { ok: false, status: 500, message: "Mailchimp not configured" };
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
    timeoutMs: 12_000,
  });

  const resp: any = await safeJson(r);
  if (r.ok) {
    return {
      ok: true,
      status: 200,
      message: doubleOpt
        ? "Check your email to confirm your subscription."
        : "You’re subscribed. Welcome!",
    };
  }

  const detail = String(resp?.title || resp?.detail || "");
  if (/exists|already/i.test(detail)) {
    return { ok: true, status: 200, message: "You’re already subscribed." };
  }
  return { ok: false, status: r.status || 500, message: detail || "Mailchimp error" };
}

/* ---------------- shared fetch utils ---------------- */

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
  return;
}
