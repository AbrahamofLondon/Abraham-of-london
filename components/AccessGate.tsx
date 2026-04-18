/* components/AccessGate.tsx — State-aware access gate
 *
 * Renders different CTA hierarchies based on authentication state:
 *
 *   State 1 — Already cleared:   success confirmation, continue button
 *   State 2 — Unauthenticated:   sign-in (primary), view access options (secondary)
 *   State 3 — Authenticated, no entitlement:
 *             view access options (primary), redeem key (secondary),
 *             inline key entry (collapsed, expandable for operators)
 *   State 4 — Inline key redemption success: confirmation, reload
 */
"use client";

import React, { useEffect, useState } from "react";
import { Shield, Lock, Loader2, CheckCircle2, Key, ChevronDown, LogIn } from "lucide-react";
import clsx from "clsx";

import {
  normalizeUserTier,
  hasAccess,
  TIER_LABELS,
  type AccessTier,
} from "@/lib/access/tier-policy";
import { clearAccessCache } from "@/lib/inner-circle/access.client";

interface AccessGateProps {
  title: string;
  message?: string;
  requiredTier: AccessTier;
  userTier?: AccessTier | string | null;
  /** Whether the current user has an active session */
  isAuthenticated?: boolean;
  /** Called after inline key redemption succeeds */
  onUnlocked?: (tier: AccessTier) => void;
  /** Override the "View Access Options" destination */
  onGoToAccess?: () => void;
  /** @deprecated Use onGoToAccess instead */
  onGoToJoin?: () => void;
  /** Return path to preserve through sign-in. Defaults to current page. */
  returnPath?: string;
}

export default function AccessGate({
  title,
  message = "This content requires appropriate access.",
  requiredTier,
  userTier,
  isAuthenticated = false,
  onUnlocked,
  onGoToAccess,
  onGoToJoin,
  returnPath,
}: AccessGateProps) {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyEntry, setShowKeyEntry] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const uTier = normalizeUserTier(userTier);
  const isCleared = hasAccess(uTier, requiredTier);
  const requiredLabel = TIER_LABELS[requiredTier] || "Restricted";

  if (!mounted) return <div className="min-h-[400px] bg-black" />;

  // ── State 1: Clearance verified ──────────────────────────────────────
  if (isCleared) {
    return (
      <div className="flex items-center justify-center py-20 px-4 animate-in fade-in duration-700">
        <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-emerald-500" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                Access Granted
              </span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-6" />
            <h2 className="font-serif text-2xl italic text-white">{title}</h2>
            <p className="mt-4 text-sm text-zinc-500 italic">
              Access confirmed at {TIER_LABELS[uTier]} level.
            </p>
            <button
              onClick={() => (onUnlocked ? onUnlocked(uTier) : window.location.reload())}
              className="mt-8 w-full border border-emerald-500/20 bg-emerald-500 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black hover:bg-white transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Shared: inline key submission handler ─────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) return setError("Access key required");

    setBusy(true);
    try {
      const r = await fetch("/api/access/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.reason || "Invalid access key");

      setSuccess(true);
      clearAccessCache();

      setTimeout(() => {
        if (onUnlocked) onUnlocked(j.tier as AccessTier);
        else window.location.reload();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Key validation failed");
    } finally {
      setBusy(false);
    }
  };

  // Resolve handlers
  const handleGoToAccess =
    onGoToAccess || onGoToJoin || (() => window.location.assign("/access"));

  const handleSignIn = () => {
    const path =
      returnPath ||
      (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
    // Use NextAuth's signIn page with a return callback
    window.location.assign(`/api/auth/signin?callbackUrl=${encodeURIComponent(path)}`);
  };

  // ── State 2: Unauthenticated ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20 px-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
            <div className="flex items-center gap-2">
              <Lock size={10} className="text-amber-500" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                Access Required
              </span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>

          <div className="p-8 text-center">
            <h2 className="font-serif text-2xl italic text-white">{title}</h2>
            <p className="mt-3 text-xs text-zinc-500 italic leading-relaxed">
              {message}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-amber-500">
              Required: {requiredLabel}
            </div>
          </div>

          <div className="p-8 pt-0 space-y-4">
            {/* Primary: Sign In */}
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black hover:bg-white transition-all"
            >
              <LogIn size={14} />
              Sign In to Continue
            </button>

            {/* Secondary: View Access Options */}
            <button
              type="button"
              onClick={handleGoToAccess}
              className="w-full border border-white/10 py-3.5 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
            >
              View Access Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── State 3: Authenticated, no entitlement ────────────────────────────
  return (
    <div className="flex items-center justify-center py-20 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-full max-w-md border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <div className="flex items-center gap-2">
            <Lock size={10} className={success ? "text-emerald-500" : "text-amber-500"} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              {success ? "Access Granted" : "Insufficient Access"}
            </span>
          </div>
          <div
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              success ? "bg-emerald-500" : "bg-amber-500 animate-pulse",
            )}
          />
        </div>

        <div className="p-8 text-center">
          <h2 className="font-serif text-2xl italic text-white">{title}</h2>
          <p className="mt-3 text-xs text-zinc-500 italic leading-relaxed">
            {message}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-amber-500">
            Required: {requiredLabel}
          </div>
        </div>

        <div className="p-8 pt-0 space-y-4">
          {/* Primary: View Access Options */}
          <button
            type="button"
            onClick={handleGoToAccess}
            className="w-full bg-amber-500 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black hover:bg-white transition-all"
          >
            View Access Options
          </button>

          {/* Secondary: Redeem Key (dedicated page) */}
          <button
            type="button"
            onClick={() => window.location.assign("/access/redeem")}
            className="w-full border border-white/10 py-3.5 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-400 hover:text-white hover:border-white/20 transition-all"
          >
            Redeem Access Key
          </button>

          {/* Tertiary: Inline key entry (collapsed by default) */}
          {!showKeyEntry ? (
            <button
              type="button"
              onClick={() => setShowKeyEntry(true)}
              className="w-full flex items-center justify-center gap-2 pt-3 text-[9px] font-mono uppercase text-zinc-600 hover:text-zinc-400 transition-colors tracking-widest"
            >
              <Key size={10} />
              I already have a key
              <ChevronDown size={10} />
            </button>
          ) : (
            <form onSubmit={submit} className="space-y-3 pt-3 border-t border-white/5">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={busy || success}
                placeholder="Paste access key"
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 font-mono text-xs text-center tracking-[0.15em] focus:border-amber-500/50 outline-none transition-all text-white"
              />
              {error && (
                <p className="text-[9px] font-mono text-red-500 uppercase text-center tracking-widest">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || success}
                className={clsx(
                  "w-full py-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-all",
                  success
                    ? "bg-emerald-500 text-black"
                    : "border border-amber-500/30 text-amber-500 hover:bg-amber-500/10",
                )}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : success ? (
                  "Access Granted"
                ) : (
                  "Unlock"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
