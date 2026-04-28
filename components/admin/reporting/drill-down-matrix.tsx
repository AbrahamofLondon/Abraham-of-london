'use client';

import React, { useState, useMemo } from 'react';
import { DissonanceMatrix } from './dissonance-matrix';
import { Globe, ChevronDown, Filter, AlertCircle, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { calculateInstitutionalIntegrity, PulseResponse } from '@/lib/alignment/hardened-pulse-engine';

interface DomainScore {
  domain: string;
  percentScore?: number;
  percent?: number;
}

interface SnapshotData {
  teamName?: string;
  domainScoresJson: DomainScore[];
  respondentCount: number;
  band: 'ALIGNED' | 'FRAGMENTED' | 'DISORDERED';
  percentScore: number;
  rawResponses?: PulseResponse[];
}

interface DrillDownMatrixProps {
  globalData: SnapshotData;
  teamSnapshots: SnapshotData[];
}

export function DrillDownMatrix({ globalData, teamSnapshots }: DrillDownMatrixProps) {
  const [activeView, setActiveView] = useState<'global' | string>('global');

  const currentData = useMemo(() => {
    return activeView === 'global' 
      ? globalData 
      : teamSnapshots.find(t => t.teamName === activeView) || globalData;
  }, [activeView, globalData, teamSnapshots]);

  const integrity = useMemo(() => {
    return calculateInstitutionalIntegrity(currentData.rawResponses || []);
  }, [currentData]);

  const mappedMetrics = useMemo(() => {
    return currentData.domainScoresJson.map((ds) => ({
      label: ds.domain,
      intent: 90,
      reality: ds.percentScore || ds.percent || 0
    }));
  }, [currentData]);

  return (
    <div className="space-y-6 font-serif">
      
      {/* Command Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 border border-neutral-100">
        <div className="flex items-center gap-3 pl-1">
          <div className="w-6 h-6 flex items-center justify-center">
            <Filter className="w-3 h-3 text-neutral-400" />
          </div>
          <div>
            <p className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Governance Telemetry</p>
            <h4 className="text-xs font-medium text-neutral-700">
              {activeView === 'global' ? 'Institutional Baseline' : `Segment: ${activeView}`}
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reliability Badge */}
          <div className={`px-3 py-1.5 border flex items-center gap-1.5 ${
            integrity.integrityStatus === 'STABLE' ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-200 bg-neutral-50'
          }`}>
            <Activity className={`w-2.5 h-2.5 ${integrity.integrityStatus === 'STABLE' ? 'text-neutral-500' : 'text-neutral-500'}`} />
            <span className={`text-[7px] font-mono uppercase tracking-wider text-neutral-500`}>
              DRI: {integrity.reliabilityIndex}%
            </span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('global')}
              className={`px-4 py-1.5 text-[7px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                activeView === 'global' 
                  ? 'bg-neutral-800 text-white border-neutral-800' 
                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <Globe className="w-2.5 h-2.5" /> Global
            </button>
            
            <div className="relative min-w-[160px]">
              <select 
                value={activeView === 'global' ? '' : activeView}
                onChange={(e) => setActiveView(e.target.value)}
                className="w-full appearance-none px-3 py-1.5 pr-8 text-[7px] font-mono uppercase tracking-wider border border-neutral-200 bg-white hover:border-neutral-300 cursor-pointer focus:outline-none"
              >
                <option value="" disabled>Select Segment...</option>
                {teamSnapshots.map(t => (
                  <option key={t.teamName} value={t.teamName}>{t.teamName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none text-neutral-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Display */}
      <div className="relative">
        {integrity.integrityStatus === 'CRITICAL' && (
          <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-white border-l-2 border-neutral-300 p-6 max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-neutral-500" />
                <h5 className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Insufficient Data</h5>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed mb-4">
                Sample size (N={integrity.nodeCount}) does not meet the minimum review point for board reporting.
              </p>
              <button 
                onClick={() => setActiveView('global')}
                className="text-[8px] font-mono uppercase tracking-wider underline text-neutral-500 hover:text-neutral-700"
              >
                Return to Baseline
              </button>
            </div>
          </div>
        )}
        
        <DissonanceMatrix metrics={mappedMetrics} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard 
          label="Cohort" 
          value={integrity.nodeCount} 
          subtext="Participants"
        />
        <KpiCard 
          label="Error Margin" 
          value={`±${integrity.standardError}%`} 
          isAlert={integrity.standardError > 15}
          subtext="Standard Error"
        />
        
        {/* Reliability Index */}
        <div className={`bg-white p-4 border transition-all flex flex-col items-center justify-center ${
          integrity.integrityStatus === 'CRITICAL' ? 'border-neutral-200' : 'border-neutral-100'
        }`}>
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mb-2">Reliability</p>
          <p className={`text-xl font-light tracking-tight mb-1 ${
            integrity.integrityStatus === 'STABLE' ? 'text-neutral-700' : 'text-neutral-500'
          }`}>
            {integrity.reliabilityIndex}%
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[6px] font-mono text-neutral-400 uppercase tracking-wider">
              {integrity.integrityStatus}
            </span>
          </div>
          <div className="w-full mt-3 h-0.5 bg-neutral-100">
            <div 
              className={`h-full transition-all duration-1000 bg-neutral-400`}
              style={{ width: `${integrity.reliabilityIndex}%` }}
            />
          </div>
        </div>

        <KpiCard 
          label="Resonance" 
          value={`${currentData.percentScore}%`} 
          subtext="Composite"
        />
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtext, isAlert }: { label: string, value: string | number, subtext: string, isAlert?: boolean }) {
  return (
    <div className="bg-white p-4 border border-neutral-100 flex flex-col items-center justify-center">
      <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-light tracking-tight mb-1 ${isAlert ? 'text-neutral-500' : 'text-neutral-700'}`}>
        {value}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-[6px] font-mono text-neutral-400 uppercase tracking-wider">{subtext}</span>
      </div>
    </div>
  );
}
