import { sendEmail as sendCoreEmail } from "@/lib/email/core/sendEmail";

export type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
};

export type EmailSendResult = {
  ok: boolean;
  provider: "resend";
  error?: string;
};

export async function sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
  return sendCoreEmail({
    type: "SYSTEM",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    from: input.from,
    replyTo: input.replyTo,
    meta: {
      source: input.tags?.join(",") || "dispatcher",
    },
  });
}

export function emailHealthSnapshot() {
  return {
    provider: "resend" as const,
    from:
      process.env.INNER_CIRCLE_FROM_EMAIL ||
      process.env.MAIL_FROM ||
      "no-reply@abrahamoflondon.org",
    isProd: process.env.NODE_ENV === "production",
    hasResendApiKey: Boolean((process.env.RESEND_API_KEY || "").trim()),
  };
}
