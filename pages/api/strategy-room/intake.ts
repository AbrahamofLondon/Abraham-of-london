/* pages/api/strategy-room/intake.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import type {
  StrategyRoomIntakePayload,
  StrategyRoomIntakeResult,
} from "@/lib/consulting/strategy-room";
import { 
  evaluateIntake, 
  notifyDiscord, 
  computeScore, 
  archiveIntake 
} from "@/lib/consulting/strategy-room";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";
import { StrategyRoomAcceptedEmail } from "@/emails/StrategyRoomAccepted";

// Initialize transactional email service
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * CLIENT IP RESOLUTION:
 * Resolves the real visitor IP for reCAPTCHA v3 risk analysis.
 */
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
  // 1. HTTP METHOD GUARD
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ 
      ok: false, 
      status: "declined", 
      message: "Method not allowed." 
    });
  }

  // 2. PAYLOAD SANITY CHECK
  const payload = req.body as StrategyRoomIntakePayload;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ 
      ok: false, 
      status: "declined", 
      message: "Malformed intake payload." 
    });
  }

  // 3. SECURITY VALIDATION (reCAPTCHA v3)
  const recaptcha = await verifyRecaptchaDetailed(
    payload.recaptchaToken || "",
    "strategy_room_intake",
    getClientIp(req)
  );

  if (!recaptcha.success) {
    return res.status(403).json({ 
      ok: false, 
      status: "declined", 
      message: "Security check failed. Please refresh and try again." 
    });
  }

  try {
    // 4. STRATEGIC EVALUATION & AUDIT SCORING
    // evaluateIntake handles the binary pass/fail logic
    const evaluated = evaluateIntake(payload);
    // computeScore generates the detailed 0-25 metrics for notifications and DB
    const scoreBreakdown = computeScore(payload); 

    // 5. POST-EVALUATION WORKFLOW (ACCEPTS ONLY)
    if (evaluated.ok && evaluated.status === "accepted") {
      
      // A. Prepare Transactional Email
      const emailPromise = resend.emails.send({
        from: process.env.MAIL_FROM || "Abraham of London <board@abrahamoflondon.org>",
        to: [payload.contact.email],
        subject: "Strategy Room: Intake Accepted",
        react: StrategyRoomAcceptedEmail({
          fullName: payload.contact.fullName,
          decisionStatement: payload.decision.statement,
        }),
      });

      // B. Prepare Discord Board Alert (Passes all 3 required arguments)
      const discordPromise = notifyDiscord(payload, scoreBreakdown.total, evaluated.status);

      // C. Prepare Database Archiving (Neon/Postgres)
      const archivePromise = archiveIntake(payload, evaluated, scoreBreakdown.total);

      // 6. ASYNCHRONOUS EXECUTION
      // We do not await these to minimize client-side latency. 
      // results are logged to the cloud console.
      Promise.allSettled([
        emailPromise, 
        discordPromise, 
        archivePromise
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(`❌ Background Task ${i} Failed:`, r.reason);
          }
        });
      });
    } else {
      // Log declined intakes for principled analysis of the funnel
      console.warn(`🛑 Intake Declined: ${payload.contact.email} (Score: ${scoreBreakdown.total})`);
    }

    // 7. FINAL RESPONSE TO CLIENT
    return res.status(200).json(evaluated);

  } catch (error) {
    // 8. CRITICAL EXCEPTION HANDLING
    console.error("❌ CRITICAL INTAKE ERROR:", error);
    return res.status(500).json({ 
      ok: false, 
      status: "declined", 
      message: "Internal system error. Please contact the Board directly." 
    });
  }
}