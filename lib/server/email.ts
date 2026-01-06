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

async function deliverEmail(
  to: string[],
  sender: string,
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResult> {
  try {
    const provider = process.env.EMAIL_PROVIDER || "console";

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

    // TODO: plug a real provider here (Resend/SendGrid/SMTP)
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

export async function sendAppEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const sender = getDefaultSender();
  const primary = getPrimaryRecipient();
  const fallback = getFallbackRecipient();

  const recipients: string[] = [];

  // explicit override => ONLY send to that address(es)
  if (params.to) {
    if (Array.isArray(params.to)) recipients.push(...params.to);
    else recipients.push(params.to);

    const to = [...new Set(recipients)];
    if (to.length === 0) return { success: false, error: "No recipients configured" };
    return deliverEmail(to, sender, params.subject, params.html, params.text);
  }

  // otherwise: auto-primary + fallback (site contact forms etc.)
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

