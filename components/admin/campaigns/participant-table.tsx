'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Mail, 
  ExternalLink, 
  User,
  ShieldCheck
} from "lucide-react";

interface Participant {
  id: string;
  status: string;
  openedAt: Date | null;
  completedAt: Date | null;
  membership: {
    userEmail: string;
    userName: string | null;
    teamName: string | null;
    isExecutive: boolean;
  };
}

export function ParticipantTable({ participants }: { participants: Participant[] }) {
  return (
    <div className="overflow-x-auto selection:bg-amber-500 selection:text-black bg-zinc-950/70">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-white/10 bg-black/30">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Identity Context</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Structural Unit</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Audit Status</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Timeline Telemetry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {participants.map((p) => (
            <tr key={p.id} className="group hover:bg-white/5 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    p.membership.isExecutive 
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-white/5 text-white/45 group-hover:bg-white/10 group-hover:text-white/70'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-white leading-none mb-1">
                      {p.membership.userName || 'Anonymous Participant'}
                    </p>
                    <p className="text-[10px] font-medium text-white/45 lowercase italic tracking-tight">
                      {p.membership.userEmail}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/[0.04] text-white/60 border border-white/10">
                    {p.membership.teamName || 'Unassigned'}
                  </span>
                  {p.membership.isExecutive && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#8A6A2F]/5 border border-[#8A6A2F]/20 rounded-sm">
                       <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
                       <span className="text-[7px] font-black text-amber-300 uppercase">Exec</span>
                    </div>
                  )}
                </div>
              </td>

              <td className="px-6 py-5">
                <StatusBadge status={p.status} />
              </td>

              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter text-white/45 group-hover:text-white/65 transition-colors">
                    <Clock className="w-3 h-3" />
                    {p.completedAt 
                      ? `Validated: ${new Date(p.completedAt).toLocaleDateString('en-GB')}` 
                      : p.openedAt 
                      ? `Active since: ${new Date(p.openedAt).toLocaleDateString('en-GB')}` 
                      : 'Pending Protocol Activation'}
                  </div>
                  {p.completedAt && (
                    <div className="h-0.5 w-16 bg-emerald-500/30 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-full animate-in slide-in-from-left duration-700" />
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {participants.length === 0 && (
        <div className="p-20 text-center border-t border-white/10 bg-white/[0.03]">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            No telemetry nodes detected in this registry.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, icon: any, classes: string }> = {
    invited: { 
      label: 'Sent', 
      icon: Mail, 
      classes: 'text-white/45 bg-white/[0.04] border-white/10'
    },
    opened: { 
      label: 'In Progress', 
      icon: ExternalLink, 
      classes: 'text-amber-300 bg-amber-500/10 border-amber-500/20'
    },
    completed: { 
      label: 'Validated', 
      icon: CheckCircle2, 
      classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
    }
  };

  const config = configs[status] ?? configs["invited"]!;
  const Icon: React.ElementType = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[9px] font-black uppercase tracking-widest transition-all ${config.classes}`}>
      <Icon className="w-3 h-3 stroke-[2.5]" />
      {config.label}
    </div>
  );
}
