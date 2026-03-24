'use client';

import { CheckCircle2, Circle, Activity } from "lucide-react";
import { EnterpriseAlignmentDomain } from "@/lib/alignment/enterprise-types";

interface ParticipantLiveViewProps {
  participantName: string;
  currentStep: number;
  totalSteps: number;
  completedDomains: EnterpriseAlignmentDomain[];
  allDomains: typeof import("@/lib/alignment/enterprise-types").ENTERPRISE_ALIGNMENT_DOMAIN_ORDER;
}

export function ParticipantLiveView({ 
  participantName, 
  currentStep, 
  totalSteps, 
  completedDomains,
  allDomains 
}: ParticipantLiveViewProps) {
  
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="bg-white border border-neutral-200 p-6 font-sans">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A6A2F] mb-1">Live Telemetry</p>
          <h4 className="text-xl font-black uppercase tracking-tighter">{participantName}</h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Completion</p>
          <p className="text-2xl font-black">{progressPercent}%</p>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="space-y-3">
        {allDomains.map((domain, index) => {
          const isCompleted = completedDomains.includes(domain);
          const isCurrent = !isCompleted && completedDomains.length === index;

          return (
            <div 
              key={domain}
              className={`flex items-center justify-between p-3 border transition-all ${
                isCurrent ? 'border-black bg-neutral-50' : 'border-neutral-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#8A6A2F]" />
                ) : isCurrent ? (
                  <Activity className="w-4 h-4 animate-pulse text-black" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-200" />
                )}
                <span className={`text-[11px] font-black uppercase tracking-widest ${
                  isCompleted ? 'text-black' : isCurrent ? 'text-black' : 'text-neutral-300'
                }`}>
                  {domain.replace(/_/g, ' ')}
                </span>
              </div>
              
              {isCurrent && (
                <span className="text-[8px] font-black bg-black text-white px-2 py-0.5 uppercase tracking-widest">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-100">
        <p className="text-[9px] font-medium text-neutral-400 uppercase leading-relaxed italic">
          Identity Protection: Individual answers are obfuscated. Telemetry only tracks completion velocity to ensure audit integrity.
        </p>
      </div>
    </div>
  );
}