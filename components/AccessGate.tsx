/* components/AccessGate.tsx — Optimized for Unified Vault */
"use client";

import React from "react";
import { Shield, Lock, ArrowRight, Loader2, Key, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import tiers, { type AccessTier } from "@/lib/access/tiers";
import { getTierLabelAny } from "@/lib/access/aol-tier-bridge";
import { clearAccessCache } from "@/lib/inner-circle/access.client";

interface AccessGateProps {
  title: string;
  message?: string; // Made optional
  requiredTier: AccessTier;
  userTier?: AccessTier | string | null;
  onUnlocked?: (tier: AccessTier) => void;
  onGoToJoin?: () => void;
}

export default function AccessGate({
  title,
  message = "This intelligence brief requires appropriate clearance.",
  requiredTier,
  userTier,
  onUnlocked,
  onGoToJoin,
}: AccessGateProps) {
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(userTier ?? "public");
  
  // Logical check: Does the current user session satisfy the document requirement?
  const alreadyHasAccess = required === "public" || tiers.hasAccess(user, required);
  const requiredLabel = getTierLabelAny(required);

  // If access is already granted, show the "Protocol Cleared" screen
  if (alreadyHasAccess) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-emerald-500" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Protocol // Cleared</span>
            </div>
          </div>
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-6" />
            <h2 className="font-serif text-2xl italic text-white">{title}</h2>
            <p className="mt-4 text-sm text-zinc-500 italic">Clearance verified. System ready.</p>
            <button
              onClick={() => onUnlocked ? onUnlocked(user) : window.location.reload()}
              className="mt-8 w-full border border-emerald-500/20 bg-emerald-500 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black hover:bg-white transition-all"
            >
              Enter Vault
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) return setError("KEY_REQUIRED");

    setBusy(true);
    try {
      const r = await fetch("/api/access/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.reason || "INVALID_KEY");

      setSuccess(true);
      clearAccessCache();
      
      // Delay to show success state before reloading/unlocking
      setTimeout(() => {
        if (onUnlocked) onUnlocked(j.tier);
        else window.location.reload();
      }, 800);
    } catch (err: any) {
      setError(err.message || "DECRYPTION_FAILED");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-2xl">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <div className="flex items-center gap-2">
            <Lock size={10} className={success ? "text-emerald-500" : "text-amber-500"} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              {success ? "Identity Confirmed" : "Security Intercept"}
            </span>
          </div>
          <div className={clsx("h-1.5 w-1.5 rounded-full", success ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
        </div>

        <div className="p-8 text-center">
          <h2 className="font-serif text-2xl italic text-white">{title}</h2>
          <p className="mt-3 text-xs text-zinc-500 italic">"{message}"</p>
          <div className="mt-6 inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-amber-500">
            Required: {requiredLabel}
          </div>
        </div>

        <form onSubmit={submit} className="p-8 pt-0 space-y-4">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={busy || success}
            placeholder="ENTER PROTOCOL KEY"
            className="w-full bg-white/[0.02] border border-white/10 px-4 py-4 font-mono text-xs text-center tracking-[0.2em] focus:border-amber-500/50 outline-none transition-all"
          />
          {error && <p className="text-[9px] font-mono text-red-500 uppercase text-center tracking-widest">{error}</p>}
          
          <button
            type="submit"
            disabled={busy || success}
            className={clsx(
              "w-full py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-all",
              success ? "bg-emerald-500 text-black" : "bg-amber-500 text-black hover:bg-white"
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : success ? "Access Granted" : "Decrypt Asset"}
          </button>

          <button
            type="button"
            onClick={onGoToJoin || (() => window.location.assign("/inner-circle"))}
            className="w-full text-[9px] font-mono uppercase text-zinc-600 hover:text-white transition-colors pt-2 tracking-widest"
          >
            Request Access // Inner Circle
          </button>
        </form>
      </div>
    </div>
  );
}