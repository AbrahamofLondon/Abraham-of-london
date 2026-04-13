"use server";

import { db } from "@/lib/db";
import { resend } from "@/lib/resend";

export async function nudgeIncompleteParticipants(campaignId: string) {
  const participants = await db.campaignParticipant.findMany({
    where: {
      campaignId,
      status: { not: "completed" },
    },
    include: { campaign: true },
  });

  for (const participant of participants) {
    await resend.emails.send({
      from: "Sovereign Intelligence <intelligence@abrahamoflondon.org>",
      to: participant.email,
      subject: `Action Required: ${participant.campaign.title}`,
      html: `<p>Your participation in the strategic alignment audit is pending. Access your terminal here.</p>`,
    });

    await db.campaignParticipant.update({
      where: { id: participant.id },
      data: { reminderCount: { increment: 1 } },
    });
  }
}