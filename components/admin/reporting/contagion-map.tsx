'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  AlertTriangle, 
  Zap, 
  ShieldAlert, 
  Activity,
  ChevronRight,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Brain,
  Layers
} from "lucide-react";

interface VectorLink {
  source: string;
  target: string;
  impact: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
}

interface ContagionMapProps {
  data?: VectorLink[];
  isLoading?: boolean;
  onRecalculate?: () => void;
}

const getSeverityConfig = (severity: VectorLink['severity']) => {
  switch (severity) {
    case 'critical':
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500', icon: ShieldAlert };
    case 'high':
      return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500', icon: AlertTriangle };
    case 'moderate':
      return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', icon: TrendingUp };
    default:
      return { color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-200', bar: 'bg-neutral-400', icon: CheckCircle2 };
  }
};

// Default mock data for initial render (will be replaced by real data)
const DEFAULT_VECTORS: VectorLink[] = [
  { source: "ENGINEERING_VELOCITY", target: "CULTURAL_COHESION", impact: 72, severity: 'high', confidence: 0.85 },
  { source: "LEADERSHIP_EXHAUSTION", target: "TRUST_INDEX", impact: 68, severity: 'critical', confidence: 0.82 },
  { source: "ENGINEERING_VELOCITY", target: "OPERATIONAL_CLARITY", impact: 55, severity: 'moderate', confidence: 0.78 },
  { source: "TALENT_ATTRITION", target: "CULTURAL_COHESION", impact: 48, severity: 'moderate', confidence: 0.71 },
  { source: "ROLE_VACANCY", target: "OPERATIONAL_CLARITY", impact: 42, severity: 'low', confidence: 0.88 },
  { source: "LEADERSHIP_EXHAUSTION", target: "STRATEGIC_INTENT", impact: 35, severity: 'low', confidence: 0.76 },
];

export function ContagionMap({ data = DEFAULT_VECTORS, isLoading = false, onRecalculate }: ContagionMapProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  
  const displayData = expanded ? data : data.slice(0, 5);
  const hasMore = data.length > 5;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white border border-neutral-100 shadow-sm">
        <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
          <h3 className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Activity size={10} className="text-neutral-400" /> Contagion Vectors
          </h3>
          <span className="text-[6px] font-mono text-neutral-400">Calculating...</span>
        </div>
        <div className="flex-1 p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-2 bg-neutral-100 rounded w-3/4 mx-auto" />
            <div className="h-2 bg-neutral-100 rounded w-1/2 mx-auto" />
            <div className="h-2 bg-neutral-100 rounded w-2/3 mx-auto" />
          </div>
          <p className="text-[7px] text-neutral-400 mt-4">Mapping contagion vectors...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white border border-neutral-100 shadow-sm">
        <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
          <h3 className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Layers size={10} className="text-neutral-400" /> Contagion Vectors
          </h3>
        </div>
        <div className="flex-1 p-8 text-center">
          <Brain className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
          <p className="text-[7px] font-mono text-neutral-400">No contagion vectors detected</p>
          <p className="text-[6px] text-neutral-300 mt-1">Insufficient data for analysis</p>
        </div>
      </div>
    );
  }

  // Calculate aggregate stats
  const totalImpact = data.reduce((sum, v) => sum + v.impact, 0);
  const avgImpact = Math.round(totalImpact / data.length);
  const criticalCount = data.filter(v => v.severity === 'critical').length;
  const highCount = data.filter(v => v.severity === 'high').length;

  return (
    <div className="flex flex-col h-full bg-white border border-neutral-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30">
        <div className="flex items-center gap-2">
          <Activity size={10} className="text-neutral-500" />
          <h3 className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">Contagion Vectors</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {criticalCount > 0 && (
              <span className="text-[6px] font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span className="text-[6px] font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                {highCount} high
              </span>
            )}
          </div>
          <span className="text-[6px] font-mono text-neutral-400">{data.length} vectors</span>
        </div>
      </div>

      {/* Vector Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-100 text-[6px] font-mono text-neutral-400 uppercase tracking-wider">
              <th className="text-left px-4 py-2 font-normal">Source</th>
              <th className="text-center py-2 font-normal w-6" />
              <th className="text-left px-4 py-2 font-normal">Target</th>
              <th className="text-right px-4 py-2 font-normal">Impact</th>
              </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {displayData.map((vector, idx) => {
                const severityConfig = getSeverityConfig(vector.severity);
                const Icon = severityConfig.icon;
                const isHovered = hoveredIndex === idx;
                
                return (
                  <motion.tr 
                    key={`${vector.source}-${vector.target}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="group border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors cursor-default"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${vector.severity === 'critical' ? 'bg-red-500' : vector.severity === 'high' ? 'bg-orange-500' : 'bg-neutral-400'}`} />
                        <span className="text-[8px] font-mono font-medium text-neutral-700">
                          {vector.source.slice(0, 20)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="text-center">
                      <div className="flex items-center justify-center">
                        <ChevronRight size={8} className={`text-neutral-400 transition-all ${isHovered ? 'translate-x-0.5' : ''}`} />
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-medium text-neutral-600">
                          {vector.target}
                        </span>
                        <span className="text-[5px] font-mono text-neutral-400 mt-0.5">
                          {(vector.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {vector.severity !== 'low' && <Icon size={8} className={severityConfig.color} />}
                          <span className={`text-[8px] font-mono font-medium ${severityConfig.color}`}>
                            {vector.impact}%
                          </span>
                        </div>
                        <div className="w-12 h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${vector.impact}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className={`h-full ${severityConfig.bar}`}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        
        {/* Expand/Collapse */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 text-center border-t border-neutral-100 text-[6px] font-mono text-neutral-500 hover:text-neutral-700 transition-colors flex items-center justify-center gap-1"
          >
            {expanded ? (
              <>Show less <TrendingUp size={8} className="rotate-180" /></>
            ) : (
              <>Show {data.length - 5} more vectors <TrendingDown size={8} /></>
            )}
          </button>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 bg-neutral-50/50 border-t border-neutral-100 flex justify-between items-center text-[6px] font-mono">
        <div className="flex items-center gap-2">
          <Target size={8} className="text-neutral-400" />
          <span className="text-neutral-500">Avg impact: {avgImpact}%</span>
        </div>
        {onRecalculate && (
          <button 
            onClick={onRecalculate}
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <Zap size={8} />
            <span>Recalculate</span>
          </button>
        )}
      </div>
    </div>
  );
}