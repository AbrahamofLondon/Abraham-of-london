/* eslint-disable no-console */

import { sendEmail } from "@/lib/email/core/sendEmail";

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
type SendProvider = "resend";

export type InnerCircleEmailSendResult = {
  ok: boolean;
  provider: SendProvider;
  error?: string;
};

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
): Promise<InnerCircleEmailSendResult> {
  // New signature
  if (isNewPayload(a)) {
    const to = normalizeRecipients(a.to);
    const subject = subjectFor(a.type);
    return await sendEmail({
      type: "INNER_CIRCLE",
      to,
      subject,
      template: {
        name: "inner-circle",
        data: {
          name: a.data.name,
          accessKey: a.data.accessKey,
          unlockUrl: a.data.unlockUrl,
          mode: a.type === "resend" ? "resend" : "register",
        },
      },
      text: buildText(a.type, a.data),
      from: fromAddress(),
      meta: {
        source: `inner-circle:${a.type}`,
      },
    });
  }

  // Old signature
  const email = String(a || "").trim();
  const key = String(b || "").trim();
  const name = c ? String(c).trim() : "Builder";

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const unlockUrl = `${site}/inner-circle?key=${encodeURIComponent(key)}`;

  const to = normalizeRecipients(email);
  const subject = subjectFor("resend");
  return await sendEmail({
    type: "INNER_CIRCLE",
    to,
    subject,
    template: {
      name: "inner-circle",
      data: {
        name,
        accessKey: key,
        unlockUrl,
        mode: "resend",
      },
    },
    text: buildText("resend", { name, accessKey: key, unlockUrl }),
    from: fromAddress(),
    meta: {
      source: "inner-circle:legacy",
    },
  });
}

