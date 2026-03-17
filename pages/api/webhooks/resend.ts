/* pages/api/webhooks/resend.ts — UPDATED WITH DISCORD & CLICK TRACKING */
import { notifyDiscord } from "@/lib/notifications/discord";

export default async function resendWebhookHandler(req: NextApiRequest, res: NextApiResponse) {
  const { type, data } = req.body;

  // 1. TRACK OPENS
  if (type === "email.opened") {
    await notifyDiscord({
      title: "📩 TEASER ACCESSED",
      description: `Principal **${data.to[0]}** just opened the briefing.`,
      color: 0x34d399, // Emerald
    });
  }

  // 2. TRACK CLICKS (Download Version)
  if (type === "email.clicked") {
    const url = data.click_url || "";
    const version = url.includes("v=mobile") ? "MOBILE (Smartphone)" : "A4 (Desktop/Print)";

    await notifyDiscord({
      title: "💾 DOCUMENT DOWNLOADED",
      description: `Principal **${data.to[0]}** downloaded the teaser.`,
      fields: [
        { name: "Format", value: version, inline: true },
        { name: "Asset", value: "Fathering Without Fear", inline: true },
      ],
      color: 0xf59e0b, // Amber
    });
  }

  return res.status(200).json({ ok: true });
}