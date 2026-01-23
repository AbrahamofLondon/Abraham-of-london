// components/admin/ShortsAnalytics.tsx - Production Ready (No External Chart Library)

import * as React from "react";
import { Heart, Bookmark, TrendingUp, Zap } from "lucide-react";

interface AnalyticsData {
  slug: string;
  title: string;
  likes: number;
  saves: number;
  engagementRate: number;
}

interface AnalyticsProps {
  data: AnalyticsData[];
}

const BRAND_COLORS = ["#d4af37", "#aa8a2e", "#826a23", "#5b4a18"];

export default function ShortsAnalytics({ data }: AnalyticsProps) {
  const totalLikes = data.reduce((acc, curr) => acc + curr.likes, 0);
  const totalSaves = data.reduce((acc, curr) => acc + curr.saves, 0);
  const topPerformer = [...data].sort((a, b) => (b.likes + b.saves) - (a.likes + a.saves))[0];
  
  // Calculate max value for scaling bars
  const maxLikes = Math.max(...data.map(d => d.likes), 1);

  return (
    <div className="space-y-8 p-8 bg-black text-cream min-h-screen">
      <header className="flex justify-between items-end border-b border-white/10 pb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Engagement Pulse</h2>
          <p className="text-zinc-500 mt-2 italic">Strategic telemetry for the Kingdom Vault.</p>
        </div>
        <div className="flex gap-4">
          <StatCard icon={<Heart size={16}/>} label="Total Likes" value={totalLikes} color="text-rose-500" />
          <StatCard icon={<Bookmark size={16}/>} label="Total Saves" value={totalSaves} color="text-gold" />
        </div>
      </header>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Chart - Custom CSS Bar Chart */}
        <div className="lg:col-span-2 bg-zinc-950 border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="text-gold" size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Content Reach</h3>
          </div>
          
          <div className="space-y-4">
            {data.map((item, index) => {
              const barHeight = (item.likes / maxLikes) * 100;
              const color = BRAND_COLORS[index % BRAND_COLORS.length];
              
              return (
                <div key={item.slug} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium truncate max-w-[200px]">
                      {item.title}
                    </span>
                    <span className="text-xs font-bold text-zinc-300">
                      {item.likes.toLocaleString()} likes
                    </span>
                  </div>
                  
                  <div className="relative h-8 bg-zinc-900 rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out group-hover:opacity-80"
                      style={{ 
                        width: `${barHeight}%`,
                        backgroundColor: color,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-[10px] font-bold text-white/80 mix-blend-difference">
                        {item.saves} saves
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Y-axis labels */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>0</span>
              <span>{Math.round(maxLikes / 2)}</span>
              <span>{maxLikes}</span>
            </div>
          </div>
        </div>

        {/* High-Impact Insight Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-gold/20 rounded-[2rem] p-8 flex flex-col justify-between">
          <div>
            <Zap className="text-gold mb-6" size={32} />
            <h3 className="font-serif text-2xl font-bold text-white leading-tight">
              Top Performance Insight
            </h3>
            {topPerformer && (
              <p className="text-zinc-400 mt-4 text-sm leading-relaxed">
                The entry <span className="text-white font-bold italic">&quot;{topPerformer.title}&quot;</span> has generated the highest 
                retention rate, suggesting a deep appetite for this specific strategic theme.
              </p>
            )}
          </div>
          
          <div className="pt-8 border-t border-white/10 mt-8">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>Conversion Velocity</span>
              <span className="text-gold">High</span>
            </div>
            <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gold w-[85%] transition-all duration-1000" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-zinc-950 border border-white/5 rounded-[2rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">
          Detailed Metrics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider pb-4">Title</th>
                <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider pb-4">Likes</th>
                <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider pb-4">Saves</th>
                <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider pb-4">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr 
                  key={item.slug}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 text-sm text-zinc-300">{item.title}</td>
                  <td className="py-4 text-sm text-right font-medium text-white">
                    {item.likes.toLocaleString()}
                  </td>
                  <td className="py-4 text-sm text-right font-medium text-white">
                    {item.saves.toLocaleString()}
                  </td>
                  <td className="py-4 text-sm text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gold/20 text-gold">
                      {item.engagementRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
      <div className={`${color} bg-white/5 p-3 rounded-xl`}>{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">{label}</div>
        <div className="text-xl font-bold text-white leading-none">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}