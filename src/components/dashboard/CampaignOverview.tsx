"use client"

import { EnterpriseDashboardView } from "@/lib/alignment/enterprise-types";
import { 
  formatEnterpriseBand, 
  formatDomainLabel 
} from "@/lib/utils/enterprise-formatters";
import { 
  ShieldAlert, 
  Users2, 
  Target, 
  Zap, 
  ArrowUpRight,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";

export function CampaignOverview({ data }: { data: EnterpriseDashboardView }) {
  const { organisationSnapshot, leadershipGap, teamSnapshots } = data;

  if (!organisationSnapshot) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <Zap className="mb-4 h-10 w-10 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Awaiting Data Ingress</h3>
        <p className="max-w-xs text-sm text-slate-500 italic">
          The intelligence engine is ready. Snapshots will generate automatically once the first response is verified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 1. PRIMARY INTELLIGENCE METRICS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Alignment"
          value={`${organisationSnapshot.percentScore}%`}
          detail={formatEnterpriseBand(organisationSnapshot.band)}
          variant="primary"
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Participation"
          value={`${organisationSnapshot.completionRate}%`}
          detail={`${organisationSnapshot.respondentCount} of ${organisationSnapshot.invitedCount}`}
          variant="neutral"
          icon={<Users2 className="h-5 w-5" />}
        />
        <StatCard
          title="Leadership Gap"
          value={`${leadershipGap?.overallGapPercent ?? 0}%`}
          detail="Perception Delta"
          variant={(leadershipGap?.overallGapPercent ?? 0) > 15 ? "warning" : "neutral"}
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
        <StatCard
          title="Fragility Signal"
          value={organisationSnapshot.fragilitySignal || "LOW"}
          detail="Structural Risk"
          variant={organisationSnapshot.fragilitySignal === "HIGH" ? "danger" : "neutral"}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* 2. DOMAIN DEPTH ANALYSIS */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Alignment Depth</h2>
          <p className="text-sm text-slate-500 font-medium italic">Domain-specific performance across the organization</p>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {organisationSnapshot.domainScores.map((score) => (
            <div key={score.domain} className="group space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                  {formatDomainLabel(score.domain)}
                </span>
                <span className="text-sm font-bold text-slate-900">{score.percent}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(score.percent)}`}
                  style={{ width: `${score.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TEAM INTELLIGENCE REGISTRY */}
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Team Intelligence Registry</h2>
            <p className="text-sm text-slate-500 font-medium italic">Cross-functional alignment delta and respondent density</p>
          </div>
          <div className="flex items-center space-x-2 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">{teamSnapshots.length} Functional Units</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <th className="pb-4 pl-2">Functional Unit</th>
                <th className="pb-4">Status Band</th>
                <th className="pb-4">Score</th>
                <th className="pb-4 text-center">Respondents</th>
                <th className="pb-4">Primary Friction</th>
                <th className="pb-4 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teamSnapshots.map((team) => (
                <tr key={team.teamName} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 pl-2">
                    <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {team.teamName}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${getBandStyles(team.band)}`}>
                      {formatEnterpriseBand(team.band)}
                    </div>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-700">{team.percentScore}%</span>
                      {team.percentScore < 60 ? (
                        <TrendingDown className="h-3 w-3 text-rose-500" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-5 text-center text-sm font-medium text-slate-500">
                    {team.respondentCount}
                  </td>
                  <td className="py-5">
                    {team.weakestDomains.length > 0 ? (
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-tight">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span>{formatDomainLabel(team.weakestDomains[0])}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-5 text-right pr-2">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 underline-offset-4 hover:underline transition-all">
                      View Brief
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* --- INTERNAL SUB-COMPONENTS --- */

interface StatCardProps {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  variant: "primary" | "neutral" | "warning" | "danger";
}

function StatCard({ title, value, detail, icon, variant }: StatCardProps) {
  const styles = {
    primary: "bg-blue-600 text-white shadow-blue-100",
    neutral: "bg-white text-slate-900 border-slate-200",
    warning: "bg-amber-50 text-amber-900 border-amber-100",
    danger: "bg-rose-50 text-rose-900 border-rose-100"
  };

  const labelStyles = variant === "primary" ? "text-blue-100" : "text-slate-500";
  const detailStyles = variant === "primary" ? "text-blue-200" : "text-slate-400 font-bold tracking-tight";

  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-6 shadow-sm transition-all hover:shadow-md ${styles[variant]}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${labelStyles}`}>
          {title}
        </span>
        <div className={variant === "primary" ? "text-blue-200" : "text-slate-300"}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black tracking-tighter italic">{value}</div>
      <div className={`mt-1 text-[11px] uppercase tracking-wider ${detailStyles}`}>
        {detail}
      </div>
    </div>
  );
}

/* --- UTILS --- */

function getBarColor(percent: number) {
  if (percent >= 85) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
  if (percent >= 65) return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
  if (percent >= 45) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
  return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
}

function getBandStyles(band: string) {
  switch (band) {
    case "ALIGNED":
      return "bg-emerald-50 border-emerald-100 text-emerald-700";
    case "DRIFTING":
      return "bg-blue-50 border-blue-100 text-blue-700";
    case "MISALIGNED":
      return "bg-amber-50 border-amber-100 text-amber-700";
    case "DISORDERED":
      return "bg-rose-50 border-rose-100 text-rose-700";
    default:
      return "bg-slate-50 border-slate-100 text-slate-700";
  }
}