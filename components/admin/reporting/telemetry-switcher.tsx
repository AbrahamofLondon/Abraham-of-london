'use client';

import React from 'react';
import { 
  Zap, 
  Users, 
  BarChart3, 
  Activity,
  Layers
} from 'lucide-react';
import { MatrixMode } from './dissonance-matrix';

interface TelemetrySwitcherProps {
  currentMode: MatrixMode;
  onModeChange: (mode: MatrixMode) => void;
}

/**
 * TELEMETRY SWITCHER v1.0
 * High-authority toggle for shifting organizational resonance lenses.
 */
export function TelemetrySwitcher({ currentMode, onModeChange }: TelemetrySwitcherProps) {
  const modes: { id: MatrixMode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'STRATEGIC', label: 'Strategic Intent', icon: <Zap className="w-3 h-3" />, color: 'text-[#8A6A2F]' },
    { id: 'HUMAN_CAPITAL', label: 'Human Capital', icon: <Users className="w-3 h-3" />, color: 'text-blue-600' },
    { id: 'FINANCIAL', label: 'Financial Resonance', icon: <BarChart3 className="w-3 h-3" />, color: 'text-emerald-600' },
    { id: 'OPERATIONAL', label: 'Operational Velocity', icon: <Activity className="w-3 h-3" />, color: 'text-amber-600' },
  ];

  return (
    <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="flex items-center gap-3">
        <Layers className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Telemetry Lens Selection</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-3 px-4 py-2.5 border transition-all duration-300 ${
                isActive 
                  ? `bg-white border-neutral-800 shadow-sm translate-y-[-2px]` 
                  : `bg-neutral-50 border-neutral-100 text-neutral-400 hover:border-neutral-200 hover:bg-white`
              }`}
            >
              <div className={`${isActive ? mode.color : 'text-neutral-300'} transition-colors`}>
                {mode.icon}
              </div>
              <span className={`text-[9px] font-mono uppercase tracking-widest ${isActive ? 'text-black font-black' : 'font-bold'}`}>
                {mode.label}
              </span>
              {isActive && (
                <div className={`w-1 h-1 rounded-full animate-pulse ${mode.color.replace('text-', 'bg-')}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}