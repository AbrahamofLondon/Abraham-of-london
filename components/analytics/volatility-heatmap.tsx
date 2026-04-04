"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Structure for a single volatility point (e.g., Tech sector over 30 days)
interface VolatilityCell {
  sector: string;
  horizon: string;
  volatility: number; // Annualized realized volatility (e.g., 0.65 for 65%)
  isHigh: boolean; // Flagged by VolatilityEngine
}

interface VolatilityHeatmapProps {
  data: VolatilityCell[];
  currentRegime: 'High' | 'Stable' | 'Shock'; // Sourced from ExecutiveReportService
}

// Map of sectors to labels for the Y-Axis
const SECTORS = [
  { key: 'FIN', label: 'Financial Services' },
  { key: 'TECH', label: 'Technology Core' },
  { key: 'CONS', label: 'Consumer Discretionary' },
  { key: 'ENER', label: 'Energy & Industrials' },
  { key: 'HLTH', label: 'Healthcare' },
];

// Map of time horizons for the X-Axis
const HORIZONS = [
  { key: '1D', label: '1 Day (Spot)' },
  { key: '7D', label: '7 Day (Weekly)' },
  { key: '30D', label: '30 Day (Monthly)' },
  { key: '90D', label: '90 Day (Quarterly)' },
];

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({ 
  data, 
  currentRegime 
}) => {
  
  // High-fidelity color interpolation logic based on OGR-IV risk protocols
  // Stable: Slate/Blue -> High: Orange -> Shock: Red
  const getVolColor = (vol: number): string => {
    const v = Math.min(1.0, vol); // Clamp at 100% volatility
    
    if (v < 0.20) return `rgba(71, 85, 105, ${v * 4})`;   // Low/Stable (Blue/Slate)
    if (v < 0.45) return `rgba(59, 130, 246, ${v * 1.5})`; // Moderate (Blue)
    if (v < 0.70) return `rgba(249, 115, 22, ${v * 1.2})`;  // High (Orange)
    return `rgba(239, 68, 68, ${v * 1})`;               // Extreme (Red/Shock)
  };

  return (
    <Card className="w-full bg-slate-950 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-slate-100 text-sm font-medium">
            Cross-Sector Volatility Matrix
          </CardTitle>
          <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1">
            Realized Volatility (Log-Returns)
          </p>
        </div>
        
        {/* Current Regime Badge */}
        <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full 
          ${currentRegime === 'Shock' ? 'bg-red-950 text-red-400 border border-red-800' :
            currentRegime === 'High' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
            'bg-blue-950 text-blue-400 border border-blue-800'}`}
        >
          {`Regime: ${currentRegime}`}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="w-full overflow-x-auto">
          {/* Heatmap Grid Layout */}
          <div className="grid grid-cols-[140px,repeat(4,1fr)] gap-1 min-w-[500px]">
            
            {/* Header Row (Horizons) */}
            <div className="h-8" /> {/* Spacer for Y-Axis Labels */}
            {HORIZONS.map(h => (
              <div key={h.key} className="h-8 flex items-center justify-center text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  {h.label}
                </span>
              </div>
            ))}

            {/* Matrix Data Rows */}
            <TooltipProvider>
              {SECTORS.map(s => (
                <React.Fragment key={s.key}>
                  {/* Y-Axis (Sectors) */}
                  <div className="h-14 flex items-center pr-4">
                    <span className="text-[11px] font-medium text-slate-300 text-right w-full">
                      {s.label}
                    </span>
                  </div>
                  
                  {/* Heatmap Cells for the row */}
                  {HORIZONS.map(h => {
                    // Find the volatility point that matches this sector+horizon combination
                    const point = data.find(p => p.sector === s.key && p.horizon === h.key);
                    const volValue = point?.volatility || 0;

                    return (
                      <Tooltip key={`${s.key}-${h.key}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`h-14 rounded transition-all duration-300 ${point?.isHigh ? 'border-2 border-orange-500/50' : 'border border-slate-900'}`}
                            style={{ 
                              backgroundColor: getVolColor(volValue),
                              cursor: 'crosshair'
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-950 border border-slate-800 text-slate-100 p-3 shadow-xl">
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                              {`${s.label} | ${h.label}`}
                            </p>
                            <p className="text-xl font-light">
                              {`${(volValue * 100).toFixed(2)}%`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Realized Volatility (Annualized)
                            </p>
                            {point?.isHigh && (
                              <p className="text-[10px] text-orange-400 font-bold mt-2 uppercase">
                                ⚠️ Anomalous Volatility Detected
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </React.Fragment>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider">Volatility Scale</div>
          <div className="flex-1 h-3 rounded bg-gradient-to-r from-slate-600 via-blue-600 to-red-600" />
          <div className="text-[10px] text-slate-400 font-mono flex gap-8">
            <span>0% (Stable)</span>
            <span>45% (Elevated)</span>
            <span>100%+ (Shock)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};