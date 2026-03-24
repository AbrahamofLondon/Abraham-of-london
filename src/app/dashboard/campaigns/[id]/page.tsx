import { getEnterpriseDashboardView } from "@/lib/services/database";
import { CampaignOverview } from "@/components/dashboard/CampaignOverview";
import { ChevronRight, Building2, Calendar } from "lucide-react";
import Link from "next/link";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dashboardData = await getEnterpriseDashboardView(id);

  if (!dashboardData) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Campaign Not Found</h1>
        <Link href="/dashboard/campaigns" className="text-sm text-blue-600 hover:underline">
          Return to Campaign Registry
        </Link>
      </div>
    );
  }

  const { campaign, organisation } = dashboardData;

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-white px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center space-x-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Registry</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-900">{organisation.name}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-8 pt-10">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-200 shadow-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                {campaign.title}
              </h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4" />
                Launched {new Date(campaign.createdAt).toLocaleDateString('en-GB')}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="font-medium text-blue-600 uppercase tracking-tight italic">
                {campaign.status} Campaign
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
              Export Brief
            </button>
            <button className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
              Manage Participants
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <CampaignOverview data={dashboardData} />
      </div>
    </main>
  );
}