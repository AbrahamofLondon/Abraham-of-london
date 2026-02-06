/* pages/api/strategy-room/intake.ts — STRATEGIC INTAKE TERMINAL */
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { 
  evaluateIntake, 
  notifyDiscord, 
  computeScore, 
  archiveIntake,
  StrategyRoomIntakePayload,
  StrategyRoomIntakeResult
} from "@/lib/consulting/strategy-room";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Institutional Intake Gateway
 * Processes stakeholder requests, evaluates strategic fit, and triggers 
 * the Directorate notification chain.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<StrategyRoomIntakeResult>
) {
  // 1. Protocol Validation
  if (req.method !== "POST") {
    return res.status(405).json({ 
      ok: false, 
      status: "declined", 
      message: "Direct POST access required for this terminal." 
    });
  }

  try {
    const payload = req.body as StrategyRoomIntakePayload;

    // 2. Intelligence Evaluation
    // Non-blocking logical checks (reCAPTCHA, field verification, etc.)
    const evaluated = evaluateIntake(payload);
    const scoreData = computeScore(payload);

    // 3. Conditional Execution Chain
    // We only trigger expensive external IO if the initial evaluation passes
    if (evaluated.ok && evaluated.status === "accepted") {
      
      // Parallel execution of institutional duties
      const tasks = [
        // a. Stakeholder Confirmation
        resend.emails.send({
          from: "Abraham of London <board@abrahamoflondon.org>",
          to: [payload.contact.email],
          subject: "Strategy Room: Enrolment Initialized",
          text: `Protocol Update for ${payload.contact.fullName}: Your intake for "${payload.decision.statement}" has been accepted into the queue. Institutional review pending.`
        }),
        
        // b. Directorate Notification (Discord)
        notifyDiscord(payload, scoreData.total, evaluated.status),
        
        // c. Archival in the Sovereign Ledger (Postgres)
        archiveIntake(payload, evaluated, scoreData.total)
      ];

      // Use allSettled to ensure failure in one (e.g., Discord) 
      // doesn't prevent the archival or email from finishing.
      Promise.allSettled(tasks).then((results) => {
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`[INTAKE_TASK_FAILURE]: Task ${index} failed for ${payload.contact.email}:`, result.reason);
          }
        });
      });
    }

    // 4. Immediate Return
    // Returns the evaluation status to the UI immediately for client-side routing
    return res.status(200).json(evaluated);

  } catch (error) {
    console.error("[INTAKE_CRITICAL_ERROR]:", error);
    return res.status(500).json({ 
      ok: false, 
      status: "declined", 
      message: "Internal system error during intake sequence." 
    });
  }
}