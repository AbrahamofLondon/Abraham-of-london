'use client';

import React from 'react';
import { 
  AlertTriangle, 
  ChevronRight, 
  Target, 
  Zap, 
  Users, 
  BarChart3, 
  ShieldAlert, 
  TrendingUp,
  Heart,
  Briefcase,
  Gauge,
  Brain,
  Activity
} from 'lucide-react';

// Define the "Domain Mode" to allow the UI to adapt
export type MatrixMode = 'STRATEGIC' | 'HUMAN_CAPITAL' | 'FINANCIAL' | 'OPERATIONAL' | 'GOVERNANCE';

interface DomainMetric {
  label: string;
  intent: number;   // Top-down goal or potential
  reality: number;  // Bottom-up data or extraction
  subtext?: string; // Optional custom status message
  burnoutIndex?: number;     // For HCD mode
  attritionRisk?: string;    // For HCD mode
  wellbeing?: number;        // For HCD mode
}

interface DissonanceMatrixProps {
  metrics: DomainMetric[];
  mode?: MatrixMode;
  cohortSize?: number;
  onModeChange?: (mode: MatrixMode) => void;
}

/**
 * POLYMORPHIC DISSONANCE MATRIX v2.1
 * A versatile telemetry engine that adapts its visual language based on the domain.
 * Fully integrated with Human Capital Delta metrics.
 */
