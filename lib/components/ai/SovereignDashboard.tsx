"use client";

import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Crown, 
  Activity,
  Compass,
  Feather,
  Lock,
  Eye,
  Scale,
  Target
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts';
import { DealFusionResult, DealFusionInput } from '@/lib/ai/deal-fusion';

interface SovereignDashboardProps {
  result: DealFusionResult;
  input: DealFusionInput;
}

// Institutional color palette
const COLORS = {
  gold: "#B58A3A",
  goldDeep: "#8A6A2F",
  goldWash: "#F8F1E4",
  ink: "#121212",
  inkSoft: "#2C2C2C",
  muted: "#666666",
  paper: "#FFFFFF",
  panel: "#FAF8F3",
  ivory: "#F7F3EC",
  success: "#204F3E",
  warning: "#B58A3A",
  danger: "#8E2F2F",
};

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({ result, input }) => {
  const isSovereign = result.priority === "SOVEREIGN";
  
  // Data for the Signal Balance Radar
  const radarData = [
    { subject: 'Institutional Score', A: input.ruleScore, fullMark: 100 },
    { subject: 'Assessment Score', A: input.aiScore, fullMark: 100 },
    { subject: 'Certainty Index', A: result.routeConfidence, fullMark: 100 },
    { subject: 'Resonance', A: result.fusedScore, fullMark: 100 },
    { subject: 'Authority', A: input.authority ? 100 : 20, fullMark: 100 },
  ];

  const getPriorityColor = (priority: string) => {
    if (priority === "SOVEREIGN") return `text-[${COLORS.gold}]`;
    if (priority === "HIGH") return "text-emerald-500";
    if (priority === "MEDIUM") return "text-blue-500";
    return "text-slate-500";
  };

  const getStatusBadge = (route: string) => {
    if (route === "STRATEGY") return { label: "Chamber Priority", icon: Crown, bg: "bg-[#B58A3A]/10", border: "border-[#B58A3A]/20" };
    if (route === "DIAGNOSTIC") return { label: "Structured Review", icon: Compass, bg: "bg-blue-500/10", border: "border-blue-500/20" };
    return { label: "Observational Track", icon: Eye, bg: "bg-slate-500/10", border: "border-slate-500/20" };
  };

  const statusBadge = getStatusBadge(result.route);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="w-full bg-[#FAF8F3] border border-[#E7DFD1] rounded-sm shadow-sm font-sans selection:bg-[#B58A3A]/30 selection:text-[#121212]">
      
      {/* HEADER: Institutional Deal Identity */}
      <div className="p-6 border-b border-[#E7DFD1] bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-sm ${isSovereign ? 'bg-[#B58A3A]/10' : 'bg-slate-100'}`}>
              {isSovereign ? <Crown size={28} className="text-[#B58A3A]" /> : <ShieldCheck size={28} className="text-slate-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-6 bg-[#B58A3A]" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#8A6A2F] font-bold">
                  Sovereign Intelligence
                </span>
              </div>
              <h2 className="text-2xl font-serif text-[#121212] tracking-tight">
                Institutional Deal Analysis
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 ${statusBadge.bg} border ${statusBadge.border} rounded-sm`}>
                  <StatusIcon size={12} className={isSovereign ? 'text-[#B58A3A]' : 'text-slate-500'} />
                  <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-700">
                    {statusBadge.label}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Target size={10} className="text-slate-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                    Priority: <span className={`font-bold ${getPriorityColor(result.priority)}`}>{result.priority}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right border-l border-[#E7DFD1] pl-6">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-serif font-light text-[#121212] tracking-tighter">
                {result.fusedScore}
              </span>
              <span className="text-lg text-slate-400 font-mono">/100</span>
            </div>
            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-400 mt-1">
              Fusion Score
            </p>
            <div className="mt-2 h-px w-12 bg-[#B58A3A]/30" />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FAF8F3]">
        
        {/* LEFT: Signal Balance Radar */}
        <div className="lg:col-span-7">
          <div className="bg-[#FFFFFF] border border-[#E7DFD1] p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={12} className="text-[#B58A3A]" />
              <div className="h-px w-6 bg-[#E7DFD1]" />
              <h3 className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-500 font-bold">
                Signal Architecture
              </h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#E7DFD1" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#666666', fontSize: 9, fontFamily: 'monospace' }} 
                  />
                  <Radar
                    name="Institutional Signal"
                    dataKey="A"
                    stroke={isSovereign ? COLORS.gold : "#3b82f6"}
                    fill={isSovereign ? COLORS.gold : "#3b82f6"}
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: Intelligence Rationale & Confidence */}
        <div className="lg:col-span-5 space-y-5">
          {/* Rationale Section */}
          <div className="bg-[#FFFFFF] border border-[#E7DFD1] p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Compass size={12} className="text-[#B58A3A]" />
              <div className="h-px w-6 bg-[#E7DFD1]" />
              <h3 className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-500 font-bold">
                Assessment Rationale
              </h3>
            </div>
            <ul className="space-y-3">
              {result.rationale.map((note, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed">
                  <div className="mt-1.5">
                    <Feather size={10} className="text-[#B58A3A]" />
                  </div>
                  <span className="text-slate-600 font-light tracking-wide">
                    {note}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confidence Section */}
          <div className="bg-[#FFFFFF] border border-[#E7DFD1] p-5 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Scale size={12} className="text-[#B58A3A]" />
              <div className="h-px w-6 bg-[#E7DFD1]" />
              <h3 className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-500 font-bold">
                Certainty Index
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Confidence Threshold
                </span>
                <span className="text-2xl font-serif font-light text-[#121212]">
                  {result.routeConfidence}%
                </span>
              </div>
              <div className="w-full bg-[#F7F3EC] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#B58A3A] transition-all duration-1000" 
                  style={{ width: `${result.routeConfidence}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 italic leading-relaxed mt-2">
                Confidence factor derived from institutional signal variance and assessment depth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Problem Context */}
      <div className="p-5 bg-[#FFFFFF] border-t border-[#E7DFD1]">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-[#F7F3EC] rounded-sm">
            <Eye size={12} className="text-[#B58A3A]" />
          </div>
          <div>
            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-1">
              Institutional Friction
            </p>
            <p className="text-sm text-slate-600 italic leading-relaxed font-light">
              "{input.problem || "No qualitative problem signal provided."}"
            </p>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL FOOTNOTE */}
      <div className="px-6 py-3 bg-[#F7F3EC] border-t border-[#E7DFD1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={8} className="text-slate-400" />
            <span className="text-[7px] font-mono uppercase tracking-[0.2em] text-slate-400">
              Sovereign Intelligence • Institutional Assessment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-[#E7DFD1]" />
            <span className="text-[6px] font-mono text-slate-300">
              ABRAHAM OF LONDON
            </span>
            <div className="h-px w-6 bg-[#E7DFD1]" />
          </div>
        </div>
      </div>
    </div>
  );
};
