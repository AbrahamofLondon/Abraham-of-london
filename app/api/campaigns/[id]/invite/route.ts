/* app/api/campaigns/[id]/invite/route.ts — NODE INTEGRATION PROTOCOL */
import { db } from "@/lib/db";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const { email, name, team, isExecutive } = await req.json();

    if (!email) {
      return new NextResponse("Missing identity context (Email)", { status: 400 });
    }

    // 1. INITIALIZE PRISMA CLIENT via Institutional Wrapper
    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Database initialization failed", { status: 500 });
    }

    // 2. RETRIEVE CAMPAIGN CONTEXT
    // Required to link the membership to the correct organisation
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      select: { organisationId: true, title: true }
    });

    if (!campaign) {
      return new NextResponse("Campaign node not found", { status: 404 });
    }

    // 3. ENSURE MEMBERSHIP RECORD EXISTS
    const membership = await prisma.membership.upsert({
      where: { userEmail: email.toLowerCase() },
      update: { 
        userName: name, 
        teamName: team, 
        isExecutive: !!isExecutive 
      },
      create: {
        userEmail: email.toLowerCase(),
        userName: name,
        teamName: team,
        isExecutive: !!isExecutive,
        organisationId: campaign.organisationId
      }
    });

    // 4. CHECK FOR EXISTING CAMPAIGN PARTICIPATION
    const existingParticipant = await prisma.campaignParticipant.findFirst({
      where: {
        campaignId: campaignId,
        membershipId: membership.id
      }
    });

    if (existingParticipant) {
      return NextResponse.json({ 
        success: false, 
        message: "Node already exists within this audit registry." 
      }, { status: 400 });
    }

    // 5. CREATE PARTICIPANT ENTRY
    const newParticipant = await prisma.campaignParticipant.create({
      data: {
        campaignId: campaignId,
        membershipId: membership.id,
        status: 'invited'
      }
    });

    // 6. DISPATCH SOVEREIGN INVITE
    await resend.emails.send({
      from: 'Sovereign OGR <audits@yourdomain.com>',
      to: email.toLowerCase(),
      subject: `Institutional Authorization: ${campaign.title}`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #111; padding: 50px; background-color: #fff;">
          <div style="margin-bottom: 40px;">
             <span style="background: #000; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">New Audit Authorization</span>
          </div>
          <h2 style="text-transform: uppercase; letter-spacing: -0.5px; font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">
            Institutional Alignment Audit
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 30px;">
            You have been authorized as a participating node for the <strong>${campaign.title}</strong> audit. Your perspective is vital for calibrating the institutional resonance matrix.
          </p>
          <div style="margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit/${newParticipant.id}" 
               style="background: #8A6A2F; color: #fff; padding: 15px 35px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; display: inline-block;">
              Initiate Audit Protocol
            </a>
          </div>
          <p style="font-size: 11px; color: #888; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            Note: All audit telemetry is mathematically decoupled from your identity to ensure absolute confidentiality.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[INVITE_NODE_FAILURE]", error);
    return new NextResponse("Internal Protocol Error", { status: 500 });
  }
}