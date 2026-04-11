/* app/api/campaigns/[id]/nudge/route.ts — SOVEREIGN NUDGE DISPATCHER */

import { db } from "@/lib/db";
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type RouteContext = {
  params: { id: string };
};

type EligibleParticipant = {
  id: string;
  campaignId: string;
  status: string;
  campaign: {
    title: string;
  };
  membership: {
    email: string | null;
  } | null;
};

function safeRefId(value: string | null | undefined): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "UNKNOWN";
  return raw.split("-")[0]?.toUpperCase() || "UNKNOWN";
}

function isEligibleEmailTarget(
  participant: EligibleParticipant,
): participant is EligibleParticipant & {
  membership: { email: string };
} {
  return Boolean(participant.membership?.email);
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const body: { participantId?: string } = await req.json().catch(() => ({}));
    const participantId =
      typeof body.participantId === "string" ? body.participantId : "";
    const campaignId = params.id;

    const prisma = await db.getPrismaClient();
    if (!prisma) {
      return new NextResponse("Institutional Database Connection Failure", {
        status: 500,
      });
    }

    let targets: EligibleParticipant[] = [];

    if (participantId) {
      const participant = await prisma.campaignParticipant.findUnique({
        where: { id: participantId },
        include: {
          membership: true,
          campaign: { select: { title: true } },
        },
      });

      if (
        participant &&
        participant.campaignId === campaignId &&
        participant.status !== "completed" &&
        participant.membership
      ) {
        targets = [participant];
      }
    } else {
      const participants = await prisma.campaignParticipant.findMany({
        where: {
          campaignId,
          status: { in: ["invited", "opened"] },
          membership: { isNot: null },
        },
        include: {
          membership: true,
          campaign: { select: { title: true } },
        },
      });

      targets = participants;
    }

    if (targets.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Registry Audit Complete: No eligible nodes for intervention.",
        },
        { status: 200 },
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

    const emailPayloads = targets
      .filter(isEligibleEmailTarget)
      .map((participant) => ({
        from: "Sovereign OGR <info@abrahamoflondon.org>",
        to: participant.membership.email,
        subject: `Action Required: ${participant.campaign.title} Audit Calibration`,
        html: `
          <div style="font-family: Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #111; padding: 50px; background-color: #fff;">
            <div style="margin-bottom: 40px;">
              <span style="background: #8A6A2F; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Priority Calibration</span>
            </div>

            <h2 style="text-transform: uppercase; letter-spacing: -0.5px; font-size: 24px; font-weight: 900; color: #000; margin-bottom: 20px;">
              ${participant.campaign.title}
            </h2>

            <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 30px;">
              Your institutional perspective is required to stabilize the resonance matrix. The integrity of our current dataset depends on your node validation.
            </p>

            <div style="margin: 40px 0;">
              <a href="${baseUrl}/audit/${participant.id}"
                 style="background: #000; color: #fff; padding: 15px 35px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; display: inline-block;">
                Resume Audit Protocol
              </a>
            </div>

            <p style="font-size: 11px; color: #888; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Sovereign Anonymity Guarantee: Your responses are mathematically decoupled from your identity within the telemetry layer.
            </p>

            <p style="font-size: 9px; color: #ccc; text-transform: uppercase; margin-top: 10px;">
              Ref ID: ${safeRefId(participant.id)}
            </p>
          </div>
        `,
      }));

    if (emailPayloads.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No eligible recipients with valid email addresses.",
        },
        { status: 200 },
      );
    }

    const CHUNK_SIZE = 100;
    for (let i = 0; i < emailPayloads.length; i += CHUNK_SIZE) {
      const chunk = emailPayloads.slice(i, i + CHUNK_SIZE);
      await resend.batch.send(chunk);
    }

    return NextResponse.json({
      success: true,
      count: emailPayloads.length,
    });
  } catch (error) {
    console.error("[NUDGE_PROTOCOL_FAILURE]", error);
    return new NextResponse("Internal Diagnostic Error", { status: 500 });
  }
}