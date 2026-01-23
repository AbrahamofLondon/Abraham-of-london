'use client';

import React, { useMemo, useState } from "react";

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
    if (requiredTier === "private") return "Private";
    if (requiredTier === "inner-circle") return "Inner Circle";
    return "Public";
  }, [requiredTier]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const t = token.trim();
    if (!t) return setError("Enter your access key.");

    setBusy(true);
    try {
      const r = await fetch("/api/access/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        setError(j?.reason || "Access denied.");
        return;
      }

      onUnlocked?.(j.tier as Tier);
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="border-b border-white/10 p-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-zinc-400">{message}</p>
          <div className="mt-4 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
            {requiredLabel} Access Required
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Access Key
              </label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your key"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-zinc-600 outline-none ring-0 focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10"
              />
              {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
            >
              {busy ? "Verifying..." : "Unlock"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onGoToJoin}
                className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-amber-300"
              >
                Need access? Join Inner Circle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}