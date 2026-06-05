/* lib/inner-circle/email-triggers.ts — Phase 2: Minimal Email Follow-Up Engine */
/* Server-triggered email events. Kept restrained — first version. */

import { sendEmail } from "@/lib/email/core/sendEmail";
import type { PressureLevel, RiskLevel } from "@/lib/inner-circle/operating-layer";

export type EmailTriggerEvent =
  | "pressure_green"
  | "pressure_amber"
  | "pressure_red"
  | "rise_decay_low_medium"
  | "rise_decay_high"
  | "rise_decay_critical"
  | "seven_day_no_scorecard";

export type TriggerPayload = {
  userId: string;
  email: string;
  name: string | null;
  event: EmailTriggerEvent;
  metadata?: Record<string, unknown>;
};

const TRIGGER_MAP: Record<EmailTriggerEvent, {
  subject: string;
  body: (name: string) => string;
  cta: { label: string; href: string };
}> = {
  pressure_green: {
    subject: "Your decision pressure signal — Low",
    body: (name) =>
      `Your decision is currently low pressure. Save it and track whether the pressure changes over the next review cycle.`,
    cta: { label: "Save decision", href: "/inner-circle/dashboard" },
  },
  pressure_amber: {
    subject: "Your decision pressure signal — Escalating",
    body: (name) =>
      `Your decision is showing escalating pressure. Run the Rise-Decay Scorecard to identify where the structural weakness is coming from before it becomes critical.`,
    cta: { label: "Run Rise-Decay Scorecard", href: "/inner-circle/tools/rise-decay-scorecard" },
  },
  pressure_red: {
    subject: "Your decision pressure signal — Critical",
    body: (name) =>
      `Your decision is showing critical pressure. A Strategy Room review may be appropriate to prevent the pressure from becoming damage control.`,
    cta: { label: "Review options", href: "/strategy-room" },
  },
  rise_decay_low_medium: {
    subject: "Your Rise-Decay assessment — Controlled",
    body: (name) =>
      `Your current risk is controlled. Complete your first 30-day worksheet action to maintain governed momentum.`,
    cta: { label: "Complete worksheet", href: "/inner-circle/dashboard" },
  },
  rise_decay_high: {
    subject: "Your Rise-Decay assessment — Board-level exposure",
    body: (name) =>
      `Your score indicates board-level exposure. A Boardroom Brief is recommended to convert the risk into a board-ready challenge dossier.`,
    cta: { label: "Start Boardroom Brief", href: "/boardroom-brief" },
  },
  rise_decay_critical: {
    subject: "Your Rise-Decay assessment — Critical",
    body: (name) =>
      `This has exceeded self-guided review. A Strategy Room review is recommended to move severe decision risk into live intervention.`,
    cta: { label: "Schedule Strategy Room", href: "/strategy-room" },
  },
  seven_day_no_scorecard: {
    subject: "Complete your diagnostic",
    body: (name) =>
      `You created your account seven days ago but have not completed the Rise-Decay Scorecard. This diagnostic identifies structural drift before it becomes expensive.`,
    cta: { label: "Start Scorecard", href: "/inner-circle/tools/rise-decay-scorecard" },
  },
};

export function getTriggerConfig(event: EmailTriggerEvent) {
  return TRIGGER_MAP[event];
}

export async function sendTriggerEmail(payload: TriggerPayload): Promise<{ ok: boolean; error?: string }> {
  const config = TRIGGER_MAP[payload.event];
  if (!config) {
    return { ok: false, error: "UNKNOWN_TRIGGER_EVENT" };
  }

  const name = payload.name || "Builder";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  const result = await sendEmail({
    type: "INNER_CIRCLE",
    to: payload.email,
    subject: config.subject,
    text: `${name},\n\n${config.body(name)}\n\n${config.cta.label}: ${siteUrl}${config.cta.href}\n\nBest regards,\nThe Abraham of London Team`,
    from: process.env.INNER_CIRCLE_FROM_EMAIL || "Abraham of London <info@abrahamoflondon.org>",
    meta: {
      userId: payload.userId,
      source: `email-trigger:${payload.event}`,
    },
  });

  return result;
}
