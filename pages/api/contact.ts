import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

import { withSecurity } from "@/lib/apiGuard";
import { hubspotSync } from "@/lib/hubspot/sync";
import {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { notifyDiscord } from "@/lib/notifications/discord";
import TeaserEmail from "@/components/emails/TeaserEmail";

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

function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY?.trim() || "");
}

async function contactHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, RATE_LIMIT_CONFIGS.contact);

  Object.entries(createRateLimitHeaders(rl)).forEach(([k, v]) =>
    res.setHeader(k, v),
  );

  if (getRateLimitExceeded(rl)) {
    return res
      .status(429)
      .json({ ok: false, message: "Rate limit exceeded." });
  }

  try {
    const resend = getResendClient();
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
        resend.contacts.create({
          email,
          firstName: name.split(" ")[0] || undefined,
          lastName: name.split(" ").slice(1).join(" ") || undefined,
          unsubscribed: false,
          audienceId: process.env.RESEND_AUDIENCE_ID.trim(),
        }),
      );
    }

    tasks.push(
      resend.emails.send({
        from: MAIL_FROM,
        to: CONTACT_RECEIVERS,
        replyTo: email,
        subject: `[STRATEGIC BRIEF] ${enquiryType.toUpperCase()} - ${name}`,
        html: `
          <div style="font-family: Georgia, serif; padding: 40px; background: #000; color: #fff; border: 1px solid #333;">
            <h2 style="color: #d4af37; letter-spacing: 2px;">ENGAGEMENT BRIEF</h2>
            <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
            <p><strong>PRINCIPAL:</strong> ${safeName}</p>
            <p><strong>EMAIL:</strong> ${safeEmail}</p>
            <p><strong>NATURE:</strong> ${safeEnquiryType}</p>
            <p><strong>TEASER REQUESTED:</strong> ${teaserOptIn ? "YES" : "NO"}</p>
            <p><strong>NEWSLETTER OPT-IN:</strong> ${newsletterOptIn ? "YES" : "NO"}</p>
            <div style="margin-top: 30px; border-left: 3px solid #d4af37; padding-left: 20px; font-style: italic; color: #ccc;">
              ${safeMessage}
            </div>
          </div>
        `,
      }),
    );

    if (teaserOptIn) {
      tasks.push(
        resend.emails.send({
          from: MAIL_FROM,
          to: [email],
          bcc: ["info@abrahamoflondon.org"],
          subject: "Fathering Without Fear: The First Briefing",
          react: TeaserEmail({
            name: name.split(" ")[0] || "Reader",
            siteUrl: SITE_URL,
          }),
        }),
      );
    }

    const results = await Promise.allSettled(tasks);

    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`[CONTACT_TASK_${i}_FAILED]`, result.reason);
      }
    });

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
