/* eslint-disable no-console */

import type { ReactElement } from "react";
import { Resend } from "resend";

// If you use the React Email template file you posted:
import InnerCircleEmail from "./templates/InnerCircleEmail";

type Mode = "welcome" | "resend";

type NewPayload = {
  to: string | string[];
  type: Mode;
  data: {
    name: string;
    accessKey: string;
    unlockUrl: string;
  };
};

// Old signature support: sendInnerCircleEmail(email, key, name?)
type OldSig = [string, string, string?];

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

function provider(): string {
  return (process.env.EMAIL_PROVIDER || "console").trim().toLowerCase();
}

function fromAddress(): string {
  return (
    process.env.INNER_CIRCLE_FROM_EMAIL ??
    process.env.MAIL_FROM ??
    "Inner Circle <innercircle@abrahamoflondon.org>"
  );
}

function normalizeRecipients(to: string | string[]): string[] {
  const arr = Array.isArray(to) ? to : [to];
  return arr.map((x) => String(x || "").trim()).filter(Boolean);
}

/**
 * Non-prod safety:
 * If MAIL_TO or MAIL_TO_FALLBACK is set, redirect ALL emails there in dev/preview.
 * This prevents accidentally emailing real users during testing.
 */
function applyNonProdRecipientOverride(actual: string[]): string[] {
  if (isProd()) return actual;

  const forced =
    (process.env.MAIL_TO && process.env.MAIL_TO.trim()) ||
    (process.env.MAIL_TO_FALLBACK && process.env.MAIL_TO_FALLBACK.trim());

  if (!forced) return actual;
  return [forced];
}

function subjectFor(type: Mode): string {
  return type === "resend"
    ? "Your Canon Inner Circle access link (resent)"
    : "Your Canon Inner Circle access key";
}

function buildText(type: Mode, data: NewPayload["data"]): string {
  const greeting = data.name ? `Dear ${data.name},` : "Hello,";
  const body =
    type === "resend"
      ? "As requested, here is your access link to the Canon Inner Circle:"
      : "Thank you for registering for the Inner Circle. This is your personal access key:";

  return `
${greeting}

${body}

${data.accessKey}

To activate your access, visit this URL:
${data.unlockUrl}

This access key is personal and should not be shared.

${
  type === "resend"
    ? "This link was resent at your request. If you did not request a new link, please contact support."
    : "If you did not request this access, please ignore this email."
}

Best regards,
The Abraham of London Team
`.trim();
}

async function renderHtmlEmail(props: {
  name?: string;
  accessKey: string;
  unlockUrl: string;
  mode: "register" | "resend";
}): Promise<string> {
  // Avoid bundling surprises: import renderToString only when needed.
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");

  const el: ReactElement = React.createElement(InnerCircleEmail as any, props);
  return renderToString(el);
}

function getResendClient(): Resend | null {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) return null;
  return new Resend(key);
}

/**
 * The only real sender.
 * - Provider "console": logs
 * - Provider "resend": sends via Resend if configured, else falls back to console
 * - Any other provider: falls back to console (fail-safe)
 */
async function dispatchEmail(args: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const safeTo = applyNonProdRecipientOverride(args.to);
  const p = provider();

  if (p === "console") {
    console.log("📧 [InnerCircle Email] (console)", { to: safeTo, subject: args.subject });
    console.log(args.text);
    return;
  }

  if (p === "resend") {
    const resend = getResendClient();
    if (!resend) {
      console.warn("⚠️ [InnerCircle Email] EMAIL_PROVIDER=resend but RESEND_API_KEY missing. Falling back to console.");
      console.log("📧 [InnerCircle Email] (fallback)", { to: safeTo, subject: args.subject });
      console.log(args.text);
      return;
    }

    const result = await resend.emails.send({
      from: fromAddress(),
      to: safeTo,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });

    if ((result as any)?.error) {
      console.warn("⚠️ [InnerCircle Email] Resend send failed. Falling back to console.", (result as any).error);
      console.log("📧 [InnerCircle Email] (fallback)", { to: safeTo, subject: args.subject });
      console.log(args.text);
      return;
    }

    console.log("✅ [InnerCircle Email] Sent", { to: safeTo, id: (result as any)?.data?.id });
    return;
  }

  // Unknown provider → fail-safe
  console.warn(`⚠️ [InnerCircle Email] EMAIL_PROVIDER=${p} not wired. Falling back to console.`);
  console.log("📧 [InnerCircle Email] (fallback)", { to: safeTo, subject: args.subject });
  console.log(args.text);
}

function isNewPayload(x: any): x is NewPayload {
  return x && typeof x === "object" && "to" in x && "type" in x && "data" in x;
}

/**
 * sendInnerCircleEmail supports:
 *  A) New signature:
 *     sendInnerCircleEmail({ to, type, data })
 *  B) Old signature:
 *     sendInnerCircleEmail(email, key, name?)
 */
export async function sendInnerCircleEmail(
  a: NewPayload | OldSig[0],
  b?: OldSig[1],
  c?: OldSig[2]
): Promise<void> {
  // New signature
  if (isNewPayload(a)) {
    const to = normalizeRecipients(a.to);
    const subject = subjectFor(a.type);
    const text = buildText(a.type, a.data);

    // Only render HTML if provider needs it (resend) — else skip cost.
    let html: string | undefined;
    if (provider() === "resend") {
      html = await renderHtmlEmail({
        name: a.data.name,
        accessKey: a.data.accessKey,
        unlockUrl: a.data.unlockUrl,
        mode: a.type === "resend" ? "resend" : "register",
      });
    }

    await dispatchEmail({ to, subject, text, html });
    return;
  }

  // Old signature
  const email = String(a || "").trim();
  const key = String(b || "").trim();
  const name = c ? String(c).trim() : "Builder";

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const unlockUrl = `${site}/inner-circle?key=${encodeURIComponent(key)}`;

  const to = normalizeRecipients(email);
  const subject = subjectFor("resend");
  const text = buildText("resend", { name, accessKey: key, unlockUrl });

  let html: string | undefined;
  if (provider() === "resend") {
    html = await renderHtmlEmail({ name, accessKey: key, unlockUrl, mode: "resend" });
  }

  await dispatchEmail({ to, subject, text, html });
}