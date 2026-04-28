'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Mail, 
  ExternalLink, 
  User,
  ShieldCheck
} from "lucide-react";

interface Participant {
  id: string;
  status: string;
  openedAt: Date | string | null;
  completedAt: Date | string | null;
  membership: {
    userEmail: string | null;
    userName: string | null;
    teamName: string | null;
    isExecutive: boolean;
  };
}

/**
 * PARTICIPANT TABLE PROTOCOL
 * Renders the structural roster of all nodes invited to the current alignment audit.
 * Hardened with null-coalescing and type-safe status mapping.
 */
export function ParticipantTable({ participants }: { participants: Participant[] }) {
  return (
    <div className="overflow-x-auto bg-white border border-neutral-100">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50/30">
            <th className="px-6 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Identity</th>
            <th className="px-6 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Unit</th>
            <th className="px-6 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Status</th>
            <th className="px-6 py-4 text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-normal">Timeline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {participants.map((p) => (
            <tr key={p.id} className="group hover:bg-neutral-50/50 transition-colors">
              {/* IDENTITY COLUMN */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    p.membership?.isExecutive 
                      ? 'bg-neutral-100 text-neutral-600' 
                      : 'bg-neutral-50 text-neutral-400 group-hover:bg-neutral-100'
                  }`}>
                    <User className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-tight text-neutral-800 leading-none mb-1">
                      {p.membership?.userName ?? 'Anonymous Participant'}
                    </p>
                    <p className="text-[9px] text-neutral-400">
                      {p.membership?.userEmail ?? 'no-email@sovereign.internal'}
                    </p>
                  </div>
                </div>
              </td>

              {/* UNIT COLUMN */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-100">
                    {p.membership?.teamName ?? 'Unassigned'}
                  </span>
                  {p.membership?.isExecutive && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-50 border border-neutral-100">
                      <ShieldCheck className="w-2 h-2 text-neutral-500" />
                      <span className="text-[6px] font-mono text-neutral-500 uppercase">Exec</span>
                    </div>
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
                  <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider text-neutral-400 group-hover:text-neutral-500 transition-colors">
                    <Clock className="w-2.5 h-2.5" />
                    {p.completedAt 
                      ? `Validated: ${new Date(p.completedAt).toLocaleDateString('en-GB')}` 
                      : p.openedAt 
                      ? `Active: ${new Date(p.openedAt).toLocaleDateString('en-GB')}` 
                      : 'Pending'}
                  </div>
                  {p.completedAt && (
                    <div className="h-px w-12 bg-neutral-200">
                      <div className="h-full w-full bg-neutral-400" />
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {participants.length === 0 && (
        <div className="p-16 text-center border-t border-neutral-50">
          <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-300">
            No participants in this registry.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * STATUS BADGE HELPER
 * Standardizes visual representation of node progression.
 * Uses 'as const' to ensure the compiler recognizes 'invited' as a valid default key.
 */
function StatusBadge({ status }: { status: string }) {
  const configs = {
    invited: { 
      label: 'Sent', 
      icon: Mail, 
      classes: 'text-neutral-500 bg-neutral-50 border-neutral-100' 
    },
    opened: { 
      label: 'Active', 
      icon: ExternalLink, 
      classes: 'text-neutral-600 bg-neutral-50 border-neutral-200' 
    },
    completed: { 
      label: 'Validated', 
      icon: CheckCircle2, 
      classes: 'text-neutral-600 bg-neutral-50 border-neutral-200' 
    }
  } as const;

  // 1. Cast status to keyof configs or null
  // 2. Default to 'invited' configuration if status is unknown or missing
  const config = configs[status as keyof typeof configs] ?? configs.invited;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[7px] font-mono uppercase tracking-wider ${config.classes}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </div>
  );
}
