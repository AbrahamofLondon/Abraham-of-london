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
    <div className="overflow-x-auto selection:bg-[#8A6A2F] selection:text-white">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/30">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Identity Context</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Structural Unit</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Audit Status</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Timeline Telemetry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {participants.map((p) => (
            <tr key={p.id} className="group hover:bg-neutral-50/50 transition-colors">
              {/* IDENTITY COLUMN */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    p.membership.isExecutive 
                      ? 'bg-[#8A6A2F]/10 text-[#8A6A2F]' 
                      : 'bg-neutral-100 text-neutral-400 group-hover:bg-white group-hover:text-black'
                  }`}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-black leading-none mb-1">
                      {p.membership.userName || 'Anonymous Participant'}
                    </p>
                    <p className="text-[10px] font-medium text-neutral-400 lowercase italic tracking-tight">
                      {p.membership.userEmail}
                    </p>
                  </div>
                </div>
              </td>

              {/* UNIT COLUMN */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-neutral-100 text-neutral-600 border border-neutral-200/50">
                    {p.membership.teamName || 'Unassigned'}
                  </span>
                  {p.membership.isExecutive && (
                    <ShieldCheck className="w-3 h-3 text-[#8A6A2F]" />
                  )}
                </div>
              </td>

              {/* STATUS COLUMN */}
              <td className="px-6 py-5">
                <StatusBadge status={p.status} />
              </td>

              {/* TIMELINE COLUMN */}
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter text-neutral-400 group-hover:text-neutral-600 transition-colors">
                    <Clock className="w-3 h-3" />
                    {p.completedAt 
                      ? `Validated: ${new Date(p.completedAt).toLocaleDateString('en-GB')}` 
                      : p.openedAt 
                      ? `Active since: ${new Date(p.openedAt).toLocaleDateString('en-GB')}` 
                      : 'Pending Protocol Activation'}
                  </div>
                  {p.completedAt && (
                    <div className="h-0.5 w-12 bg-emerald-500/30 rounded-full" />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {participants.length === 0 && (
        <div className="p-20 text-center border-t border-neutral-50">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">
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
      classes: 'text-neutral-400 bg-neutral-50 border-neutral-100 shadow-sm' 
    },
    opened: { 
      label: 'In Progress', 
      icon: ExternalLink, 
      classes: 'text-amber-600 bg-amber-50 border-amber-100 shadow-sm' 
    },
    completed: { 
      label: 'Validated', 
      icon: CheckCircle2, 
      classes: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-sm' 
    }
  };

  const config = configs[status] || configs.invited;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[9px] font-black uppercase tracking-widest transition-all ${config.classes}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}