// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";

type Ok = { ok: true; message: string };
type Err = { ok: false; message: string };

// Regex for basic email format validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public teaser paths (make sure both files exist under /public/downloads/)
const TEASER_A4 = "/downloads/Fathering_Without_Fear_Teaser-A4.pdf";
const TEASER_MOB = "/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ ok: false, message: "Method Not Allowed" });
    }

    try {
        const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
        
        // Input sanitization and limits
        const name = String((body as any).name || "").trim().slice(0, 100);
        const email = String((body as any).email || "").trim().toLowerCase();
        const subject = String((body as any).subject || "Website contact").trim().slice(0, 120);
        const message = String((body as any).message || "").trim();
        const honeypot = String((body as any)["bot-field"] || (body as any).botField || "").trim();

        // New flags (checkboxes on the form / FloatingTeaserCTA, etc.)
        const teaserOptIn = !!(body as any).teaserOptIn;
        const newsletterOptIn = !!(body as any).newsletterOptIn;

        // URLs for email content
        const SITE_URL =
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.URL ||
            process.env.DEPLOY_PRIME_URL ||
            "https://www.abrahamoflondon.org";

        const teaserA4Url = abs(SITE_URL, TEASER_A4);
        const teaserMobUrl = abs(SITE_URL, TEASER_MOB);

        // --- Validation ---
        if (honeypot) return res.status(200).json({ ok: true, message: "Message sent successfully!" });
        if (!email || !message) return res.status(400).json({ ok: false, message: "Required: email, message" });
        if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, message: "Invalid email format" });
        if (message.length < 5) return res.status(400).json({ ok: false, message: "Message is too short" });

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
            if (!apiKey) return res.status(500).json({ ok: false, message: "Email provider not configured" });

            // 1) Notify owner
            const ownerHtml = ownerNoticeHtml({ name, email, subject, message, teaserOptIn, newsletterOptIn });
            const ownerResp = await sendViaResend({
                apiKey,
                from,
                to,
                subject: `New contact: ${name || "Anonymous"}`,
                html: ownerHtml,
                replyTo: { email, name: name || email }, // Pass reply-to info
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
                    to: email, // Send to the customer's email
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
                    to, // Send to the owner
                    subject: "Newsletter opt-in — Fathering Without Fear",
                    html: nlHtml,
                });
                if (!nlResp.ok) {
                    console.error("[contact] Resend newsletter note failed:", nlResp.status, nlResp.body);
                }
                // If you use an ESP (ConvertKit/Beehiiv/etc.), call its subscription API here instead.
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
function abs(site: string, p: string) {
    if (!p) return site;
    try {
        return new URL(p, site).toString();
    } catch {
        // Fallback for tricky environments/URLs
        return `${site}${p.startsWith("/") ? "" : "/"}${p}`;
    }
}

/** Safely parses a JSON string, returning an empty object on failure. */
function safeParse(s: string) {
    try { return JSON.parse(s); } catch { return {}; }
}

/** Escapes HTML special characters for safe email template injection. */
function escapeHtml(str: string) {
    return String(str).replace(/[&<>"']/g, (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const)[m] || m
    );
}

// --- Email Content Generators ---

/** HTML content for the owner notification email. */
function ownerNoticeHtml(args: {
    name: string; email: string; subject: string; message: string;
    teaserOptIn: boolean; newsletterOptIn: boolean;
}) {
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

/** HTML content for the auto-reply email with the teaser links. */
function teaserAutoReplyHtml(args: { teaserA4Url: string; teaserMobUrl: string; siteUrl: string }) {
    const { teaserA4Url, teaserMobUrl, siteUrl } = args;
    return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#222">
      <p>Friends—</p>
      <p>I’m releasing <em>Fathering Without Fear</em>, a memoir forged in the middle of loss, legal storms, and a father’s stubborn hope.</p>
      <p>Here’s your free, brand-styled teaser (A4 + Mobile) to read and share:</p>
      <ul>
        <li><a href="${teaserA4Url}">Teaser PDF (A4/Letter)</a></li>
        <li><a href="${teaserMobUrl}">Teaser PDF (Mobile)</a></li>
      </ul>
      <p>If you want chapter drops and launch dates, reply “keep me posted” or join the list here:
        <a href="${siteUrl}/contact">${siteUrl}/contact</a></p>
      <p>Grace and courage,<br/>Abraham of London</p>
    </div>`.trim();
}

/** Plain text content for the auto-reply email. */
function teaserAutoReplyText(args: { teaserA4Url: string; teaserMobUrl: string; siteUrl: string }) {
    const { teaserA4Url, teaserMobUrl, siteUrl } = args;
    return `
Subject: Fathering Without Fear — the story they thought they knew

Friends—
I’m releasing Fathering Without Fear, a memoir forged in the middle of loss, legal storms, and a father’s stubborn hope.

Free teaser (A4 + Mobile):
— ${teaserA4Url}
— ${teaserMobUrl}

For chapter drops and launch dates, reply “keep me posted” or join: ${siteUrl}/contact

Grace and courage,
Abraham of London
`.trim();
}

// --- Resend API Integration ---

/** Sends an email using the Resend API. */
async function sendViaResend(args: {
    apiKey: string;
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: { email: string; name?: string };
}): Promise<{ ok: boolean; status: number; body?: any }> {
    const { apiKey, from, to, subject, html, text, replyTo } = args;
    const payload: any = { from, to, subject, html };
    if (text) payload.text = text;
    
    // Resend's API accepts a single email string for reply_to
    if (replyTo?.email) {
        // Create the string format: "Name <email@example.com>"
        payload.reply_to = replyTo.name ? `${replyTo.name} <${replyTo.email}>` : replyTo.email;
    }

    const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
    });

    let body: any = null;
    try { body = await r.json(); } catch { body = null; }
    return { ok: r.ok, status: r.status, body };
}