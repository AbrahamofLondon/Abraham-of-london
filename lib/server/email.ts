/* eslint-disable no-console */

export interface SendEmailParams {
  to?: string | string[]; // optional override
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getDefaultSender(): string {
  return process.env.MAIL_FROM || process.env.MAIL_TO || "no-reply@abrahamoflondon.org";
}

function getPrimaryRecipient(): string {
  return process.env.MAIL_TO_PRIMARY || process.env.MAIL_TO || "";
}

function getFallbackRecipient(): string {
  return process.env.MAIL_TO_FALLBACK || "";
}

function normalizeEmail(v: string): string {
  return String(v || "").trim();
}

// Basic sanity check (not RFC-perfect; good enough to prevent obvious garbage)
function isLikelyEmail(v: string): boolean {
  const s = normalizeEmail(v);
  return s.length >= 5 && s.includes("@") && !s.includes(" ");
}

function uniqueNonEmpty(list: string[]): string[] {
  const set = new Set<string>();
  for (const item of list) {
    const val = normalizeEmail(item);
    if (!val) continue;
    set.add(val);
  }
  return Array.from(set);
}

async function deliverEmail(
  to: string[],
  sender: string,
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResult> {
  try {
    const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();

    if (provider === "console") {
      console.log("📧 [EMAIL] Delivery (console mode):", {
        provider,
        from: sender,
        to,
        subject,
        htmlLength: html?.length ?? 0,
        textLength: text?.length ?? 0,
      });

      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // TODO: implement real providers
    // - Resend
    // - SendGrid
    // - SMTP (nodemailer)

    console.warn("⚠️ [EMAIL] Provider not implemented, falling back to console-like success:", provider);
    return { success: true, messageId: `provider-${provider}-${Date.now()}` };
  } catch (err) {
    console.error("Email sending failure:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendAppEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const sender = getDefaultSender();

  const recipients: string[] = [];

  // explicit override => ONLY send to that address(es)
  if (params.to) {
    if (Array.isArray(params.to)) recipients.push(...params.to);
    else recipients.push(params.to);
  } else {
    const primary = getPrimaryRecipient();
    const fallback = getFallbackRecipient();
    if (primary) recipients.push(primary);
    if (fallback) recipients.push(fallback);
  }

  const to = uniqueNonEmpty(recipients).filter(isLikelyEmail);

  if (to.length === 0) {
    console.warn("⚠️ [EMAIL] No valid recipients configured");
    return { success: false, error: "No valid recipients configured" };
  }

  const subject = String(params.subject || "").trim();
  if (!subject) return { success: false, error: "Missing email subject" };

  const html = String(params.html || "");
  const text = String(params.text || "");

  return deliverEmail(to, sender, subject, html, text);
}