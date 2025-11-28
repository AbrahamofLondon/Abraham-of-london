// lib/email/sendInnerCircleEmail.ts
/* eslint-disable no-console */

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

  // If no ESP configured, just log. This way you still see the key + link in logs.
  if (!process.env.RESEND_API_KEY && env !== "test") {
    console.log(
      `[InnerCircle] Would send email to ${email} (no ESP configured).`,
    );
    console.log(`Name: ${name || "N/A"}`);
    console.log(`Access key: ${accessKey}`);
    console.log(`Unlock URL: ${unlockUrl}`);
    return;
  }

  // OPTIONAL: hook up Resend when you're ready
  /*
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Inner Circle <info@abrahamoflondon.org>",
    to: email,
    subject: "Your Inner Circle Access Key",
    html: renderInnerCircleHtml({ name, accessKey, unlockUrl }),
  });
  */
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