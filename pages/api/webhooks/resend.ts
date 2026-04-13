import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { notifyDiscord } from "@/lib/notifications/discord";

type ResendRecipient = string | { email?: string } | undefined;

type ResendWebhookBody = {
  type?: string;
  created_at?: string;
  data?: {
    to?: ResendRecipient[] | string[];
    click_url?: string;
    subject?: string;
    email_id?: string;
  };
};

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET?.trim() || "";

function extractPrimaryRecipient(
  to: NonNullable<ResendWebhookBody["data"]>["to"],
): string {
  if (!Array.isArray(to) || to.length === 0) return "unknown";

  const first = to[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && typeof first.email === "string") {
    return first.email;
  }

  return "unknown";
}

function inferDocumentVariant(url: string): string {
  if (!url) return "Unknown";
  if (url.includes("v=mobile")) return "MOBILE (Smartphone)";
  if (url.includes("v=a4")) return "A4 (Desktop/Print)";
  return "Standard";
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyWebhookSignature(req: NextApiRequest): boolean {
  if (!RESEND_WEBHOOK_SECRET) return true;

  const signature = String(req.headers["resend-signature"] || "").trim();
  if (!signature) return false;

  const body =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  const expected = crypto
    .createHmac("sha256", RESEND_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return timingSafeEqual(signature, expected);
}

async function handleOpened(data: NonNullable<ResendWebhookBody["data"]>) {
  const recipient = extractPrimaryRecipient(data.to ?? []);

  await notifyDiscord({
    title: "EMAIL OPENED",
    description: `Principal **${recipient}** opened the briefing email.`,
    color: 0x34d399,
    fields: [
      {
        name: "Subject",
        value: String(data.subject || "Unknown"),
        inline: false,
      },
      {
        name: "Email ID",
        value: String(data.email_id || "Unknown"),
        inline: false,
      },
    ],
  });
}

async function handleClicked(data: NonNullable<ResendWebhookBody["data"]>) {
  const recipient = extractPrimaryRecipient(data.to ?? []);
  const clickUrl = String(data.click_url || "");
  const version = inferDocumentVariant(clickUrl);

  await notifyDiscord({
    title: "EMAIL LINK CLICKED",
    description: `Principal **${recipient}** clicked through from the email.`,
    color: 0xf59e0b,
    fields: [
      { name: "Format", value: version, inline: true },
      {
        name: "URL",
        value: clickUrl || "Unknown",
        inline: false,
      },
      {
        name: "Subject",
        value: String(data.subject || "Unknown"),
        inline: false,
      },
    ],
  });
}

export default async function resendWebhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ ok: false, error: "Invalid signature" });
    }

    const body = (req.body || {}) as ResendWebhookBody;
    const type = String(body.type || "");
    const data = body.data || {};

    if (type === "email.opened") {
      await handleOpened(data);
    } else if (type === "email.clicked") {
      await handleClicked(data);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[RESEND_WEBHOOK_ERROR]", error);
    return res
      .status(500)
      .json({ ok: false, error: "Webhook processing failed" });
  }
}
