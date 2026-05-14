export const dynamic = "force-dynamic";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { 
  FileText, 
  TrendingUp, 
  Activity, 
  Users, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Campaign Registry | Abraham of London",
  description: "Sovereign alignment campaign management",
  robots: "noindex, nofollow",
};

// ============================================================
// TYPES
// ============================================================

type CampaignWithRelations = {
  id: string;
  title: string | null;
  status: string;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
  organisation: {
    id: string;
    name: string | null;
  } | null;
  _count: {
    participants: number;
    correctionNodes: number;
  };
  participants: Array<{ id: string }>;
};

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { label: "ACTIVE", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    completed: { label: "COMPLETED", color: "bg-white/5 text-white/40 border-white/10" },
    paused: { label: "PAUSED", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    draft: { label: "DRAFT", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" }
  };

  const { label, color } = config[status as keyof typeof config] || config.draft;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[8px] font-mono uppercase tracking-wider border ${color}`}>
      {label}
    </span>
  );
}

function CompletionRate({ rate }: { rate: number }) {
  const color = rate >= 75 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-white/20";
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-white/50">{rate}%</span>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default async function CampaignsPage() {
  // Authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-xl font-light text-white/80 mb-2">Access Denied</h1>
          <p className="text-sm text-white/50">Authentication required</p>
          <Link href="/admin/login" className="inline-block mt-4 px-6 py-2 bg-white/10 text-white/80 text-xs uppercase tracking-wider border border-white/10">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch campaigns with proper error handling
  let campaigns: CampaignWithRelations[] = [];
  
  try {
    const prisma = typeof (db as any)?.getPrismaClient === "function" 
      ? await (db as any).getPrismaClient() 
      : db;

    if (!prisma) {
      throw new Error("Database connection failed");
    }

    const rawCampaigns = await prisma.alignmentCampaign.findMany({
      include: {
        organisation: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            participants: true,
            correctionNodes: true
          }
        },
        participants: {
          where: { status: "completed" },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    campaigns = rawCampaigns as CampaignWithRelations[];
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-light text-white/80 mb-2">Database Error</h1>
          <p className="text-sm text-white/50">Unable to connect to the registry</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-block mt-4 px-6 py-2 bg-white/10 text-white/80 text-xs uppercase tracking-wider border border-white/10 hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics with proper typing
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((campaign: CampaignWithRelations) => campaign.status === "active").length;
  const totalParticipants = campaigns.reduce((sum: number, campaign: CampaignWithRelations) => sum + campaign._count.participants, 0);
  const activeRate = totalCampaigns > 0 ? Math.round((activeCampaigns / totalCampaigns) * 100) : 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-amber-500/70">
            Campaign Registry
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Campaign Registry
          </h1>
          <p className="mt-1 text-sm text-white/50 max-w-2xl">
            Manage sovereign alignment campaigns, track participation, and access executive intelligence briefs.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Total</span>
            </div>
            <p className="text-3xl font-light text-white">{totalCampaigns}</p>
            <p className="text-xs text-white/50 mt-1">Active Campaigns</p>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-[9px]">
                <span className="text-white/40">Active</span>
                <span className="font-mono text-white/70">{activeCampaigns}</span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Participants</span>
            </div>
            <p className="text-3xl font-light text-white">{totalParticipants}</p>
            <p className="text-xs text-white/50 mt-1">Across all campaigns</p>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Completion</span>
            </div>
            <p className="text-3xl font-light text-white">{activeRate}%</p>
            <p className="text-xs text-white/50 mt-1">Active rate</p>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="border border-white/10 bg-zinc-950/70 overflow-hidden">
          <div className="border-b border-white/10 bg-black/30 px-5 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Campaign Registry
              </h2>
              <Link
                href="/admin/campaigns/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-wider text-white/60 hover:bg-white/10 transition-colors"
              >
                New Campaign
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Participants
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Completion
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Created
                  </th>
                  <th className="text-right py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Actions
                  </th>
                 </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign: CampaignWithRelations) => {
                  const completedCount = campaign.participants?.length || 0;
                  const totalCount = campaign._count.participants;
                  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  
                  return (
                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-5">
                        <div>
                          <p className="text-sm text-white/80">{campaign.title || "Unnamed Campaign"}</p>
                          <p className="text-[9px] font-mono text-white/30 mt-0.5">
                            {campaign.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        {campaign.organisation ? (
                          <Link 
                            href={`/admin/organisations/${campaign.organisationId}`}
                            className="text-sm text-white/50 hover:text-white/80 transition-colors"
                          >
                            {campaign.organisation.name || "Unknown"}
                          </Link>
                        ) : (
                          <span className="text-sm text-white/30">Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="py-3 px-5">
                        <div>
                          <p className="text-sm text-white/70">{completedCount} / {totalCount}</p>
                          <p className="text-[8px] font-mono text-white/30 mt-0.5">
                            {campaign._count.correctionNodes} corrections
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <CompletionRate rate={completionRate} />
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/campaigns/${campaign.id}/report`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 transition-all"
                            title="Executive Intelligence Brief"
                          >
                            <FileText className="w-3 h-3" />
                            Brief
                          </Link>
                          
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 transition-all"
                            title="Campaign Details"
                          >
                            <Eye className="w-3 h-3" />
                            Details
                          </Link>
                          
                          {completedCount > 0 && (
                            <Link
                              href={`/admin?campaign=${campaign.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 transition-all"
                              title="Live Analytics"
                            >
                              <BarChart3 className="w-3 h-3" />
                              Analytics
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-base font-light text-white/70 mb-2">No campaigns yet</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                Create your first sovereign alignment campaign to begin tracking institutional resonance.
              </p>
              <Link
                href="/admin/campaigns/new"
                className="inline-block px-6 py-3 border border-white/10 bg-white/5 text-white/70 text-[10px] font-mono uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Create Campaign
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[8px] text-white/30 font-mono">
              Sovereign Alignment Registry • OGR-IV Protocol
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[7px] text-white/30">{totalCampaigns} campaigns</span>
              <span className="text-[7px] text-white/30">{totalParticipants} participants</span>
              <span className="text-[7px] text-white/30">Canary Wharf Node</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}