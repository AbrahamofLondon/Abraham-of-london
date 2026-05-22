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

function toNonEmptyString(value: unknown, defaultValue: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return defaultValue;
}

// ============================================================================
// 404 COMPONENT
// ============================================================================

function CampaignNotFound() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="max-w-md w-full border border-white/10 bg-zinc-950/70 p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-white/30" />
        </div>
        <h1 className="text-xl font-serif text-white/80 mb-2">
          Campaign Not Found
        </h1>
        <p className="text-sm text-white/50 leading-relaxed mb-8">
          The requested campaign could not be found.
        </p>
        <Link
          href="/admin/campaigns"
          className="inline-block px-6 py-3 border border-white/10 bg-white/5 text-white/70 text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-colors"
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <nav className="flex items-center gap-3">
          <Link
            href={`/admin/organisations/${campaign.organisationId}`}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> {campaign.organisation.name}
          </Link>
          <span className="text-white/15">/</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">
            Campaign
          </span>
        </nav>

        <div className="flex gap-3">
          <AuditInvite
            campaignId={campaign.id}
            organisationId={campaign.organisationId}
          />
          <CampaignActions campaignId={campaign.id} variant="header" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <div className="col-span-12 border border-white/10 bg-zinc-950/70 p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[8px] font-mono uppercase tracking-[0.2em]">
                Active Audit
              </span>
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                Ref: {campaign.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <h1 className="font-serif text-3xl text-white mb-2">
              {campaign.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-[11px] font-mono text-white/50 uppercase tracking-widest">
                Team assessment campaign for{" "}
                <span className="text-white/80">
                  {campaign.organisation.name}
                </span>
              </p>

              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
                <Lock
                  className={`w-2.5 h-2.5 ${
                    isSafeToReport ? "text-emerald-400" : "text-amber-400"
                  }`}
                />
                <span className="text-[8px] font-mono uppercase tracking-widest text-white/50">
                  Anonymity: {isSafeToReport ? "Secure" : "Buffering"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-12 relative z-10 mt-6 md:mt-0">
            <div className="text-right">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                Response Velocity
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-serif text-amber-400/80 tracking-tighter">
                  {completionRate}%
                </span>
              </div>
            </div>

            <div className="text-right border-l border-white/10 pl-12">
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                Invited Cohort
              </p>
              <p className="text-4xl font-serif text-white">
                {totalInvited}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <Link
            href={`/admin/campaigns/${campaign.id}/report`}
            className={`group block border border-white/10 bg-zinc-950/70 p-6 transition-all hover:border-white/20 ${
              !isSafeToReport ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 group-hover:bg-amber-500/10 transition-colors">
                  <FileText className="w-6 h-6 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-white/80">
                    Executive Intelligence Brief
                  </h3>
                  <p className="text-[9px] text-white/40 mt-1">
                    Executive report · Team evidence · Constitutional guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/40 group-hover:text-white/70 transition-colors">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  View Brief
                </span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {!isSafeToReport && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[8px] text-amber-400/70 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Executive snapshot requires {5 - completedCount} more responses
                  to reach the anonymity review point
                </p>
              </div>
            )}
          </Link>
        </div>

        <div className="col-span-12">
          <Link
            href={`/admin/campaigns/${campaign.id}/enterprise-report`}
            className={`group block border border-amber-500/20 bg-amber-500/[0.04] p-6 transition-all hover:border-amber-500/40 ${
              !isSafeToReport ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Activity className="w-6 h-6 text-amber-400/70" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-amber-300/80">
                    Enterprise Decision Report
                  </h3>
                  <p className="text-[9px] text-white/40 mt-1">
                    Full pipeline · Constitution · Fragility radar · Enforcement directive
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-400/40 group-hover:text-amber-400/70 transition-colors">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  View Report
                </span>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            {!isSafeToReport && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[8px] text-amber-400/70 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Enterprise report requires {5 - completedCount} more responses
                </p>
              </div>
            )}
          </Link>
        </div>

        <div className="col-span-12 lg:col-span-8 border border-white/10 bg-zinc-950/70">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/30">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400/60" />
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                Participant Integrity Roster
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[8px] text-white/40">
              <Users className="w-3 h-3" />
              <span>
                {completedCount} / {totalInvited} completed
              </span>
            </div>
          </div>

          <ParticipantTable participants={participantsForTable} />
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="border border-white/10 bg-zinc-950/70 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400/60" /> Temporal Window
              </h3>
              <span className="text-[9px] font-mono bg-white/5 px-2 py-1 uppercase tracking-widest text-white/50">
                Day {daysActive + 1}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Status
                </span>
                <span
                  className={`text-[11px] font-mono uppercase ${
                    isSafeToReport
                      ? "text-emerald-400"
                      : "text-amber-400 animate-pulse"
                  }`}
                >
                  {isSafeToReport ? "Live Tracking" : "Review Point Pending"}
                </span>
              </div>

              <div className="flex justify-between items-end border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Completion Rate
                </span>
                <span className="text-[11px] font-mono text-white/70">
                  {completionRate}%
                </span>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Active Participants
                </span>
                <span className="text-[11px] font-mono text-white/70">
                  {completedCount}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-amber-400/60" />
              <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400/70">
                Live Resonance
              </h3>
            </div>

            <CampaignActions
              campaignId={campaign.id}
              variant="sidebar"
              disabled={!isSafeToReport}
            />

            {!isSafeToReport && (
              <p className="mt-6 text-[9px] text-white/40 leading-relaxed">
                Executive Snapshots are locked until the anonymity review point
                (n=5) is achieved.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
