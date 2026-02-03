// components/AccessGate.tsx — HARDENED (Security Sentinel)
'use client';

import React, { useMemo, useState } from "react";
import { Shield, Lock, ArrowRight, Loader2, Key } from "lucide-react";
import { safeString } from "@/lib/utils/string";
import clsx from "clsx";

type Tier = "public" | "inner-circle" | "private";

interface AccessGateProps {
  title: string;
  message: string;
  requiredTier: Tier;
  onUnlocked?: (tier: Tier) => void;
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
  const [error, setError] = useState<string | null>(null);

  const requiredLabel = useMemo(() => {
    const tierStr = safeString(requiredTier).toLowerCase();
    if (tierStr.includes("private")) return "Classified";
    if (tierStr.includes("inner-circle")) return "Inner Circle";
    return "Standard";
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

      onUnlocked?.(j.tier as Tier);
    } catch (err) {
      setError("ENCRYPTION_LAYER_FAILURE");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <div className="flex items-center gap-2">
            <Shield size={10} className="text-amber-500" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Security Protocol // Active
            </span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>

        {/* HEADER SECTION */}
        <div className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-amber-500/20 bg-amber-500/5 transition-all group-hover:bg-amber-500/10">
            <Key className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="font-serif text-2xl italic text-zinc-100">{title}</h2>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-zinc-500 italic">
            "{message}"
          </p>
          
          <div className="mt-8 inline-flex items-center gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500">
            <Lock size={10} /> {requiredLabel} Clearance Required
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="p-8 pt-0">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-3">
              <label className="flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                <span>Enter Security Key</span>
                <span>[AES-256]</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="PROTOCOL_KEY_REQUIRED"
                  className={clsx(
                    "w-full border border-white/5 bg-zinc-900/50 px-5 py-4 font-mono text-xs text-white transition-all focus:border-amber-500/40 focus:outline-none focus:ring-0 placeholder:text-zinc-800",
                    error && "border-red-500/50"
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
              disabled={busy}
              className="group relative w-full overflow-hidden border border-amber-500/20 bg-amber-500 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-white disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
            <span className="font-mono text-[8px] uppercase text-zinc-700 tracking-tighter">Encrypted Connection Established</span>
            <div className="flex gap-1">
                <div className="h-1 w-3 bg-amber-500/20" />
                <div className="h-1 w-3 bg-amber-500/40" />
                <div className="h-1 w-3 bg-amber-500/60" />
            </div>
        </div>
      </div>
    </div>
  );
}