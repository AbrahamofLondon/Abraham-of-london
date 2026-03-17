import { z } from "zod";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSecurity } from "@/lib/apiGuard";
import { rateLimit, getClientIp, createRateLimitHeaders, RATE_LIMIT_CONFIGS } from "@/lib/server/rateLimit";
import { Resend } from "resend";
import TeaserEmail from "@/components/emails/TeaserEmail";
import { notifyDiscord } from "@/lib/notifications/discord";

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.com";

const ContactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  enquiryType: z.string().default("General"),
  message: z.string().min(10).max(5000).trim(),
  gRecaptchaToken: z.string(),
  teaserOptIn: z.boolean().default(false),
  newsletterOptIn: z.boolean().default(false),
  botField: z.string().optional(),
});

async function contactHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, RATE_LIMIT_CONFIGS.contact);
  Object.entries(createRateLimitHeaders(rl)).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.ok) return res.status(429).json({ ok: false, message: "Rate limit exceeded." });

  try {
    const result = ContactSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ ok: false, errors: result.error.format() });

    const { name, email, enquiryType, message, teaserOptIn, newsletterOptIn, botField } = result.data;

    if (botField) return res.status(200).json({ ok: true, message: "Signal received." });

    const tasks = [];

    // 1. DISCORD COMMAND CENTER NOTIFICATION
    const isHighValue = enquiryType === "Inner Circle" || enquiryType === "Briefing";
    tasks.push(
      notifyDiscord({
        title: isHighValue ? "🚨 CORE ENGAGEMENT REQUEST" : "📩 INQUIRY RECEIVED",
        description: `New transmission from **${name}** (${email})`,
        priority: isHighValue,
        color: isHighValue ? 0xd4af37 : 0x71717a,
        fields: [
          { name: "Nature", value: enquiryType, inline: true },
          { name: "Teaser", value: teaserOptIn ? "Requested" : "None", inline: true },
          { name: "Brief", value: message.length > 150 ? message.slice(0, 150) + "..." : message }
        ]
      })
    );

    // 2. MAILING LIST INTEGRATION
    if (newsletterOptIn && AUDIENCE_ID) {
      tasks.push(
        resend.contacts.create({
          email: email,
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" "),
          unsubscribed: false,
          audienceId: AUDIENCE_ID,
        })
      );
    }

    // 3. ADMIN BRIEFING
    tasks.push(
      resend.emails.send({
        from: "Abraham of London <info@abrahamoflondon.org>",
        to: [process.env.CONTACT_RECEIVER_EMAIL || "admin@abrahamoflondon.com"],
        subject: `[STRATEGIC BRIEF] ${enquiryType.toUpperCase()} - ${name}`,
        replyTo: email,
        html: `
          <div style="font-family: serif; padding: 40px; background: #000; color: #fff; border: 1px solid #333;">
            <h2 style="color: #d4af37; letter-spacing: 2px;">ENGAGEMENT BRIEF</h2>
            <hr style="border: 0; border-top: 1px solid #222; margin: 20px 0;" />
            <p><strong>PRINCIPAL:</strong> ${name}</p>
            <p><strong>EMAIL:</strong> ${email}</p>
            <p><strong>NATURE:</strong> ${enquiryType}</p>
            <p><strong>TEASER REQUESTED:</strong> ${teaserOptIn ? "YES" : "NO"}</p>
            <div style="margin-top: 30px; border-left: 3px solid #d4af37; padding-left: 20px; font-style: italic; color: #ccc;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `,
      })
    );

    // 4. AUTO-RESPONDER: TEASER DELIVERY
    if (teaserOptIn) {
      tasks.push(
        resend.emails.send({
          from: "Abraham of London <info@abrahamoflondon.org>",
          to: [email],
          subject: "Fathering Without Fear: The First Briefing",
          react: TeaserEmail({ name: name.split(" ")[0], siteUrl: SITE_URL }),
        })
      );
    }

    const results = await Promise.allSettled(tasks);
    results.forEach((res, i) => {
      if (res.status === 'rejected') console.error(`Task ${i} failed:`, res.reason);
    });

    return res.status(200).json({ ok: true, message: "Engagement successful. Briefing sent." });

  } catch (e) {
    console.error("Critical API Error:", e);
    return res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
}

export default withSecurity(contactHandler, {
  requireRecaptcha: true,
  expectedAction: "contact_form",
  requireHoneypot: true,
});