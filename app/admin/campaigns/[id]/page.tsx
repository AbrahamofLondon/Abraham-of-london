export const dynamic = "force-dynamic";
/* app/admin/campaigns/[id]/page.tsx — INSTITUTIONAL CAMPAIGN REGISTRY */
import { db } from "@/lib/db";
import {
  Users,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Lock,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { AuditInvite } from "@/components/admin/campaigns/audit-invite";
import { CampaignActions } from "@/components/admin/campaigns/campaign-actions";
import { ParticipantTable } from "@/components/admin/campaigns/participant-table";

// ============================================================================
// TYPES
// ============================================================================

type ParticipantStatus =
  | "pending"
  | "completed"
  | "expired"
  | "invited"
  | "opened";

interface ParticipantMembership {
  id: string;
  email: string;
  name: string | null;
  tier?: string;
  userEmail?: string | null;
  userName?: string | null;
  teamName?: string | null;
  isExecutive?: boolean;
}

interface CampaignParticipant {
  id: string;
  status: ParticipantStatus;
  email?: string | null;
  name?: string | null;
  membership?: ParticipantMembership | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  openedAt?: string | Date | null;
  completedAt?: string | Date | null;
}

interface CampaignOrganisation {
  id: string;
  name: string;
  slug?: string;
}

interface CampaignCount {
  participants: number;
}

interface CampaignRecord {
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  organisationId: string;
  organisation: CampaignOrganisation;
  participants: CampaignParticipant[];
  _count: CampaignCount;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

type ParticipantTableRow = {
  id: string;
  status: ParticipantStatus;
  openedAt: Date | null;
  completedAt: Date | null;
  membership: {
    userEmail: string;
    userName: string;
    teamName: string;
    isExecutive: boolean;
  };
};

// ============================================================================
// HELPERS
// ============================================================================

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNonEmptyString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

// ============================================================================
// 404 COMPONENT
// ============================================================================

function CampaignNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-8">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-neutral-100 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutral-50 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-xl font-medium text-neutral-900 mb-2">
          Campaign Not Found
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed mb-8">
          The requested campaign could not be found.
        </p>
        <Link
          href="/admin/campaigns"
          className="inline-block px-6 py-3 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
        >
          Return to campaigns
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function CampaignManagementPage({ params }: PageProps) {
  const { id } = await params;

  const prisma =
    typeof (db as { getPrismaClient?: () => Promise<unknown> }).getPrismaClient ===
    "function"
      ? await (db as { getPrismaClient: () => Promise<unknown> }).getPrismaClient()
      : db;

  if (!prisma) {
    throw new Error("Institutional Database Connection Failure.");
  }

  const campaign = await (
    prisma as {
      alignmentCampaign: {
        findUnique: (args: {
          where: { id: string };
          include: {
            organisation: boolean;
            participants: {
              include: { membership: boolean };
              orderBy: { status: "asc" | "desc" };
            };
            _count: { select: { participants: boolean } };
          };
        }) => Promise<CampaignRecord | null>;
      };
    }
  ).alignmentCampaign.findUnique({
    where: { id },
    include: {
      organisation: true,
      participants: {
        include: { membership: true },
        orderBy: { status: "asc" },
      },
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!campaign) {
    return <CampaignNotFound />;
  }

  const completedCount = campaign.participants.filter(
    (p: CampaignParticipant) => p.status === "completed"
  ).length;

  const totalInvited = campaign._count.participants;
  const completionRate =
    totalInvited > 0 ? Math.round((completedCount / totalInvited) * 100) : 0;

  const isSafeToReport = completedCount >= 5;
  const startDate = new Date(campaign.createdAt);
  const daysActive = Math.max(
    0,
    Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const participantsForTable: ParticipantTableRow[] = campaign.participants.map(
    (p: CampaignParticipant) => ({
      id: p.id,
      status: p.status,
      openedAt: toDateOrNull(p.openedAt) ?? toDateOrNull(p.createdAt),
      completedAt:
        toDateOrNull(p.completedAt) ??
        (p.status === "completed" ? new Date() : null),
      membership: {
        userEmail: toNonEmptyString(
          p.membership?.email ??
            p.membership?.userEmail ??
            p.email,
          "unknown@registry.local"
        ),
        userName: toNonEmptyString(
          p.membership?.name ??
            p.membership?.userName ??
            p.name,
          "Unknown Participant"
        ),
        teamName: toNonEmptyString(p.membership?.teamName, "Unassigned"),
        isExecutive: Boolean(p.membership?.isExecutive),
      },
    })
  );

  return (
    <div className="min-h-screen bg-[#F9F9F7] p-8 font-sans selection:bg-[#8A6A2F] selection:text-white">
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <nav className="flex items-center gap-4">
          <Link
            href={`/admin/organisations/${campaign.organisationId}`}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> {campaign.organisation.name}
          </Link>
          <span className="text-neutral-200">/</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black">
            Campaign
          </span>
        </nav>

        <div className="flex gap-4">
          <AuditInvite
            campaignId={campaign.id}
            organisationId={campaign.organisationId}
          />
          <CampaignActions campaignId={campaign.id} variant="header" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        <div className="col-span-12 bg-white border border-neutral-200 p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-[#8A6A2F] text-white text-[8px] font-black uppercase tracking-[0.2em]">
                Active Audit
              </span>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest italic">
                Ref: {campaign.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">
              {campaign.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
                Team assessment campaign for{" "}
                <span className="text-black font-black">
                  {campaign.organisation.name}
                </span>
              </p>

              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-100 rounded-full">
                <Lock
                  className={`w-2.5 h-2.5 ${
                    isSafeToReport ? "text-green-600" : "text-amber-500"
                  }`}
                />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  Anonymity: {isSafeToReport ? "Secure" : "Buffering"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-16 relative z-10 mt-6 md:mt-0">
            <div className="text-right">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                Response Velocity
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-[#8A6A2F] tracking-tighter">
                  {completionRate}%
                </span>
              </div>
            </div>

            <div className="text-right border-l border-neutral-100 pl-16">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                Invited Cohort
              </p>
              <p className="text-5xl font-black tracking-tighter text-black">
                {totalInvited}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <Link
            href={`/admin/campaigns/${campaign.id}/report`}
            className={`group block bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 shadow-sm transition-all hover:shadow-md ${
              !isSafeToReport ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 group-hover:bg-[#8A6A2F]/20 transition-colors">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Executive Intelligence Brief
                  </h3>
                  <p className="text-[9px] text-white/50 mt-1">
                    Executive report · Team evidence · Constitutional guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  View Brief
                </span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {!isSafeToReport && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[8px] text-amber-400/80 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Executive snapshot requires {5 - completedCount} more responses
                  for anonymity threshold
                </p>
              </div>
            )}
          </Link>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white border border-neutral-200 shadow-sm">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#8A6A2F]" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">
                Participant Integrity Roster
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[8px] text-neutral-500">
              <Users className="w-3 h-3" />
              <span>
                {completedCount} / {totalInvited} completed
              </span>
            </div>
          </div>

          <ParticipantTable participants={participantsForTable} />
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8A6A2F]" /> Temporal Window
              </h3>
              <span className="text-[9px] font-black bg-neutral-100 px-2 py-1 uppercase tracking-widest">
                Day {daysActive + 1}
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-end border-b border-neutral-50 pb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Status
                </span>
                <span
                  className={`text-[11px] font-black uppercase ${
                    isSafeToReport
                      ? "text-green-600"
                      : "text-amber-600 animate-pulse"
                  }`}
                >
                  {isSafeToReport ? "Live Tracking" : "Threshold Pending"}
                </span>
              </div>

              <div className="flex justify-between items-end border-b border-neutral-50 pb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Completion Rate
                </span>
                <span className="text-[11px] font-black text-neutral-800">
                  {completionRate}%
                </span>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Active Participants
                </span>
                <span className="text-[11px] font-black text-neutral-800">
                  {completedCount}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black text-white p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="w-4 h-4 text-[#8A6A2F]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8A6A2F]">
                Live Resonance
              </h3>
            </div>

            <CampaignActions
              campaignId={campaign.id}
              variant="sidebar"
              disabled={!isSafeToReport}
            />

            {!isSafeToReport && (
              <p className="mt-6 text-[9px] text-neutral-500 italic leading-relaxed uppercase tracking-tighter">
                Executive Snapshots are locked until the anonymity threshold
                (n=5) is achieved.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}