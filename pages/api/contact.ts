import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";

import { withSecurity } from "@/lib/apiGuard";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { hubspotSync } from "@/lib/hubspot/sync";
import {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { notifyDiscord } from "@/lib/notifications/discord";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  "https://www.abrahamoflondon.org";

const MAIL_FROM =
  process.env.MAIL_FROM?.trim() ||
  "Abraham of London <info@abrahamoflondon.org>";

const CONTACT_RECEIVERS = [
  process.env.CONTACT_RECEIVER_EMAIL?.trim() || "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
].filter(Boolean);

const ContactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  enquiryType: z.string().trim().default("General"),
  message: z.string().min(10).max(5000).trim(),
  gRecaptchaToken: z.string().min(1),
  teaserOptIn: z.boolean().default(false),
  newsletterOptIn: z.boolean().default(false),
  botField: z.string().optional(),
});

async function syncResendAudienceContact(args: {
  email: string;
  name: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const audienceId = process.env.RESEND_AUDIENCE_ID?.trim();
  if (!apiKey || !audienceId) return;

  const [firstName, ...rest] = args.name.split(" ");
  const response = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      unsubscribed: false,
    }),
  });

  if (!response.ok && response.status !== 409) {
    const body = await response.text().catch(() => "");
    throw new Error(`RESEND_CONTACT_SYNC_FAILED:${response.status}:${body}`);
  }
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRateLimitExceeded(result: unknown): boolean {
  const rl = result as { ok?: boolean; allowed?: boolean };
  if (typeof rl.ok === "boolean") return !rl.ok;
  if (typeof rl.allowed === "boolean") return !rl.allowed;
  return false;
}

async function contactHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`contact:${ip}`, RATE_LIMIT_CONFIGS.contact);

  Object.entries(createRateLimitHeaders(rl)).forEach(([k, v]) =>
    res.setHeader(k, v),
  );

  if (getRateLimitExceeded(rl)) {
    return res
      .status(429)
      .json({ ok: false, message: "Rate limit exceeded." });
  }

  try {
    const parsed = ContactSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        errors: parsed.error.format(),
      });
    }

    const {
      name,
      email,
      enquiryType,
      message,
      teaserOptIn,
      newsletterOptIn,
      botField,
    } = parsed.data;

    if (botField) {
      return res.status(200).json({ ok: true, message: "Signal received." });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeEnquiryType = escapeHtml(enquiryType);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const tasks: Array<Promise<unknown>> = [];
    const emailTasks: Array<Promise<{ ok: boolean; provider: string; error?: string }>> = [];

    const isHighValue =
      enquiryType === "Inner Circle" || enquiryType === "Briefing";

    tasks.push(
      notifyDiscord({
        title: isHighValue
          ? "CORE ENGAGEMENT REQUEST"
          : "INQUIRY RECEIVED",
        description: `New transmission from **${name}** (${email})`,
        priority: isHighValue,
        color: isHighValue ? 0xd4af37 : 0x71717a,
        fields: [
          { name: "Nature", value: enquiryType, inline: true },
          {
            name: "Teaser",
            value: teaserOptIn ? "Requested" : "None",
            inline: true,
          },
          {
            name: "Newsletter",
            value: newsletterOptIn ? "Opted in" : "No",
            inline: true,
          },
          {
            name: "Brief",
            value:
              message.length > 150 ? `${message.slice(0, 150)}...` : message,
          },
        ],
      }),
    );

    if (newsletterOptIn && process.env.RESEND_AUDIENCE_ID?.trim()) {
      tasks.push(
        syncResendAudienceContact({ email, name }),
      );
    }

    const internalEmailTask = sendEmail({
        type: "CONTACT",
        to: CONTACT_RECEIVERS,
        subject: `[STRATEGIC BRIEF] ${enquiryType.toUpperCase()} - ${name}`,
        template: {
          name: "contact-internal",
          data: {
            name: safeName,
            email: safeEmail,
            message,
            subject: enquiryType,
            teaserOptIn,
            newsletterOptIn,
            siteUrl: SITE_URL,
            submittedAt: new Date().toISOString(),
            userAgentSnippet: String(req.headers["user-agent"] || ""),
          },
        },
        replyTo: email,
        from: MAIL_FROM,
        meta: {
          source: "contact-form:internal",
        },
      });
    tasks.push(internalEmailTask);
    emailTasks.push(internalEmailTask);

    if (teaserOptIn) {
      const teaserEmailTask = sendEmail({
          type: "CONTACT",
          to: [email],
          bcc: ["info@abrahamoflondon.org"],
          subject: "Fathering Without Fear: The First Briefing",
          template: {
            name: "contact-teaser",
            data: {
              name: name.split(" ")[0] || "Reader",
              siteUrl: SITE_URL,
            },
          },
          from: MAIL_FROM,
          meta: {
            source: "contact-form:teaser",
          },
        });
      tasks.push(teaserEmailTask);
      emailTasks.push(teaserEmailTask);
    }

    const results = await Promise.allSettled(tasks);
    const mailAudit = results.map((result, i) => ({
      index: i,
      ok: result.status === "fulfilled",
      provider: result.status === "fulfilled" && (result.value as any)?.provider
        ? (result.value as any).provider
        : "resend",
      error: result.status === "rejected"
        ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
        : result.status === "fulfilled" && !(result.value as any)?.ok
        ? String((result.value as any)?.error || "EMAIL_SEND_FAILED")
        : undefined,
    }));

    results.forEach((result, i) => {
      if (result.status === "rejected" || ("value" in result && (result.value as any)?.ok === false)) {
        console.error(`[CONTACT_TASK_${i}_FAILED]`, result);
      }
    });
    console.info("[CONTACT_EMAIL_AUDIT]", mailAudit);

    const emailResults = await Promise.allSettled(emailTasks);
    const failedMail = emailResults.find(
      (entry) => entry.status === "rejected" || (entry.status === "fulfilled" && !entry.value.ok),
    );
    if (failedMail) {
      return res.status(502).json({
        ok: false,
        message: "Email delivery failed. Please try again shortly.",
      });
    }

    // HubSpot sync — fire and forget
    hubspotSync({
      event: "contact_form_submitted",
      email: safeEmail,
      data: { fullName: safeName, message: safeMessage },
    }).catch(() => {});

    return res.status(200).json({
      ok: true,
      message: "Engagement successful. Briefing sent.",
    });
  } catch (error) {
    console.error("[CONTACT_API_ERROR]", error);
    return res
      .status(500)
      .json({ ok: false, message: "Internal Server Error" });
  }
}

export default withSecurity(contactHandler, {
  requireRecaptcha: true,
  expectedAction: "contact_form",
  requireHoneypot: true,
});
