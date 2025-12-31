// components/admin/ShortsAnalytics.tsx - FIXED

import * as React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { Heart, Bookmark, TrendingUp, Zap } from "lucide-react";

interface AnalyticsProps {
  data: {
    slug: string;
    title: string;
    likes: number;
    saves: number;
    engagementRate: number;
  }[];
}

const BRAND_COLORS = ["#d4af37", "#aa8a2e", "#826a23", "#5b4a18"];

export default function ShortsAnalytics({ data }: AnalyticsProps) {
  const totalLikes = data.reduce((acc, curr) => acc + curr.likes, 0);
  const totalSaves = data.reduce((acc, curr) => acc + curr.saves, 0);
  const topPerformer = [...data].sort((a, b) => (b.likes + b.saves) - (a.likes + a.saves))[0];

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
        
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-zinc-950 border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="text-gold" size={20} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Content Reach</h3>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="slug" hide />
                <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #d4af37", borderRadius: "12px" }}
                  itemStyle={{ color: "#d4af37" }}
                />
                <Bar dataKey="likes" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High-Impact Insight Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-gold/20 rounded-[2rem] p-8 flex flex-col justify-between">
          <div>
            <Zap className="text-gold mb-6" size={32} />
            <h3 className="font-serif text-2xl font-bold text-white leading-tight">
              Top Performance Insight
            </h3>
            <p className="text-zinc-400 mt-4 text-sm leading-relaxed">
              The entry <span className="text-white font-bold italic">&quot;{topPerformer?.title}&quot;</span> has generated the highest 
              retention rate, suggesting a deep appetite for this specific strategic theme.
            </p>
          </div>
          
          <div className="pt-8 border-t border-white/10 mt-8">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>Conversion Velocity</span>
              <span className="text-gold">High</span>
            </div>
            <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gold w-[85%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
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
