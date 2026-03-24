"use client"

import { TeamSnapshotView } from "@/lib/alignment/enterprise-types";
import { formatEnterpriseBand } from "@/lib/utils/enterprise-formatters";
import { Users, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface TeamIntelligenceTableProps {
  teams: TeamSnapshotView[];
}

export function TeamIntelligenceTable({ teams }: { teams: TeamSnapshotView[] }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 text-uppercase">Team Intelligence Registry</h2>
          <p className="text-sm text-slate-500 font-medium italic">Cross-functional alignment delta and respondent density</p>
        </div>
        <div className="flex items-center space-x-2 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{teams.length} Functional Units Cached</span>
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
            {teams.map((team) => (
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
                      <span>{team.weakestDomains[0].replace(/_/g, ' ')}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="py-5 text-right pr-2">
                  <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 underline-offset-4 hover:underline">
                    View Brief
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
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