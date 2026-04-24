"use server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/core/sendEmail";

export async function nudgeIncompleteParticipants(campaignId: string) {
  const participants = await db.campaignParticipant.findMany({
    where: {
      campaignId,
      status: { not: 'completed' }
    },
    include: { campaign: true }
  });

  for (const participant of participants) {
    const emailResult = await sendEmail({
      type: "ENTERPRISE",
      to: participant.email,
      from: "Sovereign Intelligence <intelligence@yourdomain.com>",
      subject: `Action Required: ${participant.campaign.title}`,
      html: `<p>Your participation in the strategic alignment audit is pending. Access your terminal here...</p>`,
      text: `Your participation in the strategic alignment audit is pending.`,
      meta: {
        source: "alignment-campaign-actions:nudge",
      },
    });
    if (!emailResult.ok) {
      throw new Error(emailResult.error || "EMAIL_SEND_FAILED");
    }

    // Increment reminder count
    await db.campaignParticipant.update({
      where: { id: participant.id },
      data: { reminderCount: { increment: 1 } }
    });
  }
}
