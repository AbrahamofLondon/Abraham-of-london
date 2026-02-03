/* components/PortfolioTracker.tsx — STRATEGIC ASSET OVERVIEW */
import React from 'react';
import { CheckCircle2, Circle, Clock, Database, Shield } from 'lucide-react';

interface AssetStatus {
  id: string;
  title: string;
  status: 'Published' | 'Draft' | 'Archived';
  downloads: number;
  lastAccessed: string;
  integrity: 'Verified' | 'Pending';
}

const PortfolioTracker: React.FC = () => {
  // Logic to calculate progress across the 75-brief goal
  const totalBriefs = 75;
  const publishedBriefs = 42; // Example value from database
  const progressPercentage = (publishedBriefs / totalBriefs) * 100;

  return (
    <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 space-y-8">
      {/* 1. Progress Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-serif italic text-white mb-2">Portfolio Maturation</h2>
          <p className="text-zinc-500 text-sm">Systematic tracking of the 75-brief intelligence objective.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-2xl font-mono text-amber-500">{publishedBriefs}/75</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600">Assets Live</span>
          </div>
          <div className="w-32 h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Critical Asset Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard icon={Shield} label="Audit Integrity" value="99.8%" status="optimal" />
        <HealthCard icon={Database} label="Storage Sync" value="Verified" status="optimal" />
        <HealthCard icon={Clock} label="Avg. Retrieval" value="1.2s" status="optimal" />
        <HealthCard icon={CheckCircle2} label="Policy Compliance" value="Active" status="optimal" />
      </div>

      {/* 3. Detailed Audit Trail Feed (Sample) */}
      <div className="mt-8 pt-8 border-t border-white/5">
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 font-black">Recent Institutional Events</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/[0.02] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-300 font-mono italic">ASSET_RETRIEVAL_SUCCESS</span>
              </div>
              <span className="text-zinc-600 font-mono">NODE_IP: 192.XXX.XX.{i}2</span>
              <span className="text-zinc-500">2 mins ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HealthCard = ({ icon: Icon, label, value, status }: any) => (
  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
    <div className="flex items-center gap-3 mb-2 text-zinc-500">
      <Icon size={14} />
      <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
    </div>
    <div className="text-lg text-white font-medium">{value}</div>
  </div>
);

export default PortfolioTracker;