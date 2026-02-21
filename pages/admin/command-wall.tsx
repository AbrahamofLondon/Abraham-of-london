/* pages/admin/command-wall.tsx — SSR-ONLY (Stops prerender router crash) */

import React, { useState } from "react";
import type { GetServerSideProps, NextPage } from "next";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

import { KnowledgeGraph } from "@/components/Intelligence/KnowledgeGraph";
import { SecurityDashboard } from "@/components/Admin/SecurityDashboard";
import { DiscoveryOverlay } from "@/components/Intelligence/DiscoveryOverlay";

import { ShieldCheck, Search, FileText, Settings, Bell, Cpu } from "lucide-react";

export const getServerSideProps: GetServerSideProps = withAdminAuth(async () => {
  // This forces SSR and prevents static generation
  return { props: {} };
});

const CommandWall: NextPage = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<"TOPOLOGY" | "SECURITY" | "LIBRARY">("TOPOLOGY");

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
      <DiscoveryOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Navigation & Global Metrics */}
      <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center">
                <ShieldCheck className="text-black" size={20} />
              </div>
              <span className="font-black text-xl uppercase tracking-tighter">Directorate_OS</span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="hidden md:flex items-center gap-6">
              <NavButton active={activeView === "TOPOLOGY"} onClick={() => setActiveView("TOPOLOGY")} label="Strategic Topology" />
              <NavButton active={activeView === "SECURITY"} onClick={() => setActiveView("SECURITY")} label="Oversight & Audit" />
              <NavButton active={activeView === "LIBRARY"} onClick={() => setActiveView("LIBRARY")} label="Dossier Library" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-zinc-400"
            >
              <Search size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Search Intelligence (⌘K)</span>
            </button>
            <div className="p-2 text-zinc-500 hover:text-white cursor-pointer">
              <Bell size={20} />
            </div>
            <div className="p-2 text-zinc-500 hover:text-white cursor-pointer">
              <Settings size={20} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {activeView === "TOPOLOGY" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <HeaderStat label="System Integrity" value="98.4%" trend="+0.2" />
                <HeaderStat label="Active Mandates" value="12" color="text-amber-500" />
                <HeaderStat label="Intelligence Depth" value="75 Briefs" />
                <HeaderStat label="Last Audit" value="2m Ago" />
              </div>
              <KnowledgeGraph frameworks={[]} />
            </>
          )}

          {activeView === "SECURITY" && <SecurityDashboard logs={[]} />}

          {activeView === "LIBRARY" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl hover:border-amber-500/50 transition-all group"
                >
                  <FileText className="text-zinc-600 group-hover:text-amber-500 mb-6 transition-colors" size={24} />
                  <h4 className="text-lg font-bold uppercase tracking-tight mb-2">Institutional Succession 0{i + 1}</h4>
                  <p className="text-sm text-zinc-500 mb-6 line-clamp-2 uppercase font-mono text-[10px]">
                    Strategic_Verification_Dossier_PR_0{i + 1}
                  </p>
                  <button className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white text-zinc-400 hover:text-black transition-all">
                    Access Intelligence
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* System Status Footer */}
      <footer className="fixed bottom-0 w-full bg-black/80 backdrop-blur-md border-t border-white/5 px-8 py-3 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Neural_Engine_Online</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={12} className="text-zinc-700" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Vector_Space_Synchronized</span>
          </div>
        </div>
        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
          © 2026 Abraham of London // Level 4 Authorization Required
        </div>
      </footer>
    </div>
  );
};

export default CommandWall;

const NavButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
    }`}
  >
    {label}
    {active && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 animate-in fade-in zoom-in duration-500" />}
  </button>
);

const HeaderStat = ({ label, value, trend, color = "text-white" }: any) => (
  <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-3">
      <h4 className={`text-2xl font-mono font-bold ${color}`}>{value}</h4>
      {trend && <span className="text-[10px] font-mono text-emerald-500">{trend}</span>}
    </div>
  </div>
);