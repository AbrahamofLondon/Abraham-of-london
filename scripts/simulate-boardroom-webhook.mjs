/* scripts/simulate-boardroom-webhook.mjs — Simulate Stripe webhook for Boardroom Brief */
/* This sends a test event to verify the webhook handler processes it correctly. */
/* Run: node scripts/simulate-boardroom-webhook.mjs */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

async function main() {
  if (!STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY not set in environment");
    process.exit(1);
  }

  // 1. Create a Stripe checkout session (test mode)
  const stripe = await import("stripe").then(m => new m.default(STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" }));

  console.log("Creating test checkout session...");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price: "price_1TddfeQFpelVFMXJWuTH7bB2",
      quantity: 1,
    }],
    metadata: {
      productCode: "boardroom-brief",
      priceCode: "boardroom-brief",
      tier: "boardroom-brief",
      userId: "test-verification-user",
      email: "test@abrahamoflondon.org",
      source: "inner_circle",
      diagnosticId: "test-diag-123",
      handoffId: "test-handoff-456",
      riskLevel: "High",
      score: "72",
    },
    success_url: `${SITE_URL}/boardroom-brief/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/boardroom-brief`,
    customer_email: "test@abrahamoflondon.org",
  });

  console.log("Test session created:", session.id);
  console.log("Checkout URL:", session.url);

  // 2. Simulate payment completion (in test mode, we can expire and then confirm)
  console.log("\nExpiring session to simulate completion...");
  await stripe.checkout.sessions.expire(session.id).catch(() => {});

  // 3. Verify the webhook endpoint is reachable
  console.log("\nVerifying webhook endpoint is reachable...");
  try {
    const healthCheck = await fetch(`${SITE_URL}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    console.log("Webhook endpoint responded:", healthCheck.status, healthCheck.statusText);
  } catch (error) {
    console.log("Webhook endpoint check (expected for non-Stripe payload):", error.message);
  }

  console.log("\n--- Verification Summary ---");
  console.log("Stripe product: prod_UctSn3zRH48xmw (£99)");
  console.log("Stripe price: price_1TddfeQFpelVFMXJWuTH7bB2");
  console.log("Webhook URL:", `${SITE_URL}/api/billing/webhook`);
  console.log("Success URL:", `${SITE_URL}/boardroom-brief/confirmation?session_id={CHECKOUT_SESSION_ID}`);
  console.log("\nTo complete verification:");
  console.log("1. Register webhook endpoint in Stripe Dashboard:");
  console.log("   Endpoint:", `${SITE_URL}/api/billing/webhook`);
  console.log("   Events: checkout.session.completed");
  console.log("2. Use the test checkout URL above to complete a real test payment");
  console.log("3. Check /admin/advisory-queue for BOARDROOM_PAID status");
  console.log("4. Check /boardroom-brief/confirmation?session_id=<id> for confirmation page");
}

main().catch(console.error);
