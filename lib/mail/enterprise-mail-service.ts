// lib/mail/enterprise-mail-service.ts
import { Resend } from "resend";

const DEFAULT_FROM = "Abraham of London <info@abrahamoflondon.org>";
const DEFAULT_REPLY_TO = "info@abrahamoflondon.org";
const DEFAULT_ADMIN_EMAIL = "info@abrahamoflondon.org";
const DEFAULT_SITE_URL = String(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type MailSuccess = {
  success: true;
  provider: "resend";
  id?: string | null;
};

type MailFailure = {
  success: false;
  provider: "resend";
  error: string;
};

export type MailResult = MailSuccess | MailFailure;

export interface ExecutiveBriefParams {
  email: string;
  organisationName: string;
  campaignTitle: string;
  dashboardUrl: string;
  respondentCount: number;
}

export interface CampaignNudgeParams {
  email: string;
  campaignTitle: string;
  organisationName: string;
  inviteToken: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(value || "").trim());
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

function getResendClient(): Resend | null {
  const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
  return resendApiKey ? new Resend(resendApiKey) : null;
}

async function sendHtmlEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<MailResult> {
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      provider: "resend",
      error: "RESEND_API_KEY is missing.",
    };
  }

  try {
    const response = await resend.emails.send({
      from: args.from || DEFAULT_FROM,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo || DEFAULT_REPLY_TO,
    });

    return {
      success: true,
      provider: "resend",
      id: typeof response?.data?.id === "string" ? response.data.id : null,
    };
  } catch (error) {
    console.error("[enterprise-mail-service] sendHtmlEmail failed:", error);
    return {
      success: false,
      provider: "resend",
      error: "MAIL_SEND_FAILED",
    };
  }
}

export async function sendExecutiveBriefNotification({
  email,
  organisationName,
  campaignTitle,
  dashboardUrl,
  respondentCount,
}: ExecutiveBriefParams): Promise<MailResult> {
  const safeEmail = String(email || "").trim().toLowerCase();
  const safeOrg = escapeHtml(organisationName);
  const safeCampaign = escapeHtml(campaignTitle);
  const safeUrl = String(dashboardUrl || "").trim();
  const safeCount = Number.isFinite(respondentCount) ? respondentCount : 0;

  if (!isValidEmail(safeEmail)) {
    return { success: false, error: "INVALID_EMAIL" };
  }

  if (!safeUrl) {
    return { success: false, error: "MISSING_DASHBOARD_URL" };
  }

  const date = formatDate();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Institutional Coherence Brief</title>
      </head>
      <body style="margin:0;padding:40px;background:#f9f7f2;color:#2c2416;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:60px;border:1px solid #e8e0d4;">
          <div style="border-bottom:1px solid #e8e0d4;padding-bottom:30px;margin-bottom:40px;">
            <div style="font-family:monospace;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#8a6a2f;">
              Protocol 75 // Intelligence Dispatch
            </div>
            <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:28px;font-style:italic;color:#1a1a1a;">
              Institutional Coherence Brief
            </h1>
          </div>

          <div style="font-family:monospace;font-size:11px;line-height:1.8;color:#9b8a6b;margin-bottom:30px;">
            <strong>TO:</strong> Executive Leadership Core<br />
            <strong>FROM:</strong> Abraham of London<br />
            <strong>REF:</strong> ${safeOrg.toUpperCase().replace(/[^A-Z0-9-]/g, "-")}-ALGN-2026<br />
            <strong>DATE:</strong> ${escapeHtml(date)}
          </div>

          <div style="font-size:14px;line-height:1.7;color:#4a3e2c;">
            <p>
              The institutional alignment survey for
              <strong>${safeCampaign}</strong>
              has surpassed the required threshold of
              <strong>${safeCount} respondents</strong>.
            </p>

            <p>
              The diagnostic view is now mature enough for executive review.
              Structural variance, leadership gaps, and institutional drag can now be examined with far better fidelity than instinct alone permits.
            </p>

            <p>
              The restricted dashboard is ready for review.
            </p>
          </div>

          <div style="margin-top:50px;text-align:center;">
            <a
              href="${escapeHtml(safeUrl)}"
              style="display:inline-block;background:#1a1a1a;color:#f9f7f2 !important;padding:18px 35px;text-decoration:none;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:.2em;"
            >
              Access Intelligence Suite
            </a>
          </div>

          <div style="margin-top:60px;padding-top:30px;border-top:1px solid #e8e0d4;font-size:10px;color:#c0b190;font-family:monospace;">
            © 2026 Abraham of London<br />
            CONFIDENTIAL // AUTHORIZED ACCESS ONLY
          </div>
        </div>
      </body>
    </html>
  `;

  return sendHtmlEmail({
    to: safeEmail,
    subject: `RESTRICTED: Intelligence Brief // ${organisationName}`,
    html,
  });
}

