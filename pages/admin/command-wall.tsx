/* pages/admin/command-wall.tsx — Directorate Control Surface */
import React, { useState, useEffect } from "react";
import type { GetServerSideProps, NextPage } from "next";
import { withAdminAuth } from "@/lib/auth/withAdminAuth";

import { KnowledgeGraph } from "@/components/Intelligence/KnowledgeGraph";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard"; // This now contains SecuritySummary + Logs
import { DiscoveryOverlay } from "@/components/Intelligence/DiscoveryOverlay";
import { adminFetch } from "@/lib/api/admin-client";

import {
  ShieldCheck,
  Search,
  FileText,
  Settings,
  Bell,
  Cpu,
  Loader2,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async () => {
  // SSR ensures this page never prerenders static HTML without Auth
  return { props: {} };
};

const CommandWallPage: NextPage = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<"TOPOLOGY" | "SECURITY" | "LIBRARY">("TOPOLOGY");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Unified Intelligence Fetch
  useEffect(() => {
    async function syncCommandWall() {
      try {
        const res = await adminFetch("/api/admin/system/logs?limit=200");
        const data = await res.json();
        if (data.ok) setLogs(data.logs);
      } catch (err) {
        console.error("[COMMAND_WALL_SYNC_ERROR]", err);
      } finally {
        setLoading(false);
      }
    }
    syncCommandWall();
  }, []);

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-amber-500/30">
      <DiscoveryOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500">
                <ShieldCheck className="text-black" size={20} />
              </div>
              <span className="text-xl font-black uppercase tracking-tighter">
                Directorate_OS
              </span>
            </div>

            <div className="hidden h-8 w-px bg-white/10 md:block" />

            <div className="hidden items-center gap-6 md:flex">
              <NavButton
                active={activeView === "TOPOLOGY"}
                onClick={() => setActiveView("TOPOLOGY")}
                label="Strategic Topology"
              />
              <NavButton
                active={activeView === "SECURITY"}
                onClick={() => setActiveView("SECURITY")}
                label="Oversight & Audit"
              />
              <NavButton
                active={activeView === "LIBRARY"}
                onClick={() => setActiveView("LIBRARY")}
                label="Dossier Library"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-400 transition-all hover:bg-white/10"
            >
              <Search size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Search Intelligence (⌘K)
              </span>
            </button>
            <div className="cursor-pointer p-2 text-zinc-500 hover:text-white transition-colors">
              <Bell size={20} />
            </div>
            <div className="cursor-pointer p-2 text-zinc-500 hover:text-white transition-colors">
              <Settings size={20} />
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN COMMAND INTERFACE */}
      <main className="mx-auto max-w-[1600px] px-8 py-10">
        {loading ? (
          <div className="flex h-[60vh] items-center justify-center gap-4 text-amber-500/50 font-mono text-xs uppercase tracking-[0.3em]">
            <Loader2 className="animate-spin" size={20} />
            Initialising Strategic Interface...
          </div>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {activeView === "TOPOLOGY" && (
              <>
                <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <HeaderStat
                    label="System Integrity"
                    value="98.4%"
                    trend="+0.2"
                  />
                  <HeaderStat
                    label="Threat Level"
                    value={logs.some((l: any) => l.severity === 'critical') ? "ELEVATED" : "NOMINAL"}
                    color={logs.some((l: any) => l.severity === 'critical') ? "text-red-500" : "text-amber-500"}
                  />
                  <HeaderStat label="Intelligence Depth" value="75 Briefs" />
                  <HeaderStat label="Session Uptime" value="142h" />
                </div>
                <KnowledgeGraph frameworks={[]} />
              </>
            )}

            {activeView === "SECURITY" && <SecurityDashboard logs={logs} />}

            {activeView === "LIBRARY" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="group rounded-3xl border border-white/5 bg-zinc-900/40 p-8 transition-all hover:border-amber-500/50"
                  >
                    <FileText
                      className="mb-6 text-zinc-600 transition-colors group-hover:text-amber-500"
                      size={24}
                    />
                    <h4 className="mb-2 text-lg font-bold uppercase tracking-tight">
                      Institutional Succession 0{i + 1}
                    </h4>
                    <p className="mb-6 line-clamp-2 font-mono text-[10px] uppercase text-zinc-500">
                      Strategic_Verification_Dossier_PR_0{i + 1}
                    </p>
                    <button className="w-full rounded-xl border border-white/5 bg-white/5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:bg-white hover:text-black">
                      Access Intelligence
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* GLOBAL FOOTER STATUS BAR */}
      <footer className="fixed bottom-0 z-50 flex w-full items-center justify-between border-t border-white/5 bg-black/80 px-8 py-3 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Neural_Engine_{loading ? 'Syncing' : 'Online'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={12} className="text-zinc-700" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Vector_Space_Synchronized
            </span>
          </div>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-700">
          © 2026 Abraham of London // Level 4 Authorization Required
        </div>
      </footer>
    </div>
  );
};

export default withAdminAuth(CommandWallPage);

/**
 * SUB-COMPONENTS
 */

type NavButtonProps = { active: boolean; onClick: () => void; label: string };
const NavButton = ({ active, onClick, label }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`relative py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
      active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
    }`}
  >
    {label}
    {active && (
      <div className="animate-in fade-in zoom-in absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
    )}
  </button>
);

type HeaderStatProps = { label: string; value: string; trend?: string; color?: string };
const HeaderStat = ({ label, value, trend, color = "text-white" }: HeaderStatProps) => (
  <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-sm hover:border-white/10 transition-colors">
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
      {label}
    </p>
    <div className="flex items-baseline gap-3">
      <h4 className={`font-mono text-2xl font-bold ${color}`}>{value}</h4>
      {trend ? (
        <span className="font-mono text-[10px] text-emerald-500">{trend}</span>
      ) : null}
    </div>
  </div>
);