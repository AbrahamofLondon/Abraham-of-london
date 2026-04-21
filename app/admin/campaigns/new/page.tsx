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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-light text-neutral-800 mb-2">Database Error</h1>
          <p className="text-sm text-neutral-500">Unable to connect to the registry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/admin/campaigns"
              className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Campaigns
            </Link>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500 font-semibold">
              New Campaign
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-900 mb-4">
            New Campaign
          </h1>
          <p className="text-sm text-neutral-500 max-w-2xl">
            Select an organisation to create a new alignment campaign. Campaigns are deployed within the context of an organisation.
          </p>
        </div>

        {/* Organisation Selection */}
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
            <h2 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Select Organisation
            </h2>
          </div>

          <div className="divide-y divide-neutral-100">
            {organisations.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organisations/${org.id}/campaigns/new`}
                className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 group-hover:bg-neutral-200 transition-colors">
                    <Building2 className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{org.name}</p>
                    <p className="text-[9px] font-mono text-neutral-400 mt-0.5">
                      {org.slug} &middot; {org._count.campaigns} campaign{org._count.campaigns !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-neutral-400 group-hover:text-neutral-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Create
                  <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>

          {organisations.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-neutral-100 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-base font-light text-neutral-700 mb-2">No organisations available</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                Create an organisation first before deploying a campaign.
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
      </div>
    </div>
  );
}
