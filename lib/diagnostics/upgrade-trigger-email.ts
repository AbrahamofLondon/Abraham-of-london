/**
 * lib/diagnostics/upgrade-trigger-email.ts
 *
 * Sends the ER upgrade follow-up email when a Fast Diagnostic returns
 * HIGH or CRITICAL signal strength.
 *
 * Governance rules:
 *  - Only sent when signalStrength is "high" or "moderate"
 *  - Includes "scenario estimate only" disclaimer
 *  - No customer-facing artefacts created — just the email
 *  - Never throws; failure is logged and returned as ok: false
 */

import "server-only";

import { sendEmail } from "@/lib/email/core/sendEmail";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UpgradeTriggerEmailInput = {
  to: string;
  condition: string;
  conditionLabel: string;
  signalStrength: "moderate" | "high";
  nextGovernanceMove?: string | null;
  caseRef?: string | null;
  /** £-formatted exposure band, e.g. "£25k–£75k", if available */
  exposureBand?: string | null;
};

export type UpgradeTriggerEmailResult = {
  ok: boolean;
  emailId?: string;
  error?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://abrahamoflondon.com"
  );
}

function headline(signalStrength: "moderate" | "high", conditionLabel: string): string {
  if (signalStrength === "high") {
    return `Your ${conditionLabel} assessment indicates a decision that qualifies for Executive Reporting`;
  }
  return `Your ${conditionLabel} assessment warrants an executive-level priority review`;
}

function signalLabel(signalStrength: "moderate" | "high"): string {
  return signalStrength === "high" ? "High signal" : "Moderate signal";
}

