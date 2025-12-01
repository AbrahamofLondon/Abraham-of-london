// netlify/functions/_email.ts
/**
 * Centralised email delivery module for Netlify Functions.
 * Exports a single stable function: sendAppEmail()
 *
 * All other serverless functions depend on this.
 */

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

// ---------------------------------------------------------------------------
// Default sender resolution
// ---------------------------------------------------------------------------

function getDefaultSender() {
  return (
    process.env.MAIL_FROM ||
    process.env.MAIL_TO ||
    "no-reply@abrahamoflondon.org"
  );
}

function getPrimaryRecipient() {
  return process.env.MAIL_TO_PRIMARY || process.env.MAIL_TO || "";
}

function getFallbackRecipient() {
  return process.env.MAIL_TO_FALLBACK || "";
}

// ---------------------------------------------------------------------------
// Placeholder provider until you plug in your actual service
// Supports production providers or console fallback
// ---------------------------------------------------------------------------

async function deliverEmail(
  to: string[],
  sender: string,
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResult> {
  try {
    const provider = process.env.EMAIL_PROVIDER || "console";

    // === FUTURE HOOK: RESEND, SENDGRID, SMTP, ETC ===
    if (provider === "console") {
      console.log("📧 [EMAIL] Delivery (console mode):", {
        provider,
        from: sender,
        to,
        subject,
        htmlLength: html.length,
        textLength: text.length,
      });

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    }

    // Add real provider logic here (Resend, SendGrid, etc.)
    // e.g.
    // await resend.emails.send({ from: sender, to, subject, html, text });

    return {
      success: true,
      messageId: `provider-${Date.now()}`,
    };
  } catch (err) {
    console.error("Email sending failure:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: sendAppEmail()
// ---------------------------------------------------------------------------

export async function sendAppEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const sender = getDefaultSender();
  const primary = getPrimaryRecipient();
  const fallback = getFallbackRecipient();

  const recipients: string[] = [];

  // explicit override
  if (params.to) {
    if (Array.isArray(params.to)) recipients.push(...params.to);
    else recipients.push(params.to);
  }

  // auto-primary + fallback
  if (primary) recipients.push(primary);
  if (fallback) recipients.push(fallback);

  // final dedupe
  const to = [...new Set(recipients)];

  if (to.length === 0) {
    console.warn("⚠️ [EMAIL] No recipients configured");
    return {
      success: false,
      error: "No recipients configured",
    };
  }

  return deliverEmail(to, sender, params.subject, params.html, params.text);
}