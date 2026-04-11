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
    active: { label: "ACTIVE", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    completed: { label: "COMPLETED", color: "bg-neutral-500/10 text-neutral-600 border-neutral-200" },
    paused: { label: "PAUSED", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
    draft: { label: "DRAFT", color: "bg-blue-500/10 text-blue-600 border-blue-200" }
  };

  const { label, color } = config[status as keyof typeof config] || config.draft;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[8px] font-mono uppercase tracking-wider border ${color}`}>
      {label}
    </span>
  );
}

function CompletionRate({ rate }: { rate: number }) {
  const color = rate >= 75 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-neutral-500";
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-neutral-600">{rate}%</span>
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-xl font-light text-neutral-800 mb-2">Access Denied</h1>
          <p className="text-sm text-neutral-500">Authentication required</p>
          <Link href="/admin/login" className="inline-block mt-4 px-6 py-2 bg-neutral-900 text-white text-xs uppercase tracking-wider">
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-light text-neutral-800 mb-2">Database Error</h1>
          <p className="text-sm text-neutral-500">Unable to connect to the registry</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-block mt-4 px-6 py-2 bg-neutral-900 text-white text-xs uppercase tracking-wider hover:bg-black transition-colors"
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
    <div className="min-h-screen bg-neutral-50 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-12 bg-neutral-400" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500 font-semibold">
              Sovereign Registry
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-4">
            Campaign Registry
          </h1>
          <p className="text-sm text-neutral-500 max-w-2xl">
            Manage sovereign alignment campaigns, track participation, and access executive intelligence briefs.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Total</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{totalCampaigns}</p>
            <p className="text-xs text-neutral-500 mt-1">Active Campaigns</p>
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-neutral-500">Active</span>
                <span className="font-mono text-neutral-700">{activeCampaigns}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Participants</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{totalParticipants}</p>
            <p className="text-xs text-neutral-500 mt-1">Across all campaigns</p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Completion</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{activeRate}%</p>
            <p className="text-xs text-neutral-500 mt-1">Active rate</p>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Campaign Registry
              </h2>
              <Link
                href="/admin/campaigns/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-[9px] font-mono uppercase tracking-wider hover:bg-black transition-colors"
              >
                New Campaign
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-white">
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Participants
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Completion
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Created
                  </th>
                  <th className="text-right py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
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
                    <tr key={campaign.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-6">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{campaign.title || "Unnamed Campaign"}</p>
                          <p className="text-[9px] font-mono text-neutral-400 mt-0.5">
                            {campaign.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        {campaign.organisation ? (
                          <Link 
                            href={`/admin/organisations/${campaign.organisationId}`}
                            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                          >
                            {campaign.organisation.name || "Unknown"}
                          </Link>
                        ) : (
                          <span className="text-sm text-neutral-400">Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="py-3 px-6">
                        <div>
                          <p className="text-sm text-neutral-700">{completedCount} / {totalCount}</p>
                          <p className="text-[8px] font-mono text-neutral-400 mt-0.5">
                            {campaign._count.correctionNodes} corrections
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <CompletionRate rate={completionRate} />
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Report Button - Executive Intelligence Brief */}
                          <Link
                            href={`/admin/campaigns/${campaign.id}/report`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition-all rounded"
                            title="Executive Intelligence Brief"
                          >
                            <FileText className="w-3 h-3" />
                            Brief
                          </Link>
                          
                          {/* View Campaign Details */}
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition-all rounded"
                            title="Campaign Details"
                          >
                            <Eye className="w-3 h-3" />
                            Details
                          </Link>
                          
                          {/* Live Analytics (if completed participants) */}
                          {completedCount > 0 && (
                            <Link
                              href={`/dashboard/live?campaign=${campaign.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition-all rounded"
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
              <div className="inline-flex p-4 bg-neutral-100 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-base font-light text-neutral-700 mb-2">No campaigns yet</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                Create your first sovereign alignment campaign to begin tracking institutional resonance.
              </p>
              <Link
                href="/admin/campaigns/new"
                className="inline-block px-6 py-3 bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-black transition-colors"
              >
                Create Campaign
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[8px] text-neutral-400 font-mono">
              Sovereign Alignment Registry • OGR-IV Protocol
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[7px] text-neutral-400">{totalCampaigns} campaigns</span>
              <span className="text-[7px] text-neutral-400">{totalParticipants} participants</span>
              <span className="text-[7px] text-neutral-400">Canary Wharf Node</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}