function coverageItems(condition: string): string[] {
  const base = [
    "Governance position statement — where authority actually sits",
    "Consequence model — the cost of continuing on the current path",
    "Priority stack — WSJF-ranked intervention sequence",
    "Decision required — the specific move with checkpoint criteria",
  ];

  const conditionSpecific: Record<string, string> = {
    authority: "Authority chain mapping — who can decide, who is blocking",
    execution: "Execution failure analysis — where implementation is stalling",
    stakeholder: "Stakeholder pressure assessment — who is aligned and who is not",
    financial: "Financial exposure quantification — scenario-modelled cost projection",
    governance: "Governance drift analysis — systemic risk from unresolved decisions",
  };

  const matched = Object.entries(conditionSpecific).find(([key]) =>
    condition.toLowerCase().includes(key)
  );

  if (matched) {
    return [matched[1], ...base.slice(0, 3)];
  }

  return base;
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHtml(input: UpgradeTriggerEmailInput): string {
  const base = siteUrl();
  const erUrl = `${base}/diagnostics/executive-reporting?email=${encodeURIComponent(input.to)}`;
  const checkoutUrl = `${base}/api/billing/checkout`;
  const items = coverageItems(input.condition);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Reporting — Abraham of London</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">

    <!-- Header -->
    <div style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;margin-bottom:28px;">
      <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(201,169,110,0.70);margin:0 0 10px;">
        Abraham of London
      </p>
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0;">
        Executive Reporting — ${signalLabel(input.signalStrength)}
      </p>
    </div>

    <!-- Headline -->
    <h1 style="font-family:Georgia,serif;font-weight:300;font-size:22px;line-height:1.45;color:rgba(255,255,255,0.82);margin:0 0 20px;">
      ${headline(input.signalStrength, input.conditionLabel)}
    </h1>

    <!-- Signal rationale -->
    <p style="font-size:15px;line-height:1.65;color:rgba(255,255,255,0.55);margin:0 0 12px;">
      The Fast Diagnostic returned a <strong style="color:rgba(255,255,255,0.80);">${signalLabel(input.signalStrength).toLowerCase()}</strong>
      on <strong style="color:rgba(255,255,255,0.80);">${input.conditionLabel}</strong>.
      This indicates the decision has sufficient evidence to warrant a governed priority output.
    </p>

    ${input.nextGovernanceMove ? `
    <div style="border-left:2px solid rgba(201,169,110,0.35);padding-left:16px;margin:0 0 20px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(201,169,110,0.55);margin:0 0 6px;">
        Recommended next move
      </p>
      <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.65);margin:0;">
        ${input.nextGovernanceMove}
      </p>
    </div>
    ` : ""}

    ${input.exposureBand ? `
    <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);padding:12px 16px;margin:0 0 20px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(252,165,165,0.55);margin:0 0 4px;">
        Estimated exposure band
      </p>
      <p style="font-size:16px;color:rgba(252,165,165,0.80);margin:0;">
        ${input.exposureBand}
        <span style="font-family:'Courier New',monospace;font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:0.10em;"> — scenario estimate only</span>
      </p>
    </div>
    ` : ""}

    <!-- What the ER covers -->
    <div style="border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.015);padding:20px;margin:0 0 24px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.20em;text-transform:uppercase;color:rgba(255,255,255,0.28);margin:0 0 14px;">
        What the executive report covers
      </p>
      ${items.map((item) => `
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <span style="color:rgba(201,169,110,0.55);flex-shrink:0;font-size:12px;margin-top:1px;">◈</span>
        <p style="font-size:14px;line-height:1.55;color:rgba(255,255,255,0.55);margin:0;">${item}</p>
      </div>
      `).join("")}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${erUrl}"
         style="display:inline-block;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.35);color:rgba(201,169,110,0.90);font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
        Generate Executive Report — £295
      </a>
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.22);margin:10px 0 0;">
        One-time payment · No subscription · No sales call
      </p>
    </div>

    <!-- Trust line -->
    <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin:0 0 24px;">
      ${[
        "Governed output",
        "Delivered immediately",
        "Scenario estimates only",
        "Decision-ready format",
      ].map((item) => `
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.22);margin:0;">
        ${item}
      </p>
      `).join("")}
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.12em;color:rgba(255,255,255,0.18);line-height:1.6;margin:0 0 8px;">
        This email was triggered by a Fast Diagnostic assessment you completed.
        The Executive Report is a governed analytical output, not financial or legal advice.
        All financial figures are scenario estimates derived from declared inputs and carry a "scenario estimate only" disclaimer.
      </p>
      ${input.caseRef ? `
      <p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:0.10em;color:rgba(255,255,255,0.12);margin:0;">
        Case reference: ${input.caseRef}
      </p>
      ` : ""}
    </div>

  </div>
</body>
</html>`;
}

function buildText(input: UpgradeTriggerEmailInput): string {
  const base = siteUrl();
  const erUrl = `${base}/diagnostics/executive-reporting?email=${encodeURIComponent(input.to)}`;
  const items = coverageItems(input.condition);

  return `Abraham of London — Executive Reporting

${headline(input.signalStrength, input.conditionLabel)}

The Fast Diagnostic returned a ${signalLabel(input.signalStrength).toLowerCase()} on ${input.conditionLabel}. This indicates the decision has sufficient evidence to warrant a governed priority output.

${input.nextGovernanceMove ? `Recommended next move: ${input.nextGovernanceMove}\n` : ""}${input.exposureBand ? `Estimated exposure band: ${input.exposureBand} (scenario estimate only)\n` : ""}

What the executive report covers:
${items.map((item) => `  • ${item}`).join("\n")}

Generate Executive Report — £295
${erUrl}

One-time payment. No subscription. No sales call.

---
This email was triggered by a Fast Diagnostic assessment you completed.
The Executive Report is a governed analytical output, not financial or legal advice.
All financial figures are scenario estimates.
${input.caseRef ? `Case reference: ${input.caseRef}` : ""}
`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sendUpgradeTriggerEmail(
  input: UpgradeTriggerEmailInput,
): Promise<UpgradeTriggerEmailResult> {
  try {
    const result = await sendEmail({
      type: "TRANSACTIONAL",
      to: input.to,
      subject: `${input.conditionLabel} assessment — executive report available`,
      html: buildHtml(input),
      text: buildText(input),
      meta: {
        source: "upgrade-trigger",
        journeyId: `fast-diag-${input.signalStrength}`,
      },
    });

    return {
      ok: result.ok,
      emailId: result.id,
      error: result.error,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "UPGRADE_TRIGGER_EMAIL_FAILED",
    };
  }
}
