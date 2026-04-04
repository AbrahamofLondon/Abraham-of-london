"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionPoint {
  bucket: number;
  probability: number;
}

interface DistributionChartProps {
  data: DistributionPoint[];
  expectedValue: number;
  var95: number;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ 
  data, 
  expectedValue, 
  var95 
}) => {
  // Sorting ensure the curve flows correctly from 0 to 100
  const sortedData = [...data].sort((a, b) => a.bucket - b.bucket);

  return (
    <Card className="w-full bg-slate-950 border-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-100 text-sm font-medium">
          Probability Density Function (Market Outcomes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="bucket" 
                stroke="#64748b" 
                fontSize={12}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Probability']}
                labelFormatter={(label) => `Resonance Score: ${label}%`}
              />
              
              {/* Reference Lines for Executive Context */}
              <ReferenceLine 
                x={expectedValue} 
                stroke="#3b82f6" 
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'Expected', fill: '#3b82f6', fontSize: 10 }} 
              />
              <ReferenceLine 
                x={var95} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ position: 'top', value: 'VaR (95%)', fill: '#ef4444', fontSize: 10 }} 
              />

              <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.bucket < var95 ? '#ef4444' : '#3b82f6'} 
                    fillOpacity={entry.bucket < var95 ? 0.8 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs text-slate-500 italic">
          Red zone indicates outcomes within the 5th percentile risk (Value at Risk).
        </p>
      </CardContent>
    </Card>
  );
};