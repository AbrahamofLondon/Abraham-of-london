/* lib/notifications/discord.ts — ENHANCED ALERT LOGIC */

export async function notifyDiscord(payload: {
  title: string;
  description: string;
  color?: number;
  priority?: boolean; // If true, triggers a push notification
  fields?: { name: string; value: string; inline?: boolean }[];
}) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  const adminId = "YOUR_COPIED_USER_ID"; // Paste your ID here
  if (!webhookUrl) return;

  const body = {
    // Content is outside the embed; this is what triggers the 'ping'
    content: payload.priority ? `<@${adminId}> **— HIGH PRIORITY SIGNAL DETECTED**` : null,
    embeds: [
      {
        title: payload.title,
        description: payload.description,
        color: payload.color || 0xd4af37,
        fields: payload.fields || [],
        timestamp: new Date().toISOString(),
        footer: { text: "Abraham of London • Strategic Command" },
      },
    ],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}