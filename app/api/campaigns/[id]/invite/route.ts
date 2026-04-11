/* app/api/campaigns/[id]/invite/route.ts — NODE AUTHORIZATION PROTOCOL */
import crypto from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY?.trim());

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeString(value: unknown): string {
  return String(value || "").trim();
}

function buildBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://www.abrahamoflondon.org"
  ).replace(/\/+$/, "");
}

function createInviteToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const campaignId = normalizeString(params.id);
    const payload = (await req.json()) as {
      email?: string;
      name?: string;
      team?: string;
      isExecutive?: boolean;
    };

    const email = normalizeEmail(payload.email);
    const name = normalizeString(payload.name);
    const team = normalizeString(payload.team);
    const isExecutive = Boolean(payload.isExecutive);

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "A valid email address is required." },
        { status: 400 },
      );
    }

    /**
     * ✅ CRITICAL FIX: RESOLVE PRISMA INSTANCE
     * You cannot call models on 'db'. You must await the client from the wrapper.
     */
    const prisma = await db.getPrismaClient();

    if (!prisma) {
      return NextResponse.json(
        { ok: false, error: "Database connection failure." },
        { status: 500 },
      );
    }

    // 1. VERIFY CAMPAIGN
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found." },
        { status: 404 },
      );
    }

    // 2. UPSERT MEMBERSHIP
    const membership = await prisma.organisationMembership.upsert({
      where: {
        organisationId_email: {
          organisationId: campaign.organisationId,
          email,
        },
      },
      update: {
        fullName: name || null,
        teamName: team || null,
        isExecutive,
        status: "active",
      },
      create: {
        organisationId: campaign.organisationId,
        email,
        fullName: name || null,
        teamName: team || null,
        isExecutive,
        status: "active",
      },
    });

    // 3. CHECK FOR EXISTING PARTICIPANT
    const existingParticipant = await prisma.campaignParticipant.findUnique({
      where: {
        campaignId_email: {
          campaignId,
          email,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        {
          ok: false,
          error: "This participant has already been invited to the campaign.",
        },
        { status: 409 },
      );
    }

    // 4. GENERATE TOKENS AND CREATE PARTICIPANT
    const rawInviteToken = createInviteToken();
    const inviteTokenHash = hashToken(rawInviteToken);

    const newParticipant = await prisma.campaignParticipant.create({
      data: {
        campaignId,
        membershipId: membership.id,
        email,
        inviteTokenHash,
        status: "invited",
      },
    });

    const assessmentUrl = `${buildBaseUrl()}/enterprise/assessment/${encodeURIComponent(
      rawInviteToken,
    )}`;

    // 5. DISPATCH EMAIL VIA RESEND
    if (!process.env.RESEND_API_KEY?.trim()) {
      console.warn(
        "[CAMPAIGN_INVITE] RESEND_API_KEY missing. Participant created but email not sent.",
      );
    } else {
      await resend.emails.send({
        from: "Abraham of London <info@abrahamoflondon.org>",
        to: [email],
        bcc: [
          "info@abrahamoflondon.org",
          "seunadaramola@gmail.com",
          "abrahamadaramola@outlook.com",
        ],
        subject: `Institutional Authorization: ${campaign.title}`,
        html: `
          <div style="font-family: Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #111; padding: 50px; background-color: #fff;">
            <div style="margin-bottom: 40px;">
              <span style="background: #000; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                New Audit Authorization
              </span>
            </div>

            <h2 style="text-transform: uppercase; letter-spacing: -0.5px; font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">
              Institutional Alignment Audit
            </h2>

            <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 30px;">
              You have been authorized as a participating node for the 
              <strong>${campaign.title}</strong> audit under 
              <strong>${campaign.organisation?.name || "the organisation"}</strong>.
              Your perspective is required for calibration of the institutional alignment reading.
            </p>

            <div style="margin: 40px 0;">
              <a
                href="${assessmentUrl}"
                style="background: #8A6A2F; color: #fff; padding: 15px 35px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; display: inline-block;"
              >
                Initiate Audit Protocol
              </a>
            </div>

            <p style="font-size: 11px; color: #888; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Note: all audit telemetry is mathematically decoupled from identity at reporting level to preserve confidentiality.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      participantId: newParticipant.id,
      email,
    });
  } catch (error) {
    console.error("[INVITE_NODE_FAILURE]", error);
    return NextResponse.json(
      { ok: false, error: "Internal protocol error." },
      { status: 500 },
    );
  }
}