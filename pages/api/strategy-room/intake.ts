/* pages/api/strategy-room/intake.ts */
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<StrategyRoomIntakeResult>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, status: "declined", message: "POST only." });

  const payload = req.body as StrategyRoomIntakePayload;
  const evaluated = evaluateIntake(payload);
  const scoreData = computeScore(payload);

  if (evaluated.ok && evaluated.status === "accepted") {
    // Parallel background tasks
    const emailPromise = resend.emails.send({
      from: "Abraham of London <board@abrahamoflondon.org>",
      to: [payload.contact.email],
      subject: "Strategy Room: Accepted",
      text: `Hello ${payload.contact.fullName}, your intake for "${payload.decision.statement}" has been accepted.`
    });

    const discordPromise = notifyDiscord(payload, scoreData.total, evaluated.status);
    const archivePromise = archiveIntake(payload, evaluated, scoreData.total);

    Promise.allSettled([emailPromise, discordPromise, archivePromise]).then((results) => {
      results.forEach((r, i) => { if (r.status === "rejected") console.error(`Task ${i} failed:`, r.reason); });
    });
  }

  return res.status(200).json(evaluated);
}