export function DissonanceMatrix({ 
  metrics, 
  mode = 'STRATEGIC', 
  cohortSize = 72,
  onModeChange 
}: DissonanceMatrixProps) {
  
  // Dynamic Configuration based on Mode
  const config = {
    STRATEGIC: {
      title: "Strategic Dissonance",
      icon: <Zap className="w-3.5 h-3.5" />,
      iconColor: "text-neutral-500",
      accent: "#8A6A2F",
      accentLight: "bg-[#8A6A2F]/10",
      intentLabel: "Intent",
      realityLabel: "Reality",
      deltaLabel: "Delta",
      description: "Alignment between strategic intent and operational reality"
    },
    HUMAN_CAPITAL: {
      title: "Human Capital Delta",
      icon: <Heart className="w-3.5 h-3.5" />,
      iconColor: "text-blue-500",
      accent: "#3B82F6",
      accentLight: "bg-blue-50",
      intentLabel: "Potential",
      realityLabel: "Extraction",
      deltaLabel: "Burnout Index",
      description: "Balance between human potential and sustainable extraction"
    },
    FINANCIAL: {
      title: "Financial Resonance",
      icon: <Briefcase className="w-3.5 h-3.5" />,
      iconColor: "text-emerald-500",
      accent: "#10B981",
      accentLight: "bg-emerald-50",
      intentLabel: "Budget",
      realityLabel: "Actual",
      deltaLabel: "Variance",
      description: "Financial alignment and resource efficiency"
    },
    OPERATIONAL: {
      title: "Operational Velocity",
      icon: <Gauge className="w-3.5 h-3.5" />,
      iconColor: "text-amber-500",
      accent: "#F59E0B",
      accentLight: "bg-amber-50",
      intentLabel: "Capacity",
      realityLabel: "Throughput",
      deltaLabel: "Friction",
      description: "Operational efficiency and throughput"
    },
    GOVERNANCE: {
      title: "Governance Integrity",
      icon: <Brain className="w-3.5 h-3.5" />,
      iconColor: "text-purple-500",
      accent: "#8B5CF6",
      accentLight: "bg-purple-50",
      intentLabel: "Policy",
      realityLabel: "Compliance",
      deltaLabel: "Gap",
      description: "Policy adherence and regulatory alignment"
    }
  }[mode];

  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-12 border border-neutral-100 text-center bg-neutral-50/30">
        <Activity className="w-6 h-6 text-neutral-300 mx-auto mb-3" />
        <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
          Telemetry Offline: No {mode.toLowerCase()} metrics found.
        </p>
      </div>
    );
  }

  // Calculate aggregate stats for the mode
  const totalDelta = metrics.reduce((acc, m) => acc + (m.intent - m.reality), 0);
  const avgDelta = Math.round(totalDelta / metrics.length);
  const criticalCount = metrics.filter(m => (m.intent - m.reality) > 20).length;
  const isCritical = avgDelta > 20;

  return (
    <div className="bg-white border border-neutral-100 overflow-hidden">
      {/* HEADER: SYSTEM STATUS */}
      <div className="p-6 border-b border-neutral-100 bg-neutral-50/20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1 rounded ${config.accentLight}`}>
              {config.icon}
            </div>
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
              {mode.replace('_', ' ')}
            </span>
            <span className="text-[6px] font-mono text-neutral-300">v2.1</span>
          </div>
          <h3 className="text-lg font-light tracking-tight text-neutral-800">
            {config.title}
          </h3>
          <p className="text-[8px] text-neutral-400 mt-1 max-w-md">
            {config.description}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[6px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Cohort</p>
            <p className="text-sm font-light text-neutral-700">N={cohortSize}</p>
          </div>
          <div className={`px-3 py-1.5 border-l-2 ${isCritical ? 'border-red-500 bg-red-50/30' : 'border-neutral-300 bg-neutral-50/50'}`}>
            <p className="text-[6px] font-mono uppercase tracking-wider text-neutral-400 mb-0.5">Composite Delta</p>
            <p className={`text-sm font-light ${isCritical ? 'text-red-600' : 'text-neutral-600'}`}>
              {avgDelta > 0 ? `-${avgDelta}%` : `+${Math.abs(avgDelta)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="divide-y divide-neutral-50">
        {metrics.map((m, idx) => {
          const delta = Math.round(m.intent - m.reality);
          const isCriticalDelta = delta > 20;
          const isPositiveDelta = delta < 0; // Reality exceeds intent
          
          // HCD-specific calculations
          const burnoutIndex = m.burnoutIndex || Math.min(100, Math.max(0, delta * 1.5));
          const wellbeing = m.wellbeing || Math.max(0, 100 - burnoutIndex);
          
          return (
            <div key={m.label} className="grid grid-cols-12 group hover:bg-neutral-50/30 transition-colors duration-300">
              
              {/* DOMAIN IDENTIFIER */}
              <div className="col-span-12 md:col-span-4 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  {isCriticalDelta ? (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${config.iconColor}`} />
                  )}
                  <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Domain</span>
                </div>
                <h4 className="text-sm font-medium tracking-tight text-neutral-800 group-hover:translate-x-0.5 transition-transform">
                  {m.label.replace(/_/g, ' ')}
                </h4>
                
                {/* HCD-specific metrics display */}
                {mode === 'HUMAN_CAPITAL' && m.burnoutIndex !== undefined && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-2 h-2 text-neutral-400" />
                      <span className="text-[6px] font-mono text-neutral-500">
                        Wellbeing: {wellbeing}%
                      </span>
                    </div>
                    <div className="w-12 h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${wellbeing}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* VISUALIZATION */}
              <div className="col-span-12 md:col-span-8 p-6 flex flex-col justify-center">
                <div className="flex justify-between text-[8px] font-mono uppercase tracking-wider mb-3">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <Target className="w-2.5 h-2.5" /> 
                    {config.intentLabel} ({m.intent}%)
                  </span>
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    {config.realityLabel} ({m.reality}%) 
                    <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* BARS */}
                <div className="relative w-full h-6 bg-neutral-100 overflow-hidden">
                  {/* Intent marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-neutral-500 z-30 opacity-40" 
                    style={{ left: `${m.intent}%` }} 
                  />
                  
                  {/* Reality bar */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out z-20"
                    style={{ 
                      width: `${m.reality}%`,
                      backgroundColor: isCriticalDelta ? '#EF4444' : config.accent,
                      opacity: 0.85
                    }} 
                  />
                  
                  {/* Delta gap */}
                  {m.intent > m.reality && (
                    <div 
                      className="absolute top-0 bottom-0 bg-neutral-300/40 z-10" 
                      style={{ left: `${m.reality}%`, width: `${m.intent - m.reality}%` }} 
                    />
                  )}
                </div>

                {/* SUBTEXT AND METRICS */}
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[7px] text-neutral-500 leading-relaxed max-w-md">
                    {m.subtext || (
                      isCriticalDelta 
                        ? `${Math.round(delta)}% gap detected — intervention required`
                        : isPositiveDelta 
                          ? `Exceeds target by ${Math.abs(delta)}% — sustainable`
                          : `${Math.round(delta)}% variance — within tolerance`
                    )}
                  </p>
                  
                  <div className={`flex items-baseline gap-1 px-2 py-0.5 text-[7px] font-mono ${
                    isCriticalDelta ? 'bg-red-50 text-red-600' : 
                    isPositiveDelta ? 'bg-emerald-50 text-emerald-600' : 
                    'bg-neutral-100 text-neutral-600'
                  }`}>
                    <span className="uppercase tracking-wider opacity-60">{config.deltaLabel}</span>
                    <span className="font-medium">
                      {delta > 0 ? `-${delta}%` : `+${Math.abs(delta)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SYSTEM FOOTER */}
      <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: config.accent }} />
          <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400">
            {criticalCount > 0 ? `${criticalCount} critical variance(s) detected` : "All domains within tolerance"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[5px] font-mono text-neutral-300 uppercase tracking-wider">
            Polymorphic Telemetry • {mode} Mode
          </span>
          {onModeChange && (
            <select 
              value={mode}
              onChange={(e) => onModeChange(e.target.value as MatrixMode)}
              className="text-[6px] font-mono bg-transparent border border-neutral-200 rounded px-2 py-1 text-neutral-500 focus:outline-none"
            >
              <option value="STRATEGIC">Strategic</option>
              <option value="HUMAN_CAPITAL">Human Capital</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="FINANCIAL">Financial</option>
              <option value="GOVERNANCE">Governance</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}