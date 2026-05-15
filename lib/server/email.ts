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

/**
 * Checks whether send-to-self is enabled.
 * Controlled by SEND_TO_SELF_ENABLED env var (defaults to "true").
 * When false, the API returns 503 and UI shows unavailable state.
 */
export function isSendToSelfEnabled(): boolean {
  const raw = process.env.SEND_TO_SELF_ENABLED;
  // Default to enabled if not explicitly set to "false"
  return raw === undefined || raw === "" || raw.toLowerCase() !== "false";
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

    if (provider === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || !apiKey.startsWith("re_")) {
        console.error("❌ [EMAIL] Resend provider selected but RESEND_API_KEY is missing or invalid.");
        return { success: false, error: "Resend API key is not configured" };
      }

      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const response = await resend.emails.send({
        from: sender,
        to,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error("❌ [EMAIL] Resend delivery failed:", response.error);
        return { success: false, error: response.error.message ?? "Resend delivery failed" };
      }

      const messageId = response.data?.id ?? `resend-${Date.now()}`;
      console.log("📧 [EMAIL] Delivered via Resend:", { to, subject, messageId });
      return { success: true, messageId };
    }

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