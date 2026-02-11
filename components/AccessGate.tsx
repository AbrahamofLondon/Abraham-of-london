'use client';

import React, { useMemo, useState } from "react";
import { Shield, Lock, ArrowRight, Loader2, Key, CheckCircle2 } from "lucide-react";
import { safeString } from "@/lib/utils/string";
import { getClearanceLabel } from "@/lib/auth-utils";
import type { AoLTier } from "@/types/next-auth";
import clsx from "clsx";

interface AccessGateProps {
  title: string;
  message: string;
  requiredTier: AoLTier;
  onUnlocked?: (tier: AoLTier) => void;
  onGoToJoin?: () => void;
}

export default function AccessGate({
  title,
  message,
  requiredTier,
  onUnlocked,
  onGoToJoin,
}: AccessGateProps) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredLabel = useMemo(() => {
    return getClearanceLabel(requiredTier);
  }, [requiredTier]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const t = token.trim();
    if (!t) return setError("AUTHENTICATION_TOKEN_REQUIRED");

    setBusy(true);
    try {
      const r = await fetch("/api/access/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.reason || "INVALID_CREDENTIAL_MATCH");
        return;
      }

      setSuccess(true);
      // Brief delay for visual confirmation of decryption success
      setTimeout(() => {
        onUnlocked?.(j.tier as AoLTier);
      }, 800);
      
    } catch (err) {
      setError("ENCRYPTION_LAYER_FAILURE");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <div className="flex items-center gap-2">
            <Shield size={10} className={success ? "text-green-500" : "text-amber-500"} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              {success ? "Protocol // Decrypted" : "Security Protocol // Active"}
            </span>
          </div>
          <div className={clsx(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            success ? "bg-green-500" : "bg-amber-500"
          )} />
        </div>

        {/* HEADER SECTION */}
        <div className="p-8 text-center">
          <div className={clsx(
            "mx-auto mb-6 flex h-16 w-16 items-center justify-center border transition-all duration-500",
            success 
              ? "border-green-500/40 bg-green-500/10" 
              : "border-amber-500/20 bg-amber-500/5 group-hover:bg-amber-500/10"
          )}>
            {success ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 animate-in zoom-in" />
            ) : (
              <Key className="h-6 w-6 text-amber-500" />
            )}
          </div>
          <h2 className="font-serif text-2xl italic text-zinc-100">{title}</h2>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-zinc-500 italic">
            "{message}"
          </p>
          
          <div className={clsx(
            "mt-8 inline-flex items-center gap-3 border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.3em] transition-colors duration-500",
            success 
              ? "border-green-500/20 bg-green-500/5 text-green-500" 
              : "border-amber-500/20 bg-amber-500/5 text-amber-500"
          )}>
            <Lock size={10} /> {requiredLabel}
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="p-8 pt-0">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-3">
              <label className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                <span>Enter Security Key</span>
                <span>[SHA-256 Validated]</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={token}
                  disabled={busy || success}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={success ? "IDENTITY_CONFIRMED" : "PROTOCOL_KEY_REQUIRED"}
                  className={clsx(
                    "w-full border border-white/5 bg-zinc-900/50 px-5 py-4 font-mono text-xs text-white transition-all focus:border-amber-500/40 focus:outline-none focus:ring-0 placeholder:text-zinc-800",
                    error && "border-red-500/50",
                    success && "border-green-500/50 text-green-500"
                  )}
                />
              </div>
              {error && (
                <p className="font-mono text-[9px] uppercase tracking-widest text-red-500 mt-2 flex items-center gap-2">
                  <span className="h-1 w-1 bg-red-500" /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || success}
              className={clsx(
                "group relative w-full overflow-hidden border px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-all",
                success 
                  ? "border-green-500/20 bg-green-500 text-black" 
                  : "border-amber-500/20 bg-amber-500 text-black hover:bg-white"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : success ? (
                  <>Access Granted</>
                ) : (
                  <>Initialise Decryption <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoToJoin}
              className="w-full text-center font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-600 hover:text-amber-500 transition-colors"
            >
              Request Credentials // Inner Circle
            </button>
          </form>
        </div>

        {/* FOOTER BAR */}
        <div className="border-t border-white/5 bg-white/[0.01] px-4 py-2 flex justify-between items-center">
            <span className="font-mono text-[8px] uppercase text-zinc-700 tracking-tighter">
              {success ? "Vault Entry Sequence Initiated" : "Encrypted Connection Established"}
            </span>
            <div className="flex gap-1">
                <div className={clsx("h-1 w-3 transition-colors", success ? "bg-green-500/20" : "bg-amber-500/20")} />
                <div className={clsx("h-1 w-3 transition-colors", success ? "bg-green-500/40" : "bg-amber-500/40")} />
                <div className={clsx("h-1 w-3 transition-colors", success ? "bg-green-500/60" : "bg-amber-500/60")} />
            </div>
        </div>
      </div>
    </div>
  );
}