export async function sendCampaignNudgeEmail({
  email,
  campaignTitle,
  organisationName,
  inviteToken,
}: CampaignNudgeParams): Promise<MailResult> {
  const safeEmail = String(email || "").trim().toLowerCase();
  const safeCampaign = escapeHtml(campaignTitle);
  const safeOrg = escapeHtml(organisationName);
  const safeToken = String(inviteToken || "").trim();

  if (!isValidEmail(safeEmail)) {
    return { success: false, error: "INVALID_EMAIL" };
  }

  if (!safeToken) {
    return { success: false, error: "MISSING_INVITE_TOKEN" };
  }

  const accessUrl = `${DEFAULT_SITE_URL}/alignment/enterprise/respond?token=${encodeURIComponent(
    safeToken
  )}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Campaign Reminder</title>
      </head>
      <body style="margin:0;padding:40px;background:#0a0a0a;color:#f5f5f5;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#111111;border:1px solid #262626;padding:48px;">
          <div style="font-family:monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#d4af37;margin-bottom:18px;">
            Enterprise Alignment Reminder
          </div>

          <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-style:italic;color:#ffffff;">
            Your response is still pending
          </h1>

          <p style="font-size:15px;line-height:1.7;color:#d4d4d4;">
            You were invited to complete the alignment instrument for
            <strong style="color:#ffffff;">${safeCampaign}</strong>
            under
            <strong style="color:#ffffff;">${safeOrg}</strong>.
          </p>

          <p style="font-size:15px;line-height:1.7;color:#d4d4d4;">
            If you have already completed it, ignore this note. If not, this is the cleanest time to finish the task before attention fragments and the signal degrades.
          </p>

          <div style="margin-top:32px;">
            <a
              href="${escapeHtml(accessUrl)}"
              style="display:inline-block;background:#d4af37;color:#111111 !important;padding:16px 24px;text-decoration:none;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:.2em;font-weight:700;"
            >
              Complete Assessment
            </a>
          </div>

          <div style="margin-top:36px;padding-top:24px;border-top:1px solid #262626;font-size:11px;color:#8a8a8a;font-family:monospace;">
            Abraham of London // Alignment Infrastructure
          </div>
        </div>
      </body>
    </html>
  `;

  return sendHtmlEmail({
    to: safeEmail,
    subject: `Reminder: ${campaignTitle}`,
    html,
  });
}

export async function sendInternalAccessRequestNotification(args: {
  userEmail: string;
  assetTitle: string;
  slug: string;
}): Promise<MailResult> {
  const safeEmail = String(args.userEmail || "").trim().toLowerCase();
  const safeTitle = escapeHtml(args.assetTitle);
  const safeSlug = escapeHtml(args.slug);

  if (!isValidEmail(safeEmail)) {
    return { success: false, error: "INVALID_EMAIL" };
  }

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:auto;padding:40px;background-color:#000;color:#fff;border:1px solid #333;">
      <h2 style="font-weight:300;letter-spacing:.2em;text-transform:uppercase;color:#fff;">
        Institutional Request
      </h2>
      <hr style="border:0;border-top:1px solid #222;margin:20px 0;" />
      <p style="color:#888;font-size:14px;line-height:1.6;">
        A request for access has been initiated for the following intelligence asset:
      </p>
      <div style="background:#111;padding:20px;border-left:2px solid #fff;margin:20px 0;">
        <strong style="display:block;color:#fff;">${safeTitle}</strong>
        <span style="color:#555;font-size:12px;">ID: ${safeSlug}</span>
      </div>
      <p style="color:#888;font-size:14px;">
        <strong>Requester:</strong> ${escapeHtml(safeEmail)}
      </p>
      <hr style="border:0;border-top:1px solid #222;margin:40px 0;" />
      <p style="font-size:10px;color:#444;text-transform:uppercase;letter-spacing:.1em;">
        Abraham of London © 2026 Registry
      </p>
    </div>
  `;

  return sendHtmlEmail({
    to: DEFAULT_ADMIN_EMAIL,
    subject: `[ACCESS REQUEST] ${args.assetTitle}`,
    html,
  });
}
