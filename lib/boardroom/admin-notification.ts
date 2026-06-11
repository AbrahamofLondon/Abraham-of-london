/**
 * lib/boardroom/admin-notification.ts
 *
 * Sends an internal admin alert when a new Boardroom Brief order is received.
 * Non-blocking: caller must not fail the webhook if this returns ok: false.
 * Never throws.
 */

import "server-only";

import { sendEmail } from "@/lib/email/core/sendEmail";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoardroomAdminNotificationInput = {
  orderId: string;
  customerEmail: string;
  sessionId: string;
  proofMode: boolean;
  orderCreatedAt: Date;
};

export type BoardroomAdminNotificationResult = {
  ok: boolean;
  error?: string;
  emailId?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adminRecipient(): string {
  return (
    process.env.BOARDROOM_ADMIN_EMAIL?.trim() ||
    process.env.MAIL_TO?.trim() ||
    "admin@abrahamoflondon.org"
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

function deliveryDeadline(from: Date): string {
  const deadline = new Date(from.getTime() + 48 * 60 * 60 * 1000);
  return deadline.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function buildHtml(input: BoardroomAdminNotificationInput): string {
  const masked = maskEmail(input.customerEmail);
  const deadline = deliveryDeadline(input.orderCreatedAt);
  const proofBadge = input.proofMode
    ? `<span style="background:#b45309;color:#fff;padding:2px 8px;font-size:10px;font-family:monospace;letter-spacing:0.15em;border-radius:2px;">PROOF MODE</span>`
    : "";

  return `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#0b0a09;font-family:Georgia,serif;color:#f2f1ee;">
    <div style="max-width:540px;margin:0 auto;padding:48px 24px;">
      <div style="border-bottom:1px solid rgba(201,169,110,0.2);padding-bottom:16px;margin-bottom:32px;">
        <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:#c9a96e;">
          Abraham of London · Admin Alert
        </span>
      </div>

      <h1 style="font-size:20px;font-weight:300;margin:0 0 8px;color:#f2f1ee;">
        New Boardroom Brief Order ${proofBadge}
      </h1>
      <p style="font-size:13px;color:rgba(201,169,110,0.7);margin:0 0 32px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;">
        Action required within 48 hours
      </p>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
                  padding:16px 20px;margin:0 0 32px;border-radius:2px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;font-family:monospace;">
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;width:40%;">Order ID</td>
            <td style="color:#f2f1ee;">${input.orderId}</td>
          </tr>
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;">Customer</td>
            <td style="color:#f2f1ee;">${masked}</td>
          </tr>
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;">Product</td>
            <td style="color:#f2f1ee;">Boardroom Brief</td>
          </tr>
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;">Proof Mode</td>
            <td style="color:${input.proofMode ? "#f59e0b" : "#f2f1ee"};">${input.proofMode ? "YES — controlled proof run" : "No"}</td>
          </tr>
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;">Received</td>
            <td style="color:#f2f1ee;">${input.orderCreatedAt.toISOString()}</td>
          </tr>
          <tr>
            <td style="color:rgba(242,241,238,0.4);padding:6px 0;text-transform:uppercase;letter-spacing:0.12em;">Deliver by</td>
            <td style="color:#c9a96e;font-weight:600;">${deadline}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;">
        <a href="https://www.abrahamoflondon.org/admin/boardroom/orders/${input.orderId}"
           style="display:inline-block;padding:14px 32px;border:1px solid rgba(201,169,110,0.4);
                  background:rgba(201,169,110,0.1);color:#c9a96e;font-family:monospace;
                  font-size:11px;text-transform:uppercase;letter-spacing:0.28em;text-decoration:none;">
          Open Order Detail →
        </a>
      </p>
      <p style="margin:0 0 24px;">
        <a href="https://www.abrahamoflondon.org/admin/fulfilment?sourceType=boardroom_brief_order&amp;sourceId=${input.orderId}"
           style="display:inline-block;padding:10px 24px;border:1px solid rgba(255,255,255,0.1);
                  background:rgba(255,255,255,0.03);color:rgba(242,241,238,0.5);font-family:monospace;
                  font-size:10px;text-transform:uppercase;letter-spacing:0.2em;text-decoration:none;">
          Estate Fulfilment Queue →
        </a>
      </p>

      <p style="font-size:12px;color:rgba(242,241,238,0.3);line-height:1.6;margin-top:40px;">
        This is an internal admin notification. Do not forward.
      </p>

      <div style="border-top:1px solid rgba(201,169,110,0.12);padding-top:16px;margin-top:32px;">
        <span style="font-size:10px;color:rgba(242,241,238,0.2);font-family:monospace;">
          Abraham of London · Decision Authority Infrastructure
        </span>
      </div>
    </div>
  </body>
</html>`;
}

function buildText(input: BoardroomAdminNotificationInput): string {
  const masked = maskEmail(input.customerEmail);
  const deadline = deliveryDeadline(input.orderCreatedAt);

  return [
    "ADMIN ALERT — New Boardroom Brief Order",
    input.proofMode ? "[PROOF MODE — controlled run]" : "",
    "",
    `Order ID:    ${input.orderId}`,
    `Customer:    ${masked}`,
    `Product:     Boardroom Brief`,
    `Proof Mode:  ${input.proofMode ? "YES" : "No"}`,
    `Received:    ${input.orderCreatedAt.toISOString()}`,
    `Deliver by:  ${deadline}`,
    "",
    `Order detail: https://www.abrahamoflondon.org/admin/boardroom/orders/${input.orderId}`,
    `Fulfilment queue: https://www.abrahamoflondon.org/admin/fulfilment?sourceType=boardroom_brief_order&sourceId=${input.orderId}`,
    "",
    "Abraham of London · Decision Authority Infrastructure",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Send admin alert for a new Boardroom Brief order.
 * Returns ok/error — never throws.
 */
export async function sendBoardroomAdminNotification(
  input: BoardroomAdminNotificationInput,
): Promise<BoardroomAdminNotificationResult> {
  try {
    const to = adminRecipient();
    const proofLabel = input.proofMode ? " [PROOF]" : "";
    const result = await sendEmail({
      type: "SYSTEM",
      to,
      subject: `New Boardroom Brief Order${proofLabel} — ${input.orderId}`,
      html: buildHtml(input),
      text: buildText(input),
      meta: {
        source: "boardroom-admin-notification",
        journeyId: input.orderId,
      },
    });

    return {
      ok: result.ok,
      error: result.error,
      emailId: result.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "ADMIN_NOTIFICATION_DISPATCH_FAILED",
    };
  }
}
