// lib/email/sendInnerCircleEmail.ts
/* eslint-disable no-console */

import { maskEmail } from "@/lib/security";

export type InnerCircleEmailPayload = {
  email: string;
  name?: string;
  accessKey: string;
  unlockUrl: string;
};

export async function sendInnerCircleEmail(
  payload: InnerCircleEmailPayload,
): Promise<void> {
  const { email, name, accessKey, unlockUrl } = payload;
  const env = process.env.NODE_ENV ?? "development";
  const resendApiKey = process.env.RESEND_API_KEY;

  // Primary admin address (site-level), with hardcoded fallback
  const adminPrimary =
    process.env.SITE_CONTACT_EMAIL || "info@abrahamoflondon.org";
  const adminBackup = "seunadaramola@gmail.com";

  // Ensure we always notify at least one working inbox
  const adminRecipients = Array.from(
    new Set(
      [adminPrimary, adminBackup].filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0,
      ),
    ),
  );

  const safeEmail = maskEmail(email);

  console.log("[InnerCircle] sendInnerCircleEmail called:", {
    email: safeEmail,
    hasName: Boolean(name),
    hasAccessKey: !!accessKey,
    env,
  });

  if (!resendApiKey) {
    console.warn(
      "[InnerCircle] RESEND_API_KEY not set. No emails will be sent.",
    );

    if (env === "production") {
      throw new Error(
        "Email service not configured (RESEND_API_KEY missing).",
      );
    }

    // Dev / non-prod: simulate without leaking full email
    console.log(
      `[InnerCircle][DEV] Would send Inner Circle email to ${safeEmail} (no ESP configured).`,
    );
    console.log(`Unlock URL: ${unlockUrl}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  const html = renderInnerCircleHtml({ name, accessKey, unlockUrl });

  // 1) Email to subscriber
  await resend.emails.send({
    from: `Inner Circle <${adminPrimary}>`,
    to: email,
    subject: "Your Inner Circle Access Key",
    html,
  });

  // 2) Internal notification to admin(s) – primary + backup/fallback
  await resend.emails.send({
    from: `Inner Circle <${adminPrimary}>`,
    to: adminRecipients,
    subject: `New Inner Circle subscriber: ${safeEmail}`,
    html: `
      <p>New Inner Circle signup.</p>
      <p><strong>Email (masked):</strong> ${safeEmail}</p>
      <p><strong>Name:</strong> ${name || "(not provided)"}</p>
    `,
  });

  console.log(
    "[InnerCircle] Emails dispatched to subscriber and admin recipients:",
    adminRecipients.map(maskEmail),
  );
}

export function renderInnerCircleHtml(opts: {
  name?: string;
  accessKey: string;
  unlockUrl: string;
}): string {
  const salutation = opts.name ? `Dear ${opts.name},` : "Dear Builder,";

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#111">
      <p>${salutation}</p>
      <p>Thank you for joining the Inner Circle.</p>
      <p>Your access key is:</p>
      <p style="font-size:16px;font-weight:600;background:#111;color:#facc15;padding:8px 12px;border-radius:6px;display:inline-block;">
        ${opts.accessKey}
      </p>
      <p>You can unlock access on this device by clicking the link below:</p>
      <p>
        <a href="${opts.unlockUrl}" style="display:inline-block;background:#facc15;color:#111;padding:10px 18px;border-radius:999px;font-weight:600;text-decoration:none;">
          Unlock Inner Circle Access
        </a>
      </p>
      <p>If the button above doesn’t work, paste this URL into your browser:</p>
      <p style="word-break:break-all;color:#4b5563;">${opts.unlockUrl}</p>
      <p style="margin-top:24px;color:#4b5563;">
        Under God, for His glory, for generations.
      </p>
      <p>Abraham of London</p>
    </div>
  `;
}