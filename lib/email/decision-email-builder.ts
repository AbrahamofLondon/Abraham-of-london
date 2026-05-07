import "server-only";

type DecisionTrajectory = "executing" | "stalled" | "fragile" | "deteriorating";

type DecisionEmailBuilderInput = {
  trajectory: DecisionTrajectory;
  secureLink: string;
  unsubscribeUrl: string;
  deleteUrl: string;
  lastActivityAt?: Date | string | null;
};

export type DecisionEmailClass =
  | "session_continuation"
  | "decision_drift"
  | "return_brief"
  | "critical_pattern";

export type BuiltDecisionEmail = {
  emailClass: DecisionEmailClass;
  toneKey: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function footerText(unsubscribeUrl: string, deleteUrl: string): string {
  return [
    "",
    "This system tracks decisions, not behaviour.",
    "Your data is private and can be removed at any time.",
    `Unsubscribe: ${unsubscribeUrl}`,
    `Delete link: ${deleteUrl}`,
  ].join("\n");
}

function footerHtml(unsubscribeUrl: string, deleteUrl: string): string {
  return `
<div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
  <p style="margin:0;font-family:monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.24);">Abraham of London · Decision Integrity System</p>
  <p style="margin:10px 0 0;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.42);">This system tracks decisions, not behaviour.</p>
  <p style="margin:4px 0 0;font-size:12px;line-height:1.7;color:rgba(255,255,255,0.42);">Your data is private and can be removed at any time.</p>
  <p style="margin:10px 0 0;font-family:monospace;font-size:9px;letter-spacing:0.04em;color:rgba(255,255,255,0.20);">
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:rgba(255,255,255,0.32);text-decoration:underline;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="${escapeHtml(deleteUrl)}" style="color:rgba(255,255,255,0.32);text-decoration:underline;">Delete data</a>
  </p>
</div>`;
}

function shellHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background-color:#0B0B0B;color:#F5F5F5;font-family:Georgia,serif;">
<div style="max-width:520px;margin:0 auto;padding:48px 24px;">
${content}
</div>
</body>
</html>`;
}

function trajectoryTone(trajectory: DecisionTrajectory): string {
  switch (trajectory) {
    case "deteriorating":
      return "deteriorating";
    case "fragile":
      return "fragile";
    case "stalled":
      return "stalled";
    default:
      return "executing";
  }
}

export function buildSessionContinuationEmail(
  input: DecisionEmailBuilderInput,
): BuiltDecisionEmail {
  const subject = "Your decision record";

  const text = [
    "You assessed a decision earlier.",
    "",
    "Your decision record remains open.",
    "Your current reading is available behind your secure link.",
    "",
    "If you intend to act on this, continue here:",
    input.secureLink,
    "",
    "If not, leave it. The system will reflect that over time.",
    footerText(input.unsubscribeUrl, input.deleteUrl),
  ].filter(Boolean).join("\n");

  const html = shellHtml(`
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.72);">You assessed a decision earlier.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.46);margin-top:16px;">Your decision record remains open.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.46);margin-top:18px;">Your current reading is available behind your secure link.</p>
<a href="${escapeHtml(input.secureLink)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Continue</a>
<p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.38);margin-top:20px;">If not, leave it. The system will reflect that over time.</p>
${footerHtml(input.unsubscribeUrl, input.deleteUrl)}
`);

  return {
    emailClass: "session_continuation",
    toneKey: "session_continuation",
    subject,
    html,
    text,
  };
}

export function buildDecisionDriftEmail(
  input: DecisionEmailBuilderInput,
): BuiltDecisionEmail {
  const subject = "You said you would act on this";
  const lastActivity = formatDate(input.lastActivityAt);

  const text = [
    "You indicated that you would move on this decision.",
    "",
    "There has been no recorded action.",
    lastActivity ? `Last recorded activity: ${lastActivity}` : null,
    "",
    "Your unresolved decision remains open.",
    "Your current reading is available behind your secure link.",
    "",
    "If you are going to act, do it deliberately:",
    input.secureLink,
    "",
    "If not, accept that the current structure will hold.",
    footerText(input.unsubscribeUrl, input.deleteUrl),
  ].filter(Boolean).join("\n");

  const html = shellHtml(`
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.72);">You indicated that you would move on this decision.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:16px;">There has been no recorded action.${lastActivity ? ` Last recorded activity: ${escapeHtml(lastActivity)}.` : ""}</p>
<p style="font-size:15px;line-height:1.7;color:#C9A96E;margin-top:18px;"><strong>Your unresolved decision remains open.</strong></p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">Your current reading is available behind your secure link.</p>
<a href="${escapeHtml(input.secureLink)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Act deliberately</a>
<p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.38);margin-top:20px;">If not, accept that the current structure will hold.</p>
${footerHtml(input.unsubscribeUrl, input.deleteUrl)}
`);

  return {
    emailClass: "decision_drift",
    toneKey: `decision_drift:${trajectoryTone(input.trajectory)}`,
    subject,
    html,
    text,
  };
}

export function buildReturnBriefEmail(
  input: DecisionEmailBuilderInput,
): BuiltDecisionEmail {
  const subject = "This is starting to deteriorate";

  const text = [
    "This decision has now shifted state.",
    "",
    "It is no longer stable.",
    "",
    "Your current reading is available behind your secure link.",
    "What changes is the cost of delay.",
    "",
    "A full reading has been prepared:",
    input.secureLink,
    "",
    "At this point, you either resolve this,",
    "or the system will continue to degrade around it.",
    footerText(input.unsubscribeUrl, input.deleteUrl),
  ].filter(Boolean).join("\n");

  const html = shellHtml(`
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.72);">This decision has now shifted state.</p>
<p style="font-size:15px;line-height:1.7;color:rgba(252,153,153,0.82);margin-top:18px;"><strong>It is no longer stable.</strong></p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">Your current reading is available behind your secure link.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">What changes is the cost of delay.</p>
<a href="${escapeHtml(input.secureLink)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">View return brief</a>
<p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.38);margin-top:20px;">At this point, you either resolve this, or the system will continue to degrade around it.</p>
${footerHtml(input.unsubscribeUrl, input.deleteUrl)}
`);

  return {
    emailClass: "return_brief",
    toneKey: `return_brief:${trajectoryTone(input.trajectory)}`,
    subject,
    html,
    text,
  };
}

export function buildCriticalPatternEmail(
  input: DecisionEmailBuilderInput,
): BuiltDecisionEmail {
  const subject = "This is now a recurring pattern";

  const text = [
    "This has now repeated.",
    "",
    "The issue is no longer the decision itself.",
    "It is the structure around it.",
    "",
    "Left as-is, this will continue to reproduce.",
    "",
    "At this stage, resolution usually requires intervention,",
    "not more analysis.",
    "",
    "Your current reading is available behind your secure link.",
    "",
    "If you want to address it properly:",
    input.secureLink,
    "",
    "If not, the pattern will persist.",
    footerText(input.unsubscribeUrl, input.deleteUrl),
  ].filter(Boolean).join("\n");

  const html = shellHtml(`
<p style="font-size:15px;line-height:1.75;color:rgba(255,255,255,0.72);">This has now repeated.</p>
<p style="font-size:15px;line-height:1.7;color:rgba(252,153,153,0.82);margin-top:18px;"><strong>The issue is no longer the decision itself. It is the structure around it.</strong></p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">Left as-is, this will continue to reproduce.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">At this stage, resolution usually requires intervention, not more analysis.</p>
<p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.48);margin-top:18px;">Your current reading is available behind your secure link.</p>
<a href="${escapeHtml(input.secureLink)}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#F5F5F5;color:#0B0B0B;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">Address properly</a>
<p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.38);margin-top:20px;">If not, the pattern will persist.</p>
${footerHtml(input.unsubscribeUrl, input.deleteUrl)}
`);

  return {
    emailClass: "critical_pattern",
    toneKey: "critical_pattern",
    subject,
    html,
    text,
  };
}
