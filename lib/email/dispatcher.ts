/* eslint-disable no-console */
// lib/email/dispatcher.ts
import { safeSlice } from "@/lib/utils/safe";

export type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
};

type ProviderName = "console" | "netlify" | "none";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function getProvider(): ProviderName {
  const p = (process.env.EMAIL_PROVIDER || "console").toLowerCase().trim();
  if (p === "netlify") return "netlify";
  if (p === "none") return "none";
  return "console";
}

function getFrom(): string {
  // Inner Circle can have its own from; otherwise global mail from.
  const from =
    process.env.INNER_CIRCLE_FROM_EMAIL ||
    process.env.MAIL_FROM ||
    "no-reply@abrahamoflondon.org";
  return String(from).trim();
}

function getSafeRecipient(originalTo: string): string {
  // In non-prod, optionally redirect outbound mail to a safe inbox.
  if (isProd()) return originalTo;

  const forced =
    (process.env.MAIL_TO && process.env.MAIL_TO.trim()) ||
    (process.env.MAIL_TO_FALLBACK && process.env.MAIL_TO_FALLBACK.trim());

  if (forced) return forced;

  return originalTo;
}

function assertBasic(input: EmailSendInput): void {
  if (!input.to || typeof input.to !== "string") throw new Error("Email 'to' is required");
  if (!input.subject || typeof input.subject !== "string") throw new Error("Email 'subject' is required");
  if (!input.text || typeof input.text !== "string") throw new Error("Email 'text' is required");
}

async function sendViaConsole(input: EmailSendInput): Promise<void> {
  const to = getSafeRecipient(input.to);
  const from = input.from || getFrom();

  console.log("📧 [Email:console]", {
    to,
    from,
    subject: input.subject,
    tags: input.tags || [],
    mode: isProd() ? "prod" : "non-prod",
  });
  console.log(input.text);
  if (input.html) console.log("[html]\n", input.html);
}

async function sendViaNetlify(input: EmailSendInput): Promise<void> {
  /**
   * IMPORTANT:
   * Netlify "emails" capabilities vary depending on your setup/add-on.
   * So we do NOT guess endpoints. You must set:
   * - NETLIFY_EMAILS_ENDPOINT
   * - NETLIFY_EMAILS_PROVIDER_API_KEY
   *
   * If missing, we fail-safe to console.
   */
  const endpoint = (process.env.NETLIFY_EMAILS_ENDPOINT || "").trim();
  const apiKey = (process.env.NETLIFY_EMAILS_PROVIDER_API_KEY || "").trim();

  if (!endpoint || !apiKey) {
    console.warn(
      "⚠️ [Email:netlify] NETLIFY_EMAILS_ENDPOINT or NETLIFY_EMAILS_PROVIDER_API_KEY missing. Falling back to console."
    );
    return sendViaConsole(input);
  }

  const to = getSafeRecipient(input.to);
  const from = input.from || getFrom();

  const payload = {
    to,
    from,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    tags: input.tags || [],
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("⚠️ [Email:netlify] send failed. Falling back to console.", {
      status: res.status,
      body: safeSlice(body, 0, 300),
    });
    return sendViaConsole(input);
  }
}

export async function sendEmail(input: EmailSendInput): Promise<void> {
  assertBasic(input);

  const provider = getProvider();

  // "none" means: do nothing but still don't fail hard (useful in dev pipelines)
  if (provider === "none") {
    if (!isProd()) {
      console.log("📧 [Email:none] Skipped send (EMAIL_PROVIDER=none)", {
        to: getSafeRecipient(input.to),
        subject: input.subject,
      });
    }
    return;
  }

  if (provider === "netlify") return sendViaNetlify(input);
  return sendViaConsole(input);
}

export function emailHealthSnapshot() {
  return {
    provider: getProvider(),
    from: getFrom(),
    isProd: isProd(),
    hasMailToOverride: Boolean((process.env.MAIL_TO || "").trim() || (process.env.MAIL_TO_FALLBACK || "").trim()),
    hasNetlifyApiKey: Boolean((process.env.NETLIFY_EMAILS_PROVIDER_API_KEY || "").trim()),
    hasNetlifyEndpoint: Boolean((process.env.NETLIFY_EMAILS_ENDPOINT || "").trim()),
  };
}


