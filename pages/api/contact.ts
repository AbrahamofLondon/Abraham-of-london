// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";

interface OkResponse {
  ok: true;
  message: string;
}

interface ErrorResponse {
  ok: false;
  message: string;
  error?: string;
}

type ContactResponse = OkResponse | ErrorResponse;

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  botField?: string;
  teaserOptIn?: boolean;
  newsletterOptIn?: boolean;
}

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}

interface ResendResponse {
  ok: boolean;
  status: number;
  body?: unknown;
}

// Regex for basic email format validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public teaser paths (make sure both files exist under /public/downloads/)
const TEASER_A4 = "/downloads/Fathering_Without_Fear_Teaser-A4.pdf";
const TEASER_MOB = "/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {}) as ContactRequestBody;
    
    // Input sanitization and limits
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "Website contact").trim().slice(0, 120);
    const message = String(body.message || "").trim();
    const honeypot = String(body.botField || "").trim();

    // New flags (checkboxes on the form / FloatingTeaserCTA, etc.)
    const teaserOptIn = !!body.teaserOptIn;
    const newsletterOptIn = !!body.newsletterOptIn;

    // URLs for email content
    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "https://www.abrahamoflondon.org";

    const teaserA4Url = abs(SITE_URL, TEASER_A4);
    const teaserMobUrl = abs(SITE_URL, TEASER_MOB);

    // --- Validation ---
    if (honeypot) {
      return res.status(200).json({ ok: true, message: "Message sent successfully!" });
    }
    if (!email || !message) {
      return res.status(400).json({ ok: false, message: "Required: email, message" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, message: "Invalid email format" });
    }
    if (message.length < 5) {
      return res.status(400).json({ ok: false, message: "Message is too short" });
    }

    // Dev logging
    if (process.env.NODE_ENV !== "production") {
      const maskedEmail = email.replace(/^(.).+(@.*)$/, "$1***$2");
      console.log("[contact] submission:", {
        name: name || "—",
        email: maskedEmail,
        subject,
        messageLength: message.length,
        teaserOptIn,
        newsletterOptIn,
      });
    }

    // Optional email sending via Resend
    const provider = (process.env.CONTACT_PROVIDER || "").toLowerCase();
    if (provider === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      const to = process.env.MAIL_TO || "info@abrahamoflondon.org";
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
      
      if (!apiKey) {
        return res.status(500).json({ ok: false, message: "Email provider not configured" });
      }

      // 1) Notify owner
      const ownerHtml = ownerNoticeHtml({ name, email, subject, message, teaserOptIn, newsletterOptIn });
      const ownerResp = await sendViaResend({
        apiKey,
        from,
        to,
        subject: `New contact: ${name || "Anonymous"}`,
        html: ownerHtml,
        replyTo: { email, name: name || email },
      });
      
      if (!ownerResp.ok) {
        console.error("[contact] Resend owner send failed:", ownerResp.status, ownerResp.body);
        // Continue to attempt auto-reply
      }

      // 2) Auto-reply with teaser (if opted in)
      if (teaserOptIn) {
        const autoHtml = teaserAutoReplyHtml({ teaserA4Url, teaserMobUrl, siteUrl: SITE_URL });
        const autoText = teaserAutoReplyText({ teaserA4Url, teaserMobUrl, siteUrl: SITE_URL });
        const autoResp = await sendViaResend({
          apiKey,
          from,
          to: email,
          subject: "Fathering Without Fear — Teaser (A4 + Mobile)",
          html: autoHtml,
          text: autoText,
        });
        
        if (!autoResp.ok) {
          console.error("[contact] Resend teaser auto-reply failed:", autoResp.status, autoResp.body);
        }
      }

      // 3) Newsletter opt-in (notify owner or integrate your ESP here)
      if (newsletterOptIn) {
        const nlHtml = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111">
          <h3>Newsletter opt-in — Fathering Without Fear</h3>
          <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p>Please add to the launch/chapters list.</p>
        </div>`.trim();
        
        const nlResp = await sendViaResend({
          apiKey,
          from,
          to,
          subject: "Newsletter opt-in — Fathering Without Fear",
          html: nlHtml,
        });
        
        if (!nlResp.ok) {
          console.error("[contact] Resend newsletter note failed:", nlResp.status, nlResp.body);
        }
      }
    }

    return res.status(200).json({ ok: true, message: "Message sent successfully!" });
  } catch (e) {
    console.error("[contact] handler error:", e);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

/* ---------------- helpers ---------------- */

/** Generates an absolute URL from a base site URL and a path. */
function abs(site: string, p: string): string {
  if (!p) return site;
  try {
    return new URL(p, site).toString();
  } catch {
    return `${site}${p.startsWith("/") ? "" : "/"}${p}`;
  }
}

/** Safely parses a JSON string, returning an empty object on failure. */
function safeParse(s: string): ContactRequestBody {
  try {
    return JSON.parse(s) as ContactRequestBody;
  } catch {
    return {};
  }
}

/** Escapes HTML special characters for safe email template injection. */
function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const)[m] || m
  );
}

// --- Email Content Generators ---

interface OwnerNoticeArgs {
  name: string;
  email: string;
  subject: string;
  message: string;
  teaserOptIn: boolean;
  newsletterOptIn: boolean;
}

/** HTML content for the owner notification email. */
function ownerNoticeHtml(args: OwnerNoticeArgs): string {
  const { name, email, subject, message, teaserOptIn, newsletterOptIn } = args;
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:16px;line-height:1.55;color:#111">
    <h2>New website inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Teaser requested:</strong> ${teaserOptIn ? "Yes" : "No"}</p>
    <p><strong>Newsletter opt-in:</strong> ${newsletterOptIn ? "Yes" : "No"}</p>
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap; background-color: #f7f7f7; padding: 10px; border-radius: 5px;">${escapeHtml(message)}</pre>
  </div>`.trim();
}

interface TeaserAutoReplyArgs {
  teaserA4Url: string;
  teaserMobUrl: string;
  siteUrl: string;
}

/** HTML content for the auto-reply email with the teaser links. */
function teaserAutoReplyHtml(args: TeaserAutoReplyArgs): string {
  const { teaserA4Url, teaserMobUrl, siteUrl } = args;
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#222">
    <p>Friends—</p>
    <p>I'm releasing <em>Fathering Without Fear</em>, a memoir forged in the middle of loss, legal storms, and a father's stubborn hope.</p>
    <p>Here's your free, brand-styled teaser (A4 + Mobile) to read and share:</p>
    <ul>
      <li><a href="${teaserA4Url}">Teaser PDF (A4/Letter)</a></li>
      <li><a href="${teaserMobUrl}">Teaser PDF (Mobile)</a></li>
    </ul>
    <p>If you want chapter drops and launch dates, reply "keep me posted" or join the list here:
      <a href="${siteUrl}/contact">${siteUrl}/contact</a></p>
    <p>Grace and courage,<br/>Abraham of London</p>
  </div>`.trim();
}

/** Plain text content for the auto-reply email. */
function teaserAutoReplyText(args: TeaserAutoReplyArgs): string {
  const { teaserA4Url, teaserMobUrl, siteUrl } = args;
  return `
Subject: Fathering Without Fear — the story they thought they knew

Friends—
I'm releasing Fathering Without Fear, a memoir forged in the middle of loss, legal storms, and a father's stubborn hope.

Free teaser (A4 + Mobile):
— ${teaserA4Url}
— ${teaserMobUrl}

For chapter drops and launch dates, reply "keep me posted" or join: ${siteUrl}/contact

Grace and courage,
Abraham of London
`.trim();
}

// --- Resend API Integration ---

interface SendViaResendArgs {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: { email: string; name?: string };
}

/** Sends an email using the Resend API. */
async function sendViaResend(args: SendViaResendArgs): Promise<ResendResponse> {
  const { apiKey, from, to, subject, html, text, replyTo } = args;
  const payload: EmailPayload = { from, to, subject, html };
  
  if (text) payload.text = text;
  
  if (replyTo?.email) {
    payload.reply_to = replyTo.name ? `${replyTo.name} <${replyTo.email}>` : replyTo.email;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}