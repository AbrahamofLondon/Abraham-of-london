// app/dashboard/live/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { OGRLiveTerminalClient } from "@/components/ogr/live-terminal-client";
import { db } from "@/lib/db";

type CampaignCard = {
  id: string;
  title: string;
  organisation: string;
  participantCount: number;
  status: string;
  friction: number;
  category: string;
  tags: string[];
  createdAt: string;
};

function validateOgrSession(cookieValue?: string): boolean {
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;

  const [sessionId, signature] = parts;
  if (!sessionId || !signature) return false;

  return cookieValue.length > 20 && sessionId.length > 8 && signature.length > 8;
}

export const metadata: Metadata = {
  title: "OGR Live Terminal | Abraham of London",
  description: "Sovereign alignment live intelligence terminal",
};

export default async function OGRLiveTerminalPage() {
  const cookieStore = await cookies();
  const ogrSession = cookieStore.get("ogr_sovereign_session")?.value;

  if (!validateOgrSession(ogrSession)) {
    const returnTo = encodeURIComponent("/dashboard/live");
    redirect(`/sovereign/authorize?returnTo=${returnTo}`);
  }

  const prisma =
    typeof (db as { getPrismaClient?: () => Promise<unknown> }).getPrismaClient ===
    "function"
      ? await (db as { getPrismaClient: () => Promise<unknown> }).getPrismaClient()
      : db;

  let initialCampaigns: CampaignCard[] = [];

  if (
    prisma &&
    typeof prisma === "object" &&
    "alignmentCampaign" in prisma &&
    prisma.alignmentCampaign &&
    typeof (prisma as {
      alignmentCampaign?: {
        findMany?: (args: unknown) => Promise<
          Array<{
            id: string;
            title: string | null;
            status: string;
            createdAt: Date;
            organisation?: { name: string | null } | null;
            _count: { participants: number };
          }>
        >;
      };
    }).alignmentCampaign?.findMany === "function"
  ) {
    const campaigns = await (
      prisma as {
        alignmentCampaign: {
          findMany: (args: unknown) => Promise<
            Array<{
              id: string;
              title: string | null;
              status: string;
              createdAt: Date;
              organisation?: { name: string | null } | null;
              _count: { participants: number };
            }>
          >;
        };
      }
    ).alignmentCampaign.findMany({
      where: { status: "active" },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        organisation: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    });

    initialCampaigns = campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title || "Unnamed Campaign",
      organisation: campaign.organisation?.name || "Unknown",
      participantCount: campaign._count.participants,
      status: campaign.status,
      friction: 0,
      category: "Strategic",
      tags: [],
      createdAt: campaign.createdAt.toISOString(),
    }));
  }

  return <OGRLiveTerminalClient initialCampaigns={initialCampaigns} />;
}