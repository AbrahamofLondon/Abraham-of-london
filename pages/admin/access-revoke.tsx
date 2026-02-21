/* pages/admin/access-revoke.tsx — BULLETPROOF (No useRouter, No next/router, SSR-only) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";

// 🚫 IMPORTANT: Admin pages should not rely on shared chrome until fully audited.
// Toggle this ON only when Layout/Header are proven router-clean in prerender.
const USE_LAYOUT = false as const;

// Optional import (only evaluated if USE_LAYOUT true)
let Layout: any = null;
if (USE_LAYOUT) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Layout = require("@/components/Layout").default;
}

type Result = { ok: true; message: string } | { ok: false; message: string };

const STORAGE_KEY = "aol_admin_revoke_token";

function getParam(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get(name) || "";
  } catch {
    return "";
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  if (!USE_LAYOUT) return <>{children}</>;
  return <Layout>{children}</Layout>;
}

/**
 * ✅ CRITICAL: Force SSR so Next export/prerender won't attempt to mount router.
 * This alone neutralizes the "NextRouter was not mounted" during export.
 */
export async function getServerSideProps() {
  return { props: {} };
}

export default function AdminAccessRevokePage() {
  const [mounted, setMounted] = useState(false);

  const [adminToken, setAdminToken] = useState("");
  const [remember, setRemember] = useState(true);

  const [sessionToken, setSessionToken] = useState("");
  const [keyHash, setKeyHash] = useState("");
  const [reason, setReason] = useState("manual_revoke");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => setMounted(true), []);

  // Hydrate token from sessionStorage (client-only)
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) setAdminToken(saved);
    } catch {
      // ignore
    }
  }, [mounted]);

  // Hydrate from URL params (client-only)
  useEffect(() => {
    if (!mounted) return;

    const tokenParam = getParam("token");
    const sessionParam = getParam("session");
    const hashParam = getParam("hash");
    const reasonParam = getParam("reason");

    if (tokenParam) setAdminToken(tokenParam);
    if (sessionParam) setSessionToken(sessionParam);
    if (hashParam) setKeyHash(hashParam);
    if (reasonParam) setReason(reasonParam);
  }, [mounted]);

  // Persist token if requested (client-only)
  useEffect(() => {
    if (!mounted) return;
    try {
      if (!remember) return;
      if (!adminToken.trim()) return;
      window.sessionStorage.setItem(STORAGE_KEY, adminToken.trim());
    } catch {
      // ignore
    }
  }, [mounted, remember, adminToken]);

  const canSubmit = useMemo(() => adminToken.trim().length > 0 && !busy, [adminToken, busy]);

  const revoke = useCallback(async () => {
    setResult(null);
    setBusy(true);

    try {
      const payload: Record<string, any> = { reason: reason.trim() || "manual_revoke" };
      const st = sessionToken.trim();
      const kh = keyHash.trim();
      if (st) payload.sessionToken = st;
      if (kh) payload.keyHash = kh;

      const r = await fetch("/api/access/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken.trim(),
        },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j?.ok) {
        setResult({ ok: false, message: j?.reason || `Authority Denied (${r.status})` });
        return;
      }

      setResult({
        ok: true,
        message:
          "Access terminated. If the current browser was targeted, authorization should drop immediately.",
      });

      setSessionToken("");
      setKeyHash("");
    } catch {
      setResult({ ok: false, message: "Network interruption: infrastructure unreachable." });
    } finally {
      setBusy(false);
    }
  }, [adminToken, sessionToken, keyHash, reason]);

  const forgetToken = useCallback(() => {
    if (!mounted) return;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setAdminToken("");
  }, [mounted]);

  // SSR render is harmless (no window access here)
  // We still show a neutral terminal shell until mounted.
  if (!mounted) {
    return (
      <Shell>
        <Head>
          <title>Security Terminal | Abraham of London</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
          <div className="text-zinc-600 text-sm">Initializing security terminal…</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Head>
        <title>Security Terminal | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-500/30">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-12 flex items-end justify-between border-b border-white/5 pb-8">
            <div>
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/25">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.55)]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                  Restricted Access
                </span>
              </div>

              <h1 className="text-4xl font-serif font-black tracking-tight">Access Revocation</h1>

              <p className="mt-4 text-sm text-zinc-500 max-w-md leading-relaxed">
                Manual termination of session tokens and key hashes. Executes against{" "}
                <code className="text-zinc-300">/api/access/revoke</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
                  Authentication
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Admin Bearer Token
                    </label>
                    <input
                      type="password"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      placeholder="ACCESS_REVOKE_ADMIN_TOKEN"
                      className="w-full rounded-2xl border border-white/5 bg-black px-5 py-4 text-xs font-mono text-amber-200 placeholder:text-zinc-800 focus:border-amber-500/50 outline-none transition-all"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                      />
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        Remember session
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={forgetToken}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-rose-500 transition-colors"
                    >
                      Clear trace
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4">
                  Critical Warning
                </h3>
                <p className="text-xs text-rose-200/60 leading-relaxed">
                  Revoking a <b>Key Hash</b> can lock out that credential across all sessions. This is not reversible
                  via this terminal.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-7">
              <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-10 space-y-8">
                <div className="grid gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Session target
                      </label>
                      <span className="text-[9px] text-zinc-600 font-mono">Optional</span>
                    </div>
                    <input
                      value={sessionToken}
                      onChange={(e) => setSessionToken(e.target.value)}
                      placeholder="sess_... (blank = current cookie)"
                      className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-5 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 outline-none transition-all shadow-inner"
                      spellCheck={false}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Hash target
                      </label>
                      <span className="text-[9px] text-zinc-600 font-mono">Optional</span>
                    </div>
                    <input
                      value={keyHash}
                      onChange={(e) => setKeyHash(e.target.value)}
                      placeholder="sha256/hmac target hash"
                      className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-5 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 outline-none transition-all shadow-inner"
                      spellCheck={false}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Classification
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-5 text-sm text-zinc-300 focus:border-white/20 outline-none appearance-none cursor-pointer"
                    >
                      <option value="manual_revoke">Administrative Override</option>
                      <option value="fraud">Fraudulent Acquisition</option>
                      <option value="chargeback">Financial Reversal</option>
                      <option value="expired">Term Duration Exceeded</option>
                      <option value="breach">Security Compromise</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={!canSubmit}
                    onClick={revoke}
                    className="group relative w-full overflow-hidden rounded-2xl bg-white px-8 py-6 text-xs font-black uppercase tracking-[0.3em] text-black transition-all hover:bg-rose-500 hover:text-white disabled:opacity-20"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className={[
                          "inline-block h-3 w-3 rounded-full",
                          busy ? "bg-zinc-400 animate-pulse" : "bg-black/40",
                        ].join(" ")}
                      />
                      {busy ? "Terminating…" : "Execute Revocation"}
                    </div>
                  </button>
                </div>

                {result && (
                  <div
                    className={[
                      "animate-in slide-in-from-top-2 duration-500 rounded-2xl border p-6 text-sm flex items-start gap-4",
                      result.ok
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                        : "border-rose-500/20 bg-rose-500/5 text-rose-200",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-1 h-2 w-2 rounded-full shrink-0",
                        result.ok
                          ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]",
                      ].join(" ")}
                    />
                    <p className="font-medium leading-relaxed">{result.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
            <OpsNote title="Immediate effect" text="Revocations propagate fast. Expect near-instant enforcement." />
            <OpsNote title="Audit trail" text="Your API should log timestamp, IP, and operator signature." />
            <OpsNote title="Environment" text="Lock ACCESS_REVOKE_ADMIN_TOKEN in deployment secrets." />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function OpsNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-3">
      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{title}</div>
      <p className="text-xs text-zinc-600 leading-relaxed">{text}</p>
    </div>
  );
}