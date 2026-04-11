export const dynamic = "force-dynamic";
// app/api/alignment/enterprise/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCampaignById,
  updateCampaignStatus,
} from "@/lib/alignment/enterprise-repository";
import type { AlignmentCampaign } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const campaignId = normalizeString(context.params?.id);

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required" },
        { status: 400 },
      );
    }

    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        objective: campaign.objective,
        status: campaign.status,
        organisationId: campaign.organisationId,
        opensAt: normalizeDate(campaign.opensAt),
        closesAt: normalizeDate(campaign.closesAt),
        cadenceType: campaign.cadenceType,
        createdAt: normalizeDate(campaign.createdAt),
        updatedAt: normalizeDate(campaign.updatedAt),
        organisation: campaign.organisation
          ? {
              id: campaign.organisation.id,
              name: campaign.organisation.name,
            }
          : null,
        participantCount: Array.isArray(campaign.participants)
          ? campaign.participants.length
          : 0,
        metadata: campaign.metadata,
      },
    });
  } catch (error) {
    console.error("[ENTERPRISE_CAMPAIGN_GET_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to retrieve campaign" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const campaignId = normalizeString(context.params?.id);

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const status = normalizeString((body as { status?: unknown })?.status).toLowerCase();

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Status is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["draft", "active", "paused", "closed", "archived"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const updated = await updateCampaignStatus(campaignId, status);

    return NextResponse.json({
      ok: true,
      campaign: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[ENTERPRISE_CAMPAIGN_PATCH_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to update campaign status" },
      { status: 500 },
    );
  }
}

// DELETE is more RESTful for closing campaigns, not POST
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const campaignId = normalizeString(context.params?.id);

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required" },
        { status: 400 },
      );
    }

    const existing = await getCampaignById(campaignId);

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Use PATCH to close, or DELETE to remove entirely
    // For closing: use PATCH with status="closed"
    // For deletion: uncomment below
    // const deleted = await deleteCampaign(campaignId);
    
    return NextResponse.json({
      ok: true,
      message: "Use PATCH with status='closed' to close a campaign",
    });
  } catch (error) {
    console.error("[ENTERPRISE_CAMPAIGN_CLOSE_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}