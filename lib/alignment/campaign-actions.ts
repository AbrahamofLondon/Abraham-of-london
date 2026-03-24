"use server";

import { db } from "@/lib/db";
import { resend } from "@/lib/resend"; // Assuming Resend for email

export async function nudgeIncompleteParticipants(campaignId: string) {
  const participants = await db.campaignParticipant.findMany({
    where: {
      campaignId,
      status: { not: 'completed' }
    },
    include: { campaign: true }
  });

  for (const participant of participants) {
    // Send email logic...
    await resend.emails.send({
      from: 'Sovereign Intelligence <intelligence@yourdomain.com>',
      to: participant.email,
      subject: `Action Required: ${participant.campaign.title}`,
      html: `<p>Your participation in the strategic alignment audit is pending. Access your terminal here...</p>`
    });

    // Increment reminder count
    await db.campaignParticipant.update({
      where: { id: participant.id },
      data: { reminderCount: { increment: 1 } }
    });
  }
}