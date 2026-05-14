export const dynamic = "force-dynamic";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import {
  Building2,
  ChevronRight,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "New Campaign | Abraham of London",
  description: "Select an organisation to create a new campaign",
  robots: "noindex, nofollow",
};

// ============================================================
// MAIN PAGE
// ============================================================

export default async function NewCampaignPage() {
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

  // Fetch organisations so the user can pick one
  let organisations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    _count: { campaigns: number };
  }> = [];

  try {
    const prisma = typeof (db as any)?.getPrismaClient === "function"
      ? await (db as any).getPrismaClient()
      : db;

    if (!prisma) {
      throw new Error("Database connection failed");
    }

    const rawOrgs = await prisma.organisation.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: { select: { campaigns: true } },
      },
      orderBy: { name: "asc" },
    });

    organisations = rawOrgs;
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

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin/campaigns"
              className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-white/70 transition-colors"
            >
              Campaigns
            </Link>
            <ChevronRight className="w-3 h-3 text-white/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500/70">
              New Campaign
            </span>
          </div>
          <h1 className="font-serif text-2xl text-white mb-2">
            New Campaign
          </h1>
          <p className="text-sm text-white/50 max-w-2xl">
            Select an organisation to create a new alignment campaign. Campaigns are deployed within the context of an organisation.
          </p>
        </div>

        {/* Organisation Selection */}
        <div className="border border-white/10 bg-zinc-950/70 overflow-hidden">
          <div className="border-b border-white/10 bg-black/30 px-5 py-3">
            <h2 className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Select Organisation
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {organisations.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organisations/${org.id}/campaigns/new`}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/15 transition-colors">
                    <Building2 className="w-5 h-5 text-white/50" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">{org.name}</p>
                    <p className="text-[9px] font-mono text-white/40 mt-0.5">
                      {org.slug} &middot; {org._count.campaigns} campaign{org._count.campaigns !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/70 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Create
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>

          {organisations.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-base font-light text-white/70 mb-2">No organisations available</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                Create an organisation first before deploying a campaign.
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
      </div>
    </div>
  );
}
