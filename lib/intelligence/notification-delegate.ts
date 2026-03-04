/* lib/intelligence/notification-delegate.ts — Notification Delegate (Institutional) */
import "server-only";

import nodemailer from "nodemailer";

type PriorityInquiry = {
  id: string;
  name?: string | null;
  email: string;
  intent: string;
  metadata?: any;
};

type MemberIdentity = {
  id: string;
  name?: string | null;
  email?: string | null;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`[MAIL_CONFIG]: Missing env ${name}`);
  return v.trim();
}

function optionalEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAppUrl(): string {
  return optionalEnv("NEXT_PUBLIC_APP_URL") || "https://www.abrahamoflondon.org";
}

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = mustEnv("EMAIL_SERVER_HOST");
  const port = Number(optionalEnv("EMAIL_SERVER_PORT") || "587");
  const user = mustEnv("EMAIL_SERVER_USER");
  const pass = mustEnv("EMAIL_SERVER_PASSWORD");

  _transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });

  return _transporter;
}

function getAdminRecipients(): string {
  const recipients = [optionalEnv("ADMIN_NOTIFICATION_EMAIL"), optionalEnv("BACKUP_NOTIFICATION_EMAIL")]
    .filter(Boolean)
    .join(", ");

  if (!recipients) throw new Error("[MAIL_CONFIG]: No admin recipients configured.");
  return recipients;
}

export async function notifyPrincipalOfPriority(inquiry: PriorityInquiry) {
  const transporter = getTransporter();
  const recipients = getAdminRecipients();

  const appUrl = getAppUrl();
  const name = escapeHtml(inquiry.name || "Unknown");
  const email = escapeHtml(inquiry.email);
  const intent = escapeHtml(inquiry.intent);
  const score = escapeHtml(inquiry?.metadata?.priorityScore ?? "N/A");
  const ref = escapeHtml(inquiry.id);

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"AoL Intelligence" <system@abraham-of-london.com>`,
    to: recipients,
    subject: `⚠️ PRIORITY INTAKE: ${name}`,
    html: `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; background: #050505; color: #fff; border: 1px solid #1a1a1a;">
        <h1 style="text-transform: uppercase; letter-spacing: 3px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; color: #f59e0b;">
          Institutional Alert
        </h1>

        <p style="font-size: 10px; color: #777; text-transform: uppercase; font-family: monospace;">
          REF: ${ref} // SCORE: ${score}
        </p>

        <div style="margin-top: 30px; border-left: 2px solid #333; padding-left: 20px;">
          <p style="margin: 5px 0;"><strong style="color: #aaa;">Principal:</strong> ${name}</p>
          <p style="margin: 5px 0;"><strong style="color: #aaa;">Email:</strong> ${email}</p>
          <p style="margin-top: 20px; font-style: italic; color: #ddd; line-height: 1.6;">
            "${intent}"
          </p>
        </div>

        <div style="margin-top: 40px;">
          <a href="${appUrl}/admin/command-wall"
             style="display:inline-block;background:#fff;color:#000;padding:14px 28px;text-decoration:none;font-weight:900;text-transform:uppercase;font-size:10px;letter-spacing:1px;">
             Authenticate & Review
          </a>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendOnboardingWelcome(member: MemberIdentity, rawKey: string) {
  const transporter = getTransporter();
  const appUrl = getAppUrl();

  const toEmail = member.email?.trim();
  if (!toEmail) throw new Error("sendOnboardingWelcome: member.email is required.");

  const name = escapeHtml(member.name || "Principal");
  const safeKey = escapeHtml(rawKey);

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Abraham of London" <vault@abraham-of-london.com>`,
    to: toEmail,
    subject: "Sequence Initialized: Access Authorized",
    html: `
      <div style="font-family: serif; padding: 50px; background: #000; color: #fff;">
        <h2 style="text-transform: uppercase; letter-spacing: 4px; color: #f59e0b;">Authorization Granted</h2>
        <p style="color: #888; font-size: 12px; margin-bottom: 30px;">STRATEGIC_INTELLIGENCE_NETWORK // LEVEL 4</p>

        <p>Principal ${name},</p>
        <p>Your access has been authorized. Use the institutional key below to authenticate your session.</p>

        <div style="background:#111;padding:20px;border:1px solid #333;font-family:monospace;color:#f59e0b;font-size:18px;margin:30px 0;text-align:center;">
          ${safeKey}
        </div>

        <p style="font-size: 11px; color: #555;">SECURITY WARNING: This key is unique to your identity. Do not share or store in unencrypted environments.</p>

        <a href="${appUrl}/auth/login"
           style="display:inline-block;margin-top:30px;background:#fff;color:#000;padding:15px 30px;text-decoration:none;font-weight:bold;text-transform:uppercase;font-size:10px;">
          Enter Strategy Room
        </a>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

export async function notifyPrincipalOfSecurityAction(member: MemberIdentity, action: string) {
  const transporter = getTransporter();

  const toEmail = member.email?.trim();
  if (!toEmail) throw new Error("notifyPrincipalOfSecurityAction: member.email is required.");

  const name = escapeHtml(member.name || "Principal");
  const safeAction = escapeHtml(action);
  const isSuspension = action === "SUSPENSION_DORMANCY";

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"AoL Security" <security@abraham-of-london.com>`,
    to: toEmail,
    subject: isSuspension ? "ACCESS PAUSED: Security Protocol" : "Security Update",
    html: `
      <div style="font-family: serif; padding: 50px; background: #0a0a0a; color: #fff; border: 2px solid #991b1b;">
        <h2 style="text-transform: uppercase; letter-spacing: 2px; color: #ef4444;">Security Alert</h2>
        <p>Principal ${name},</p>
        <p>In accordance with <strong>Institutional Dormancy Policy</strong>, your active session has been paused due to 30+ days of inactivity.</p>

        <div style="margin: 30px 0; padding: 20px; background: #1a1a1a; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-size: 13px; color: #ddd;">ACTION: <strong>${safeAction}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #ddd;">STATUS: <strong>${isSuspension ? "PAUSED" : "UPDATED"}</strong></p>
        </div>

        <p style="font-size: 10px; color: #444; margin-top: 40px;">REF: ${safeAction} // ${escapeHtml(new Date().toISOString())}</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}