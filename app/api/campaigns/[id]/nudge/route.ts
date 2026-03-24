import { db } from "@/lib/db";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { participantId } = body;
    const campaignId = params.id;

    // 1. Determine Target(s) with Strict Status Filtering
    let targets = [];

    if (participantId) {
      // Single Nudge Logic: Targeted intervention
      const participant = await db.campaignParticipant.findUnique({
        where: { id: participantId },
        include: { membership: true, campaign: true }
      });
      // Only nudge if they haven't validated (completed) their telemetry
      if (participant && participant.status !== 'completed') {
        targets.push(participant);
      }
    } else {
      // Bulk Nudge Logic: Find all incomplete participants for this specific campaign
      targets = await db.campaignParticipant.findMany({
        where: { 
          campaignId: campaignId,
          status: { in: ['invited', 'opened'] } 
        },
        include: { membership: true, campaign: true }
      });
    }

    if (targets.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Registry Audit Complete: No eligible participants found for nudge." 
      }, { status: 200 });
    }

    // 2. Map Payload to Sovereign Visual Standard
    const emailPayloads = targets.map((participant) => ({
      from: 'Sovereign OGR <audits@yourdomain.com>',
      to: participant.membership.userEmail,
      subject: `Action Required: ${participant.campaign.title} Audit`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #111; padding: 50px; background-color: #fff;">
          <div style="margin-bottom: 40px;">
             <span style="background: #8A6A2F; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Priority Calibration</span>
          </div>
          <h2 style="text-transform: uppercase; letter-spacing: -0.5px; font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">
            ${participant.campaign.title}
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 30px;">
            Your institutional perspective is required to stabilize the resonance matrix for this audit window. The integrity of our current dataset depends on your node validation.
          </p>
          <div style="margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${participant.id}" 
               style="background: #000; color: #fff; padding: 15px 35px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; display: inline-block;">
              Resume Audit Protocol
            </a>
          </div>
          <p style="font-size: 11px; color: #888; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">
            Sovereign Anonymity Guarantee: Your responses are mathematically decoupled from your identity.
          </p>
          <p style="font-size: 9px; color: #ccc; text-transform: uppercase; margin-top: 10px;">
            Ref ID: ${participant.id.split('-')[0].toUpperCase()}
          </p>
        </div>
      `
    }));

    // 3. Batched Dispatch (Handling Resend's 100-chunk limit)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < emailPayloads.length; i += CHUNK_SIZE) {
      const chunk = emailPayloads.slice(i, i + CHUNK_SIZE);
      await resend.batch.send(chunk);
    }

    return NextResponse.json({ 
      success: true, 
      count: targets.length 
    });

  } catch (error) {
    console.error("[NUDGE_ERROR]", error);
    return new NextResponse("Internal Diagnostic Error", { status: 500 });
  }
}