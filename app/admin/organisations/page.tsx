export const dynamic = "force-dynamic";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import {
  Building2,
  Users,
  Target,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Plus,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Organisation Registry | Abraham of London",
  description: "Sovereign alignment organisation management",
  robots: "noindex, nofollow",
};

// ============================================================
// TYPES
// ============================================================

type OrganisationWithRelations = {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  sizeBand: string | null;
  region: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    memberships: number;
    campaigns: number;
  };
};

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    active: { label: "ACTIVE", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    inactive: { label: "INACTIVE", color: "bg-white/5 text-white/40 border-white/10" },
    suspended: { label: "SUSPENDED", color: "bg-red-500/10 text-red-300 border-red-500/20" },
    pending: { label: "PENDING", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  };

  const { label, color } = config[status] || { label: status.toUpperCase(), color: "bg-white/5 text-white/40 border-white/10" };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-[8px] font-mono uppercase tracking-wider border ${color}`}>
      {label}
    </span>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default async function OrganisationsPage() {
  // Authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-xl font-light text-white/80 mb-2">Access Denied</h1>
          <p className="text-sm text-white/50">Authentication required</p>
          <Link href="/admin/login" className="inline-block mt-4 px-6 py-2 border border-white/10 bg-white/5 text-white/70 text-xs uppercase tracking-wider">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch organisations with proper error handling
  let organisations: OrganisationWithRelations[] = [];

  try {
    const prisma = typeof (db as any)?.getPrismaClient === "function"
      ? await (db as any).getPrismaClient()
      : db;

    if (!prisma) {
      throw new Error("Database connection failed");
    }

    const rawOrganisations = await prisma.organisation.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    organisations = rawOrganisations as OrganisationWithRelations[];
  } catch (error) {
    console.error("Failed to fetch organisations:", error);
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-light text-white/80 mb-2">Database Error</h1>
          <p className="text-sm text-white/50">Unable to connect to the registry</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalOrganisations = organisations.length;
  const activeOrganisations = organisations.filter((org) => org.status === "active").length;
  const totalMembers = organisations.reduce((sum, org) => sum + org._count.memberships, 0);
  const totalCampaigns = organisations.reduce((sum, org) => sum + org._count.campaigns, 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-amber-500/70">
            Organisation Registry
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Organisation Registry
          </h1>
          <p className="mt-1 text-sm text-white/50 max-w-2xl">
            Manage sovereign alignment organisations, track membership, and oversee campaign deployments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Building2 className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Total</span>
            </div>
            <p className="text-3xl font-light text-white">{totalOrganisations}</p>
            <p className="text-xs text-white/50 mt-1">Organisations</p>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-[9px]">
                <span className="text-white/40">Active</span>
                <span className="font-mono text-white/70">{activeOrganisations}</span>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Members</span>
            </div>
            <p className="text-3xl font-light text-white">{totalMembers}</p>
            <p className="text-xs text-white/50 mt-1">Across all organisations</p>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Campaigns</span>
            </div>
            <p className="text-3xl font-light text-white">{totalCampaigns}</p>
            <p className="text-xs text-white/50 mt-1">Total campaigns</p>
          </div>

          <div className="border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-white/40" />
              <span className="text-[10px] font-mono text-white/30">Rate</span>
            </div>
            <p className="text-3xl font-light text-white">
              {totalOrganisations > 0 ? Math.round((activeOrganisations / totalOrganisations) * 100) : 0}%
            </p>
            <p className="text-xs text-white/50 mt-1">Active rate</p>
          </div>
        </div>

        {/* Organisations Table */}
        <div className="border border-white/10 bg-zinc-950/70 overflow-hidden">
          <div className="border-b border-white/10 bg-black/30 px-5 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Organisation Registry
              </h2>
              <Link
                href="/admin/organisations/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 text-[9px] font-mono uppercase tracking-wider text-white/60 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Organisation
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Sector
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Members
                  </th>
                  <th className="text-left py-3 px-5 text-[8px] font-mono uppercase tracking-wider text-white/35 font-medium">
                    Campaigns
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
                {organisations.map((org: OrganisationWithRelations) => (
                  <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{org.name}</p>
                        <p className="text-[9px] font-mono text-neutral-400 mt-0.5">
                          {org.slug}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-sm text-white/50">{org.sector || "\u2014"}</span>
                    </td>
                    <td className="py-3 px-5">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-sm text-white/70">{org._count.memberships}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-sm text-white/70">{org._count.campaigns}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1 text-[10px] text-white/40">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/admin/organisations/${org.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 transition-all"
                      >
                        Details
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {organisations.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-base font-light text-white/70 mb-2">No organisations yet</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                Create your first organisation to begin deploying sovereign alignment campaigns.
              </p>
              <Link
                href="/admin/organisations/new"
                className="inline-block px-6 py-3 border border-white/10 bg-white/5 text-white/70 text-[10px] font-mono uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Create Organisation
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[8px] text-white/30 font-mono">
              Sovereign Alignment Registry &bull; OGR-IV Protocol
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[7px] text-white/30">{totalOrganisations} organisations</span>
              <span className="text-[7px] text-white/30">{totalMembers} members</span>
              <span className="text-[7px] text-white/30">Canary Wharf Node</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
