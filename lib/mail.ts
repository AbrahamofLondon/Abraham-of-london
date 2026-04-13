import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || "";

type MailSendResult = {
  success: boolean;
  id?: string | null;
  error?: string;
};

type ExecutiveBriefParams = {
  email: string;
  organisationName: string;
  campaignTitle: string;
  dashboardUrl: string;
  respondentCount: number;
};

type CampaignNudgeParams = {
  email: string;
  campaignTitle: string;
  organisationName: string;
  inviteToken: string;
};

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY_MISSING");
  }

  return new Resend(RESEND_API_KEY);
}

function requiredEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback) return fallback;
  throw new Error(`${name}_MISSING`);
}

function splitEmails(input: string): string[] {
  return String(input || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueEmails(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(email || "").trim());
}

function sanitizeRecipientList(values: string[]): string[] {
  return uniqueEmails(values).filter(isValidEmail);
}

/**
 * Primary sender identity.
 * Keep this on the verified Abraham of London domain.
 *
 * You may override with MAIL_FROM, but do not casually replace this
 * with Gmail/Outlook unless your provider explicitly allows it.
 */
function getMailFrom(): string {
  return requiredEnv(
    "MAIL_FROM",
    "Abraham of London <info@abrahamoflondon.org>"
  );
}

/**
 * Backup reply-to chain.
 * Safe place to include non-domain mailboxes.
 */
function getDefaultReplyToList(): string[] {
  const envList = splitEmails(process.env.MAIL_REPLY_TO || "");
  const fallback = [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com",
  ];

  return sanitizeRecipientList([...envList, ...fallback]);
}

/**
 * Where access requests should be delivered.
 * Includes backups so a domain-specific issue does not blindside you.
 */
function getAccessRequestRecipients(): string[] {
  const envList = splitEmails(process.env.ACCESS_REQUEST_TO || "");
  const fallback = [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com",
  ];

  return sanitizeRecipientList([...envList, ...fallback]);
}

/**
 * Optional ops / monitoring recipients for sensitive notifications.
 */
function getOpsRecipients(): string[] {
  const envList = splitEmails(process.env.MAIL_OPS_TO || "");
  const fallback = [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com",
  ];

  return sanitizeRecipientList([...envList, ...fallback]);
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://www.abrahamoflondon.org"
  ).replace(/\/+$/, "");
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function sendHtmlEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}): Promise<MailSendResult> {
  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY_MISSING");
    }

    const to = sanitizeRecipientList(
      Array.isArray(args.to) ? args.to : [args.to]
    );

    const cc = sanitizeRecipientList(
      Array.isArray(args.cc) ? args.cc : args.cc ? [args.cc] : []
    );

    const bcc = sanitizeRecipientList(
      Array.isArray(args.bcc) ? args.bcc : args.bcc ? [args.bcc] : []
    );

    const replyTo = sanitizeRecipientList(
      Array.isArray(args.replyTo)
        ? args.replyTo
        : args.replyTo
        ? [args.replyTo]
        : getDefaultReplyToList()
    );

    if (!to.length) {
      throw new Error("MAIL_TO_MISSING");
    }

    const response = await getResendClient().emails.send({
      from: args.from || getMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      replyTo: replyTo.length ? replyTo : undefined,
      subject: args.subject,
      html: args.html,
    });

    return {
      success: true,
      id: typeof response?.data?.id === "string" ? response.data.id : null,
    };
  } catch (error) {
    console.error("[MAIL_SEND_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "MAIL_SEND_FAILED",
    };
  }
}

