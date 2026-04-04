"use client";

import React, { useState, useEffect } from 'react';
import { DistributionChart } from './distribution-chart';
import { VolatilityHeatmap } from './volatility-heatmap';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  campaignId: string;
}

export const PredictedImpactDashboard: React.FC<DashboardProps> = ({ campaignId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const response = await fetch(`/api/analytics/executive-report?campaignId=${campaignId}`);
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Failed to fetch market analysis:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [campaignId]);

  if (loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-6 p-6 bg-slate-950 min-h-screen">
      {/* Header Stat Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Expected Resonance" 
          value={`${report.riskAnalysis.expectedValue.toFixed(1)}%`} 
          trend={report.baseline.trend} 
        />
        <MetricCard 
          title="Value at Risk (95%)" 
          value={`${report.riskAnalysis.var95.toFixed(1)}%`} 
          variant="destructive" 
        />
        <MetricCard 
          title="Market Volatility" 
          value={`${(report.baseline.volatility * 100).toFixed(1)}%`} 
          status={report.marketContext.volatilityRegime} 
        />
        <MetricCard 
          title="Model Confidence (R²)" 
          value={report.baseline.rSquared.toFixed(3)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecast Fan Chart (2/3 width) */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-400">Predicted Market Trajectory (Regime-Aware)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.projections.median.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleDateString()} 
                  stroke="#64748b" 
                  fontSize={10} 
                />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                />
                
                {/* Optimistic/Pessimistic Fan Area (Standard Deviation Band) */}
                <Line 
                  type="monotone" 
                  data={report.projections.optimistic.points} 
                  dataKey="value" 
                  stroke="none" 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  data={report.projections.median.points} 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  data={report.projections.pessimistic.points} 
                  dataKey="value" 
                  stroke="#ef4444" 
                  strokeWidth={1} 
                  strokeDasharray="5 5" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Probability Density Function (1/3 width) */}
        <DistributionChart 
          data={report.distribution} 
          expectedValue={report.riskAnalysis.expectedValue} 
          var95={report.riskAnalysis.var95} 
        />
      </div>

      {/* Full Width Volatility Matrix */}
      <div className="w-full">
        <VolatilityHeatmap 
          data={report.marketContext.sectorVolatility || []} 
          currentRegime={report.marketContext.volatilityRegime} 
        />
      </div>
    </div>
  );
};

/* --- Internal UI Helpers --- */

const MetricCard = ({ title, value, variant, trend, status }: any) => (
  <Card className="bg-slate-900 border-slate-800">
    <CardContent className="pt-6">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h3 className={`text-2xl font-bold ${variant === 'destructive' ? 'text-red-500' : 'text-slate-100'}`}>
          {value}
        </h3>
        {trend && <span className="text-[10px] text-blue-400 font-mono uppercase">{trend}</span>}
        {status && <span className="text-[10px] text-orange-400 font-mono uppercase">{status}</span>}
      </div>
    </CardContent>
  </Card>
);

const DashboardLoadingSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full bg-slate-900" />)}
    </div>
    <div className="grid grid-cols-3 gap-6">
      <Skeleton className="col-span-2 h-[400px] bg-slate-900" />
      <Skeleton className="h-[400px] bg-slate-900" />
    </div>
  </div>
);