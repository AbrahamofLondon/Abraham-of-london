/* test-signal.mjs — MANUAL TRANSMISSION TEST */
import 'dotenv/config';

const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

if (!webhookUrl) {
  console.error("❌ ERROR: NOTIFICATION_WEBHOOK_URL is not defined in your .env file.");
  process.exit(1);
}

const testPayload = {
  embeds: [{
    title: "🛰️ SYSTEM CHECK: ONLINE",
    description: "The Abraham of London Intelligence Bot has established a secure handshake with this channel.",
    color: 0xd4af37, // Gold
    fields: [
      { name: "Status", value: "Operational", inline: true },
      { name: "Environment", value: "Production/Test", inline: true },
      { name: "Latency", value: `${Math.floor(Math.random() * 100)}ms`, inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Protocol: OMNI-RECOVERY" }
  }]
};

async function sendTest() {
  console.log("Attempting to transmit to Discord...");
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      console.log("✅ SUCCESS: Check your Discord channel!");
    } else {
      console.error(`❌ FAILED: Discord returned ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (err) {
    console.error("❌ CRITICAL ERROR:", err.message);
  }
}

sendTest();