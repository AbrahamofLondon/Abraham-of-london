/* pages/inner-circle/insufficient-clearance.tsx — Institutional Gatekeeper */
import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { getToken } from "next-auth/jwt";
import { ShieldAlert, ArrowLeft, Terminal, Send, CheckCircle2, ChevronRight, AlertOctagon } from "lucide-react";
import Link from "next/link";
import { auditLogger } from "@/lib/server/db/audit";
import { requiredTierFromVaultPath } from "@/lib/access/tier-policy";

interface Props {
  userTier: string;
  isLoggedIn: boolean;
  attemptedPath: string | null;
  requiredTier: string;
  isLockdown: boolean;
}

export default function InsufficientClearance({ userTier, isLoggedIn, attemptedPath, requiredTier, isLockdown }: Props) {
  const [isAppealing, setIsAppealing] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleAppeal = async () => {
    if (!reason.trim() || isLockdown) return;
    setStatus("sending");
    
    try {
      const res = await fetch("/api/admin/security/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason, 
          attemptedPath, 
          requiredTier 
        }),
      });

      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans selection:bg-rose-500/30">
      <div className={`max-w-md w-full bg-zinc-900/40 border ${isLockdown ? 'border-rose-500/30' : 'border-white/5'} rounded-3xl p-10 text-center backdrop-blur-xl relative overflow-hidden transition-colors duration-700`}>
        {/* Visual Background Pulse for Lockdown */}
        {isLockdown && <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />}
        <ShieldAlert className={`absolute -right-8 -top-8 w-32 h-32 ${isLockdown ? 'text-rose-500' : 'text-zinc-500'} opacity-[0.03] rotate-12`} />

        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-8 border transition-all ${
          isLockdown 
            ? "bg-rose-500/20 border-rose-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]" 
            : "bg-zinc-800/50 border-white/10"
        }`}>
          {isLockdown ? <AlertOctagon className="text-rose-500 animate-pulse" size={32} /> : <ShieldAlert className="text-zinc-500" size={32} />}
        </div>
        
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 italic">
          {isLockdown ? "Institutional Lockdown" : "Clearance Denied"}
        </h1>
        <p className={`text-[10px] font-mono uppercase tracking-[0.2em] mb-8 ${isLockdown ? 'text-rose-500' : 'text-zinc-500'}`}>
          {isLockdown ? "Emergency Protocol Alpha-1 Active" : "Security Violation Logged"}
        </p>

        <div className="bg-black/60 border border-white/5 rounded-2xl p-6 mb-6 text-left relative z-10">
          <div className="flex items-center gap-2 mb-4 text-zinc-500">
            <Terminal size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Diagnostic Data</span>
          </div>
          
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 font-mono">
            {isLockdown 
              ? "The Directorate has suspended all non-administrative traffic. Systems are currently in read-only / restricted mode."
              : `Current clearance (${userTier}) is insufficient for this sector.`
            }
          </p>

          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex justify-between font-mono text-[9px] uppercase">
              <span className="text-zinc-600">Attempt:</span>
              <span className="text-zinc-400 truncate ml-4 max-w-[150px]">{attemptedPath || "Global_Perimeter"}</span>
            </div>
            <div className="flex justify-between font-mono text-[9px] uppercase">
              <span className="text-zinc-600">Status:</span>
              <span className={isLockdown ? "text-rose-500 font-bold" : "text-amber-500 font-bold"}>
                {isLockdown ? "RESTRICTED_ACCESS" : "DENIED"}
              </span>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC ACTION SECTION --- */}
        <div className="mb-8 text-left relative z-10">
          {isLockdown ? (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
              <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 leading-relaxed">
                Appeals are currently suspended during active lockdown. Please monitor official channels.
              </p>
            </div>
          ) : status === "sent" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Appeal Transmitted // Oversight Logged
              </p>
            </div>
          ) : isAppealing ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State operational requirement..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-zinc-300 focus:border-amber-500/50 focus:outline-none transition-all"
                rows={3}
              />
              <button
                onClick={handleAppeal}
                disabled={status === "sending" || !reason.trim()}
                className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {status === "sending" ? "Transmitting..." : "Submit Appeal"}
                <Send size={12} />
              </button>
            </div>
          ) : (
            isLoggedIn && (
              <button
                onClick={() => setIsAppealing(true)}
                className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                Request Access Upgrade
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )
          )}
        </div>

        <div className="flex flex-col gap-4 relative z-10">
          {!isLoggedIn ? (
            <Link 
              href="/inner-circle/login"
              className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-200 transition-all"
            >
              Sign In to Authenticate
            </Link>
          ) : (
            <Link 
              href="/"
              className="w-full py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Exit to Public Hub
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context;
  const token = await getToken({ req });
  
  const isLockdown = query.reason === 'system_lockdown';
  const attemptedPath = query.callbackUrl ? String(query.callbackUrl) : null;
  const requiredTier = attemptedPath ? requiredTierFromVaultPath(attemptedPath) : "RESTRICTED";
  
  // Auditing the denial logic
  if (attemptedPath) {
    const userTier = (token as any)?.aol?.tier || "public";
    
    await auditLogger.log({
      action: isLockdown ? "LOCKDOWN_INTERCEPT" : "ACCESS_DENIED",
      severity: isLockdown ? "critical" : "error",
      actorId: token?.sub || null,
      actorEmail: token?.email || null,
      actorType: token ? "user" : "anonymous",
      status: "denied",
      category: "SECURITY",
      metadata: {
        path: attemptedPath,
        requiredTier,
        userTier,
        isLockdown,
        ip: req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress,
      },
    });
  }

  return {
    props: {
      userTier: (token as any)?.aol?.tier || "public",
      isLoggedIn: !!token,
      attemptedPath,
      requiredTier,
      isLockdown
    },
  };

};