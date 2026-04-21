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
    active: { label: "ACTIVE", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    inactive: { label: "INACTIVE", color: "bg-neutral-500/10 text-neutral-600 border-neutral-200" },
    suspended: { label: "SUSPENDED", color: "bg-red-500/10 text-red-600 border-red-200" },
    pending: { label: "PENDING", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  };

  const { label, color } = config[status] || { label: status.toUpperCase(), color: "bg-neutral-500/10 text-neutral-600 border-neutral-200" };

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-light text-neutral-800 mb-2">Database Error</h1>
          <p className="text-sm text-neutral-500">Unable to connect to the registry</p>
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
            Organisation Registry
          </h1>
          <p className="text-sm text-neutral-500 max-w-2xl">
            Manage sovereign alignment organisations, track membership, and oversee campaign deployments.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Building2 className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Total</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{totalOrganisations}</p>
            <p className="text-xs text-neutral-500 mt-1">Organisations</p>
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex justify-between text-[9px]">
                <span className="text-neutral-500">Active</span>
                <span className="font-mono text-neutral-700">{activeOrganisations}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Members</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{totalMembers}</p>
            <p className="text-xs text-neutral-500 mt-1">Across all organisations</p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Campaigns</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">{totalCampaigns}</p>
            <p className="text-xs text-neutral-500 mt-1">Total campaigns</p>
          </div>

          <div className="bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-400">Rate</span>
            </div>
            <p className="text-3xl font-light tracking-tight text-neutral-900">
              {totalOrganisations > 0 ? Math.round((activeOrganisations / totalOrganisations) * 100) : 0}%
            </p>
            <p className="text-xs text-neutral-500 mt-1">Active rate</p>
          </div>
        </div>

        {/* Organisations Table */}
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Organisation Registry
              </h2>
              <Link
                href="/admin/organisations/new"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-[9px] font-mono uppercase tracking-wider hover:bg-black transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Organisation
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-white">
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Sector
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Members
                  </th>
                  <th className="text-left py-3 px-6 text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
                    Campaigns
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
                {organisations.map((org: OrganisationWithRelations) => (
                  <tr key={org.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-6">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{org.name}</p>
                        <p className="text-[9px] font-mono text-neutral-400 mt-0.5">
                          {org.slug}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-sm text-neutral-600">{org.sector || "\u2014"}</span>
                    </td>
                    <td className="py-3 px-6">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-sm text-neutral-700">{org._count.memberships}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-sm text-neutral-700">{org._count.campaigns}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <Link
                        href={`/admin/organisations/${org.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition-all rounded"
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
              <div className="inline-flex p-4 bg-neutral-100 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-base font-light text-neutral-700 mb-2">No organisations yet</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                Create your first organisation to begin deploying sovereign alignment campaigns.
              </p>
              <Link
                href="/admin/organisations/new"
                className="inline-block px-6 py-3 bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider hover:bg-black transition-colors"
              >
                Create Organisation
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[8px] text-neutral-400 font-mono">
              Sovereign Alignment Registry &bull; OGR-IV Protocol
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[7px] text-neutral-400">{totalOrganisations} organisations</span>
              <span className="text-[7px] text-neutral-400">{totalMembers} members</span>
              <span className="text-[7px] text-neutral-400">Canary Wharf Node</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
