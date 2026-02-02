// components/AccessGate.tsx — REFINED
'use client';

import React, { useMemo, useState } from "react";
import { Shield, Lock, ArrowRight, Loader2 } from "lucide-react";
import { safeString } from "@/lib/utils/string";

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
    if (tierStr.includes("private")) return "Private";
    if (tierStr.includes("inner-circle")) return "Inner Circle";
    return "Public";
  }, [requiredTier]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const t = token.trim();
    if (!t) return setError("Credential required.");

    setBusy(true);
    try {
      const r = await fetch("/api/access/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.reason || "Verification failed. Check your key.");
        return;
      }

      onUnlocked?.(j.tier as Tier);
    } catch (err) {
      setError("Encryption error. Check connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/20">
            <Shield className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-2xl font-serif italic text-white">{title}</h2>
          <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{message}</p>
          
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-gold">
            <Lock size={10} /> {requiredLabel} Clearance Required
          </div>
        </div>

        <div className="p-8 pt-0">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 ml-1">
                Security Key
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/5 bg-black/40 px-5 py-4 text-white placeholder:text-zinc-800 outline-none transition-all focus:border-gold/30 focus:ring-1 focus:ring-gold/20"
              />
              {error && <p className="text-xs text-rose-500 mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="group relative w-full overflow-hidden rounded-xl bg-gold px-6 py-4 text-sm font-bold text-black transition-all hover:bg-white active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Unlock Brief <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoToJoin}
              className="w-full text-center text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 hover:text-gold transition-colors"
            >
              Request Access // Inner Circle
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}