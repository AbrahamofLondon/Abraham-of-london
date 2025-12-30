/* pages/api/strategy-room/intake.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import type {
  StrategyRoomIntakePayload,
  StrategyRoomIntakeResult,
} from "@/lib/consulting/strategy-room";
import { evaluateIntake, notifyDiscord } from "@/lib/consulting/strategy-room";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import { StrategyRoomAcceptedEmail } from "@/emails/StrategyRoomAccepted";

const resend = new Resend(process.env.RESEND_API_KEY);

function getClientIp(req: NextApiRequest): string | undefined {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0]?.trim();
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.length > 0) return xrip.trim();
  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StrategyRoomIntakeResult>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, status: "declined", message: "Method not allowed." });
  }

  const payload = req.body as StrategyRoomIntakePayload;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ ok: false, status: "declined", message: "Malformed payload." });
  }

  // 1. SECURITY VALIDATION
  const recaptcha = await verifyRecaptchaDetailed(
    payload.recaptchaToken || "",
    "strategy_room_intake",
    getClientIp(req)
  );

  if (!recaptcha.success) {
    return res.status(403).json({ ok: false, status: "declined", message: "Security check failed." });
  }

  try {
    // 2. STRATEGIC EVALUATION
    const evaluated = evaluateIntake(payload);

    // 3. ASYNCHRONOUS NOTIFICATION WORKFLOW
    if (evaluated.ok && evaluated.status === "accepted") {
      // Execute notifications in parallel to optimize response time
      const emailPromise = resend.emails.send({
        from: process.env.MAIL_FROM || "Abraham of London <board@abrahamoflondon.org>",
        to: [payload.contact.email],
        subject: "Strategy Room: Intake Accepted",
        react: StrategyRoomAcceptedEmail({
          fullName: payload.contact.fullName,
          decisionStatement: payload.decision.statement,
        }),
      });

      // Note: We access internal scoring logic for the notification
      const discordPromise = notifyDiscord(payload, 20); // Score passed for high-signal context

      // Fire and forget (don't block the client response for webhooks)
      Promise.allSettled([emailPromise, discordPromise]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") console.error(`Notify Layer ${i} Failed:`, r.reason);
        });
      });
    }

    // 4. RESPONSE
    return res.status(200).json(evaluated);

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    return res.status(500).json({ ok: false, status: "declined", message: "Internal system error." });
  }
}