export async function sendAccessRequestEmail(
  userEmail: string,
  assetTitle: string,
  slug: string
): Promise<MailSendResult> {
  const safeUserEmail = escapeHtml(userEmail);
  const safeTitle = escapeHtml(assetTitle);
  const safeSlug = escapeHtml(slug);

  const replyTo = sanitizeRecipientList([
    userEmail,
    ...getDefaultReplyToList(),
  ]);

  return sendHtmlEmail({
    to: getAccessRequestRecipients(),
    subject: `[ACCESS REQUEST] ${assetTitle}`,
    replyTo,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: auto; padding: 40px; background-color: #000; color: #fff; border: 1px solid #333;">
        <h2 style="font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; color: #fff; margin: 0 0 16px;">
          Institutional Request
        </h2>
        <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
        <p style="color: #888; font-size: 14px; line-height: 1.6;">
          A request for access has been initiated for the following intelligence brief:
        </p>
        <div style="background: #111; padding: 20px; border-left: 2px solid #fff; margin: 20px 0;">
          <strong style="display: block; color: #fff;">${safeTitle}</strong>
          <span style="color: #555; font-size: 12px;">ID: ${safeSlug}</span>
        </div>
        <p style="color: #888; font-size: 14px;">
          <strong>Requester:</strong> ${safeUserEmail}
        </p>
        <hr style="border: 0; border-top: 1px solid #222; margin: 40px 0;" />
        <p style="font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 0.1em;">
          Abraham of London &copy; 2026 Registry
        </p>
      </div>
    `,
  });
}

export async function sendExecutiveBriefNotification({
  email,
  organisationName,
  campaignTitle,
  dashboardUrl,
  respondentCount,
}: ExecutiveBriefParams): Promise<MailSendResult> {
  const date = formatDate();

  return sendHtmlEmail({
    to: email,
    bcc: getOpsRecipients(),
    replyTo: getDefaultReplyToList(),
    subject: `RESTRICTED: Intelligence Brief // ${organisationName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Institutional Coherence Brief</title>
        </head>
        <body style="font-family: Inter, Arial, sans-serif; background-color: #f9f7f2; margin: 0; padding: 40px; color: #2c2416;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 60px; border: 1px solid #e8e0d4;">
            <div style="border-bottom: 1px solid #e8e0d4; padding-bottom: 30px; margin-bottom: 40px;">
              <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #8a6a2f;">
                Protocol 75 // Intelligence Dispatch
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 28px; margin-top: 10px; color: #1a1a1a;">
                Institutional Coherence Brief
              </h1>
            </div>

            <div style="font-family: monospace; font-size: 11px; line-height: 1.8; color: #9b8a6b; margin-bottom: 30px;">
              <strong>TO:</strong> Executive Leadership Core<br />
              <strong>FROM:</strong> Abraham of London<br />
              <strong>REF:</strong> ${escapeHtml(organisationName.toUpperCase())}-ALGN-2026<br />
              <strong>DATE:</strong> ${date}
            </div>

            <div style="font-size: 14px; line-height: 1.6; color: #4a3e2c;">
              <p>
                The institutional alignment survey for
                <strong> ${escapeHtml(campaignTitle)} </strong>
                has surpassed the required threshold of
                <strong> ${respondentCount} respondents</strong>.
              </p>

              <p>
                The institutional reading has now been consolidated into an executive brief.
                Structural variances now warrant review before the next operating cycle hardens bad assumptions into policy.
              </p>

              <p>
                The restricted dashboard and digital artifact are now available for forensic analysis.
              </p>
            </div>

            <div style="margin-top: 50px; text-align: center;">
              <a href="${escapeHtml(dashboardUrl)}" style="background-color: #1a1a1a; color: #f9f7f2 !important; padding: 18px 35px; text-decoration: none; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.2em; display: inline-block;">
                Access Intelligence Suite
              </a>
            </div>

            <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #e8e0d4; font-size: 10px; color: #c0b190; font-family: monospace;">
              © 2026 Abraham of London<br />
              CONFIDENTIAL // AUTHORIZED ACCESS ONLY
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendCampaignNudgeEmail({
  email,
  campaignTitle,
  organisationName,
  inviteToken,
}: CampaignNudgeParams): Promise<MailSendResult> {
  const assessmentUrl = `${getBaseUrl()}/enterprise/assessment/${encodeURIComponent(
    inviteToken
  )}`;

  return sendHtmlEmail({
    to: email,
    bcc: getOpsRecipients(),
    replyTo: getDefaultReplyToList(),
    subject: `Reminder: ${organisationName} alignment survey still pending`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; padding: 40px; color: #111827;">
        <div style="margin-bottom: 24px;">
          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: #9ca3af;">
            Alignment Campaign Reminder
          </div>
          <h1 style="font-family: Georgia, serif; font-size: 30px; line-height: 1.1; margin: 12px 0 0; color: #111827;">
            A reminder, not a nuisance.
          </h1>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #374151;">
          Your response for <strong>${escapeHtml(campaignTitle)}</strong> under
          <strong> ${escapeHtml(organisationName)}</strong> is still pending.
        </p>

        <p style="font-size: 15px; line-height: 1.7; color: #374151;">
          These exercises only become useful when enough people complete them honestly.
          No theatre. Just signal.
        </p>

        <div style="margin: 32px 0;">
          <a href="${escapeHtml(
            assessmentUrl
          )}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 14px 24px; font-size: 12px; font-family: monospace; letter-spacing: 0.16em; text-transform: uppercase;">
            Complete Assessment
          </a>
        </div>

        <p style="font-size: 13px; line-height: 1.7; color: #6b7280;">
          If you have already completed it recently, you can ignore this reminder.
        </p>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

        <p style="font-size: 10px; color: #9ca3af; font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase;">
          Abraham of London // Institutional Alignment
        </p>
      </div>
    `,
  });
}
