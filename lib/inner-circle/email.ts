/* eslint-disable no-console */
// lib/inner-circle/email.ts

import { sendEmail } from "@/lib/email/dispatcher";

type InnerCircleEmailType = "welcome" | "resend";

export type InnerCircleEmailPayload = {
  to: string;
  type: InnerCircleEmailType;
  data: {
    name: string;
    accessKey: string;
    unlockUrl: string;
  };
};

function subjectFor(type: InnerCircleEmailType): string {
  if (type === "resend") return "Your Inner Circle access key";
  return "Welcome to the Inner Circle - your access key";
}

function buildText(type: InnerCircleEmailType, data: InnerCircleEmailPayload["data"]): string {
  const header =
    type === "resend"
      ? `Hi ${data.name},\n\nHere is your access key again.`
      : `Hi ${data.name},\n\nWelcome - here is your access key.`;

  return [
    header,
    "",
    `Access Key: ${data.accessKey}`,
    `Unlock Link: ${data.unlockUrl}`,
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "- Abraham of London",
  ].join("\n");
}

/**
 * Preferred, structured call:
 * await sendInnerCircleEmail({ to, type, data })
 *
 * Backward-compatible "old signature":
 * await sendInnerCircleEmail(email, key, name?)
 */
export async function sendInnerCircleEmail(
  a: InnerCircleEmailPayload | string,
  b?: string,
  c?: string
): Promise<void> {
  // New signature
  if (typeof a === "object" && a && "to" in a) {
    const payload = a as InnerCircleEmailPayload;
    const subject = subjectFor(payload.type);
    const text = buildText(payload.type, payload.data);

    await sendEmail({
      to: payload.to,
      subject,
      text,
      tags: ["inner-circle", payload.type],
      from: process.env.INNER_CIRCLE_FROM_EMAIL || process.env.MAIL_FROM,
    });

    return;
  }

  // Old signature
  const email = String(a);
  const key = String(b || "");
  const name = c || "Builder";

  const subject = "Your Inner Circle access key";
  const text = buildText("resend", {
    name,
    accessKey: key,
    unlockUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/inner-circle?key=${encodeURIComponent(
      key
    )}`,
  });

  await sendEmail({
    to: email,
    subject,
    text,
    tags: ["inner-circle", "legacy"],
    from: process.env.INNER_CIRCLE_FROM_EMAIL || process.env.MAIL_FROM,
  });
}


