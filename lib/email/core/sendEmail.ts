import { Resend } from "resend";

import type { EmailTemplateName } from "@/lib/email/templates";
import { renderEmailTemplate } from "@/lib/email/templates";

export type SendEmailInput = {
  type:
    | "CONTACT"
    | "INNER_CIRCLE"
    | "INVITE"
    | "ENTERPRISE"
    | "SYSTEM"
    | "TRANSACTIONAL";
  to: string | string[];
  subject?: string;
  template?: {
    name: EmailTemplateName;
    data: Record<string, any>;
  };
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  react?: any;
  meta?: {
    userId?: string;
    journeyId?: string;
    source?: string;
  };
};

export type SendEmailResult = {
  ok: boolean;
  provider: "resend";
  error?: string;
  id?: string;
};

function normalizeList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const arr = (Array.isArray(value) ? value : [value])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

function defaultFrom(type: SendEmailInput["type"]): string {
  if (type === "INNER_CIRCLE") {
    return (
      process.env.INNER_CIRCLE_FROM_EMAIL?.trim() ||
      process.env.MAIL_FROM?.trim() ||
      "Inner Circle <innercircle@abrahamoflondon.org>"
    );
  }

  return (
    process.env.MAIL_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "Abraham of London <info@abrahamoflondon.org>"
  );
}

function redactRecipients(value: string[]): string[] {
  return value.map((email) => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

function logAudit(payload: {
  type: SendEmailInput["type"];
  to: string[];
  template?: string;
  subject: string;
  success: boolean;
  error?: string;
  meta?: SendEmailInput["meta"];
}) {
  console.info("[EMAIL_SEND_AUDIT]", {
    type: payload.type,
    to: redactRecipients(payload.to),
    template: payload.template || null,
    subject: payload.subject,
    success: payload.success,
    error: payload.error || null,
    timestamp: new Date().toISOString(),
    meta: payload.meta || null,
  });
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = normalizeList(input.to);
  if (!to?.length) {
    logAudit({
      type: input.type,
      to: [],
      template: input.template?.name,
      subject: input.subject || "",
      success: false,
      error: "EMAIL_RECIPIENT_MISSING",
      meta: input.meta,
    });
    return { ok: false, provider: "resend", error: "EMAIL_RECIPIENT_MISSING" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logAudit({
      type: input.type,
      to,
      template: input.template?.name,
      subject: input.subject || "",
      success: false,
      error: "RESEND_API_KEY_MISSING",
      meta: input.meta,
    });
    return { ok: false, provider: "resend", error: "RESEND_API_KEY_MISSING" };
  }

  const rendered = input.template
    ? renderEmailTemplate(input.template.name, input.template.data)
    : null;

  const subject = String(input.subject || rendered?.subject || "").trim();
  const html = input.html || rendered?.html;
  const text = input.text || rendered?.text;

  if (!subject || (!html && !text && !input.react)) {
    const error = "EMAIL_CONTENT_INCOMPLETE";
    logAudit({
      type: input.type,
      to,
      template: input.template?.name,
      subject,
      success: false,
      error,
      meta: input.meta,
    });
    return { ok: false, provider: "resend", error };
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: input.from || defaultFrom(input.type),
      to,
      subject,
      html,
      text,
      react: input.react,
      replyTo: normalizeList(input.replyTo),
      cc: normalizeList(input.cc),
      bcc: normalizeList(input.bcc),
    });

    const error = (response as any)?.error?.message || (response as any)?.error;
    if (error) {
      logAudit({
        type: input.type,
        to,
        template: input.template?.name,
        subject,
        success: false,
        error: String(error),
        meta: input.meta,
      });
      return { ok: false, provider: "resend", error: String(error) };
    }

    logAudit({
      type: input.type,
      to,
      template: input.template?.name,
      subject,
      success: true,
      meta: input.meta,
    });
    return {
      ok: true,
      provider: "resend",
      id: typeof (response as any)?.data?.id === "string" ? (response as any).data.id : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "EMAIL_SEND_FAILED";
    logAudit({
      type: input.type,
      to,
      template: input.template?.name,
      subject,
      success: false,
      error: message,
      meta: input.meta,
    });
    return { ok: false, provider: "resend", error: message };
  }
}
