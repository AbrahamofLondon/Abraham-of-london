import * as React from "react";

// Lazy-loaded to avoid static import of react-dom/server in App Router.
// The function remains sync because callers return TemplateResult synchronously.
let _renderToStaticMarkup: ((element: React.ReactElement) => string) | null = null;
function getRenderer(): (element: React.ReactElement) => string {
  if (!_renderToStaticMarkup) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _renderToStaticMarkup = require("react-dom/server").renderToStaticMarkup;
  }
  return _renderToStaticMarkup!;
}

import { siteConfig } from "@/config/site";
import ContactEmail from "@/emails/ContactEmail";
import { StrategyRoomAcceptedEmail } from "@/emails/StrategyRoomAccepted";
import { StrategyRoomRestrictedEmail } from "@/emails/StrategyRoomRestricted";
import TeaserEmail from "@/components/emails/TeaserEmail";
import { InnerCircleEmail } from "@/lib/email/templates/InnerCircleEmail";
import { EmailLinks } from "@/lib/email/links";

type TemplateResult = {
  subject: string;
  html: string;
  text: string;
};

type Builder = (data: Record<string, any>) => TemplateResult;

function renderReactEmail(element: React.ReactElement): string {
  return `<!DOCTYPE html>${getRenderer()(element)}`;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderContactInternal(data: Record<string, any>): TemplateResult {
  const subject = data.subject || `New enquiry — ${data.name || "Unknown"}`;
  return {
    subject,
    html: renderReactEmail(
      React.createElement(ContactEmail, {
        name: data.name,
        email: data.email,
        message: data.message,
        subject: data.subject,
        teaserOptIn: data.teaserOptIn,
        newsletterOptIn: data.newsletterOptIn,
        siteUrl: siteConfig.url,
        submittedAt: data.submittedAt,
        ipAnonymized: data.ipAnonymized,
        userAgentSnippet: data.userAgentSnippet,
      }),
    ),
    text: [
      `New website enquiry`,
      `Subject: ${data.subject || "Website contact"}`,
      `Name: ${data.name || "Unknown"}`,
      `Email: ${data.email || "Unknown"}`,
      `Teaser requested: ${data.teaserOptIn ? "Yes" : "No"}`,
      `Newsletter opt-in: ${data.newsletterOptIn ? "Yes" : "No"}`,
      "",
      String(data.message || "").trim(),
    ].join("\n"),
  };
}

function renderContactTeaser(data: Record<string, any>): TemplateResult {
  return {
    subject: "Fathering Without Fear: The First Briefing",
    html: renderReactEmail(
      React.createElement(TeaserEmail, {
        name: data.name,
        siteUrl: siteConfig.url,
      }),
    ),
    text: [
      `Fathering Without Fear`,
      "",
      `Read the teaser: ${EmailLinks.downloads("fathering-without-fear")}`,
      `Contact: ${EmailLinks.contact}`,
    ].join("\n"),
  };
}

function renderInnerCircle(data: Record<string, any>): TemplateResult {
  const isResend = data.mode === "resend";
  return {
    subject: isResend
      ? "Your Canon Inner Circle access link (resent)"
      : "Your Canon Inner Circle access key",
    html: renderReactEmail(
      React.createElement(InnerCircleEmail, {
        name: data.name,
        accessKey: data.accessKey,
        unlockUrl: data.unlockUrl,
        mode: data.mode === "resend" ? "resend" : "register",
      }),
    ),
    text: [
      data.name ? `Dear ${data.name},` : "Hello,",
      "",
      isResend
        ? "As requested, here is your access link to the Canon Inner Circle:"
        : "Thank you for registering for the Inner Circle. This is your personal access key:",
      "",
      String(data.accessKey || ""),
      "",
      `Activate your access: ${String(data.unlockUrl || EmailLinks.innerCircle)}`,
      "",
      "This access key is personal and should not be shared.",
    ].join("\n"),
  };
}

function renderInvite(data: Record<string, any>): TemplateResult {
  const grants = Array.isArray(data.grants) ? data.grants : [];
  const grantText = grants
    .map((g: any) => `- ${String(g.type || "grant")}: ${String(g.key || "")}`)
    .join("\n");
  const expiryText = data.expiresAt
    ? `Expires ${new Date(data.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  return {
    subject: data.subject || "Access Invitation — Abraham of London",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0b0a09;font-family:Georgia,serif;color:#f2f1ee;">
          <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
            <div style="border-bottom:1px solid rgba(201,169,110,0.25);padding-bottom:16px;margin-bottom:32px;">
              <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:#c9a96e;">Abraham of London</span>
            </div>
            <h1 style="font-size:24px;font-weight:300;margin:0 0 16px;">Access Invitation</h1>
            <p style="font-size:15px;line-height:1.7;color:rgba(242,241,238,0.72);margin:0 0 24px;">
              You have been granted access to restricted content. The following entitlements are ready to activate.
            </p>
            <pre style="background:#111;padding:16px;border:1px solid rgba(255,255,255,0.1);color:#f2f1ee;white-space:pre-wrap;">${escapeHtml(grantText)}</pre>
            <p style="margin:24px 0;">
              <a href="${escapeHtml(String(data.inviteUrl || EmailLinks.home))}" style="display:inline-block;padding:14px 28px;border:1px solid rgba(201,169,110,0.35);background:rgba(201,169,110,0.12);color:#c9a96e;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.28em;text-decoration:none;">
                Activate Access
              </a>
            </p>
            ${expiryText ? `<p style="color:#888;font-size:12px;">${escapeHtml(expiryText)}</p>` : ""}
            <p style="font-size:11px;color:rgba(242,241,238,0.35);line-height:1.6;">
              This invitation is bound to <strong style="color:rgba(242,241,238,0.55);">${escapeHtml(
                String(data.recipientEmail || ""),
              )}</strong> and cannot be transferred.
            </p>
          </div>
        </body>
      </html>
    `.trim(),
    text: [
      "You have been granted access to restricted content on Abraham of London.",
      "",
      "Entitlements:",
      grantText,
      "",
      `Activate your access: ${String(data.inviteUrl || EmailLinks.home)}`,
      expiryText,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function renderStrategyRoomAccepted(data: Record<string, any>): TemplateResult {
  return {
    subject: "Strategy Room access confirmed",
    html: renderReactEmail(
      React.createElement(StrategyRoomAcceptedEmail, {
        fullName: data.fullName,
        decisionStatement: data.decisionStatement,
        evidenceTier: data.evidenceTier || null,
        caseId: data.caseId || null,
        directive: data.directive || null,
      }),
    ),
    text: [
      `Strategy Room access confirmed`,
      "",
      data.fullName ? `Principal: ${data.fullName}` : "",
      `Decision: ${String(data.decisionStatement || "")}`,
      "",
      `Open Strategy Room: ${EmailLinks.strategyRoom}`,
      `Purpose Pyramid: ${EmailLinks.downloads("purpose-pyramid-worksheet")}`,
      `Decision Matrix: ${EmailLinks.downloads("decision-matrix-scorecard")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function renderStrategyRoomRestricted(data: Record<string, any>): TemplateResult {
  const reasons: string[] = Array.isArray(data.reasons) ? data.reasons : [];
  const missingEvidence: string[] = Array.isArray(data.missingEvidence) ? data.missingEvidence : [];
  const repairActions: string[] = Array.isArray(data.repairActions) ? data.repairActions : [];
  return {
    subject: "Strategy Room — case recorded, admission restricted",
    html: renderReactEmail(
      React.createElement(StrategyRoomRestrictedEmail, {
        fullName: data.fullName,
        decisionStatement: data.decisionStatement,
        referenceId: String(data.referenceId || ""),
        reasons,
        missingEvidence,
        repairActions,
        returnPath: String(data.returnPath || "/diagnostics"),
      }),
    ),
    text: [
      `Strategy Room — case recorded, admission restricted`,
      "",
      data.fullName ? `Principal: ${data.fullName}` : "",
      `Decision: ${String(data.decisionStatement || "")}`,
      `Reference: ${String(data.referenceId || "")}`,
      "",
      "What is missing:",
      ...missingEvidence.map((e: string) => `  • ${e}`),
      "",
      "Repair actions:",
      ...repairActions.map((a: string) => `  • ${a}`),
      "",
      "Your case has been preserved. You do not need to start again.",
      `Continue building evidence: ${EmailLinks.home}${(data.returnPath || "/diagnostics").replace(/^\//, "")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export const EmailTemplates: Record<string, Builder> = {
  "inner-circle": renderInnerCircle,
  "contact-internal": renderContactInternal,
  "contact-teaser": renderContactTeaser,
  invite: renderInvite,
  "strategy-room-accepted": renderStrategyRoomAccepted,
  "strategy-room-restricted": renderStrategyRoomRestricted,
};

export type EmailTemplateName = keyof typeof EmailTemplates;

export function renderEmailTemplate(
  name: EmailTemplateName,
  data: Record<string, any>,
): TemplateResult {
  const builder = EmailTemplates[name];
  if (!builder) {
    throw new Error(`EMAIL_TEMPLATE_NOT_REGISTERED:${name}`);
  }
  return builder(data);
}
