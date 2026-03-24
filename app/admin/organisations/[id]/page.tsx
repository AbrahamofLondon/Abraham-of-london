import { notFound } from "next/navigation";
import { 
  getEnterpriseDashboardView 
} from "@/lib/alignment/enterprise-repository";
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle, 
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Plus
} from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default async function OrganisationDetailPage({ params }: Props) {
  const data = await getEnterpriseDashboardView(params.id);

  if (!data) {
    // If no dashboard view is found for this ID, check if it's just a 
    // fresh org without a campaign yet by trying to fetch the basic org
    // (Logic simplified here for the view)
    return notFound();
  }

  const { organisation, organisationSnapshot, teamSnapshots, leadershipGap } = data;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9F7F2] font-mono">
      {/* Top Navigation Bar */}
      <nav className="border-b border-white/10 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#8A6A2F] flex items-center justify-center font-black text-xs text-white">
            {organisation.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest">{organisation.name}</h1>
            <p className="text-[9px] text-neutral-500 uppercase tracking-tighter">
              ID: {organisation.id} // {organisation.sector || "General Sector"}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link 
            href={`/admin/organisations/${organisation.id}/campaigns/new`}
            className="flex items-center gap-2 px-4 py-2 border border-[#8A6A2F] text-[#8A6A2F] text-[10px] uppercase font-bold hover:bg-[#8A6A2F] hover:text-white transition-all"
          >
            <Plus className="w-3 h-3" /> New Campaign
          </Link>
        </div>
      </nav>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
        
        {/* STATS GRID: OGR CORE METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            label="Alignment Score" 
            value={organisationSnapshot?.percentScore ? `${Math.round(organisationSnapshot.percentScore)}%` : "N/A"} 
            subLabel={organisationSnapshot?.band || "No Data"}
            icon={<Target className="w-4 h-4 text-[#8A6A2F]" />}
          />
          <StatCard 
            label="Response Rate" 
            value={organisationSnapshot?.completionRate ? `${Math.round(organisationSnapshot.completionRate * 100)}%` : "0%"} 
            subLabel={`${organisationSnapshot?.respondentCount || 0} Respondents`}
            icon={<Users className="w-4 h-4 text-[#8A6A2F]" />}
          />
          <StatCard 
            label="Fragility Signal" 
            value={organisationSnapshot?.fragilitySignal || "LOW"} 
            subLabel="Risk Assessment"
            icon={<AlertTriangle className="w-4 h-4 text-[#8A6A2F]" />}
          />
          <StatCard 
            label="Resonance" 
            value="Stable" 
            subLabel="Structural Health"
            icon={<ShieldCheck className="w-4 h-4 text-[#8A6A2F]" />}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT: Strategic Gaps & Strengths */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white/[0.02] border border-white/5 p-8">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8A6A2F] font-bold mb-8 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Domain Performance Matrix
              </h3>
              
              <div className="space-y-6">
                {organisationSnapshot?.domainScores.map((ds) => (
                  <div key={ds.domain}>
                    <div className="flex justify-between text-[10px] uppercase mb-2">
                      <span className="text-neutral-400">{ds.domain.replace(/_/g, ' ')}</span>
                      <span className="text-white font-bold">{Math.round(ds.percentScore)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-[#8A6A2F] transition-all duration-1000" 
                        style={{ width: `${ds.percentScore}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!organisationSnapshot && (
                  <div className="py-12 text-center text-neutral-600 text-xs italic">
                    Waiting for first campaign assessment data...
                  </div>
                )}
              </div>
            </section>

            {/* TEAM BREAKDOWN */}
            <section className="space-y-6">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Team Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamSnapshots.map((team) => (
                  <div key={team.teamName} className="border border-white/5 p-5 hover:bg-white/[0.03] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-bold uppercase">{team.teamName}</h4>
                      <span className={`text-[9px] px-2 py-1 font-bold ${team.band === 'ALIGNED' ? 'bg-green-900/20 text-green-500' : 'bg-[#8A6A2F]/20 text-[#8A6A2F]'}`}>
                        {team.band}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 space-y-1">
                      <p>SCORE: {Math.round(team.percentScore)}%</p>
                      <p>PARTICIPANTS: {team.respondentCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Leadership Gap & Reports */}
          <div className="space-y-12">
            <section className="bg-[#8A6A2F]/5 border border-[#8A6A2F]/20 p-8 text-center">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#8A6A2F] font-bold mb-4">Leadership Gap</h3>
              <div className="text-5xl font-serif italic text-white mb-2">
                {leadershipGap ? `${Math.round(leadershipGap.overallGapPercent)}%` : "--"}
              </div>
              <p className="text-[9px] text-neutral-500 uppercase leading-relaxed">
                Difference between executive vision and operational reality.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold mb-4">Intelligence Reports</h3>
              <div className="space-y-2">
                <ReportButton label="Executive Alignment Brief" date="Pending" />
                <ReportButton label="Operational Stress Report" date="Pending" />
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

/** ATOMIC COMPONENTS **/

function StatCard({ label, value, subLabel, icon }: { label: string; value: string; subLabel: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">{label}</span>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white uppercase tracking-tight">{value}</div>
        <div className="text-[10px] text-[#8A6A2F] uppercase mt-1 font-bold">{subLabel}</div>
      </div>
    </div>
  );
}

function ReportButton({ label, date }: { label: string; date: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 border border-white/5 hover:border-white/20 transition-all text-left group">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-neutral-500 group-hover:text-[#8A6A2F]" />
        <span className="text-[10px] uppercase font-bold tracking-tight text-neutral-300">{label}</span>
      </div>
      <span className="text-[9px] text-neutral-600">{date}</span>
    </button>
  );
}