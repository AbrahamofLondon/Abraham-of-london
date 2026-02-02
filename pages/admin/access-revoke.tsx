/* pages/admin/access-revoke.tsx — SECURITY OVERRIDE & ACCESS TERMINATION */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import { ShieldAlert, Trash2, Key, Timer, RefreshCw } from "lucide-react";

type Result =
  | { ok: true; message: string }
  | { ok: false; message: string };

const STORAGE_KEY = "aol_admin_revoke_token";

export default function AdminAccessRevokePage() {
  const [adminToken, setAdminToken] = useState("");
  const [remember, setRemember] = useState(true);

  const [sessionToken, setSessionToken] = useState("");
  const [keyHash, setKeyHash] = useState("");
  const [reason, setReason] = useState("manual_revoke");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Persistence: Hydrate Admin Token from Session Storage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setAdminToken(saved);
  }, []);

  // Persistence: Commit Admin Token to Session Storage
  useEffect(() => {
    if (typeof window === "undefined" || !remember || !adminToken) return;
    window.sessionStorage.setItem(STORAGE_KEY, adminToken);
  }, [adminToken, remember]);

  const canSubmit = useMemo(() => adminToken.trim().length > 0, [adminToken]);

  const revoke = useCallback(async () => {
    setResult(null);
    setBusy(true);

    try {
      const payload: Record<string, any> = {
        reason: reason.trim() || "manual_revoke",
      };

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
        message: "Access Terminated. If the current browser was targeted, synchronization will drop immediately.",
      });

      setSessionToken("");
      setKeyHash("");
    } catch (e: any) {
      setResult({ ok: false, message: "Network Interruption: Infrastructure Unreachable" });
    } finally {
      setBusy(false);
    }
  }, [adminToken, sessionToken, keyHash, reason]);

  const forgetToken = useCallback(() => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
    setAdminToken("");
  }, []);

  return (
    <Layout>
      <Head>
        <title>Security Terminal | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-500/30">
        <div className="mx-auto max-w-4xl px-6 py-16">
          
          <div className="mb-12 flex items-end justify-between border-b border-white/5 pb-8">
            <div>
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                <ShieldAlert size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Restricted Access</span>
              </div>
              <h1 className="text-4xl font-serif font-black tracking-tight">Access Revocation</h1>
              <p className="mt-4 text-sm text-zinc-500 max-w-md leading-relaxed">
                Interface for manual termination of session tokens and cryptographic key hashes. 
                All actions are logged in the <code className="text-zinc-300">/api/access/revoke</code> ledger.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Control Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-xl">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                  <Key size={14} className="text-amber-500" /> Authentication
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Admin Bearer Token</label>
                    <input
                      type="password"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      placeholder="ACCESS_REVOKE_ADMIN_TOKEN"
                      className="w-full rounded-2xl border border-white/5 bg-black px-5 py-4 text-xs font-mono text-amber-200 placeholder:text-zinc-800 focus:border-amber-500/50 outline-none transition-all"
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
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">Remember Session</span>
                    </label>
                    <button
                      onClick={forgetToken}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-rose-500 transition-colors"
                    >
                      Clear Trace
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} /> Critical Warning
                </h3>
                <p className="text-xs text-rose-200/60 leading-relaxed">
                  Revoking a <b>Key Hash</b> will result in a global lockout for that specific credential across all active sessions. This action is irreversible via this terminal.
                </p>
              </div>
            </div>

            {/* Execution Panel */}
            <div className="lg:col-span-7">
              <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-10 space-y-8">
                
                <div className="grid gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Session Target</label>
                      <span className="text-[9px] text-zinc-600 font-mono">Optional</span>
                    </div>
                    <input
                      value={sessionToken}
                      onChange={(e) => setSessionToken(e.target.value)}
                      placeholder="sess_... (Leave blank for current cookie)"
                      className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-5 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Hash Target</label>
                      <span className="text-[9px] text-zinc-600 font-mono">Optional</span>
                    </div>
                    <input
                      value={keyHash}
                      onChange={(e) => setKeyHash(e.target.value)}
                      placeholder="sha256/hmac target hash"
                      className="w-full rounded-2xl border border-white/5 bg-zinc-950 px-6 py-5 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Classification of Revocation</label>
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
                    disabled={!canSubmit || busy}
                    onClick={revoke}
                    className="group relative w-full overflow-hidden rounded-2xl bg-white px-8 py-6 text-xs font-black uppercase tracking-[0.3em] text-black transition-all hover:bg-rose-500 hover:text-white disabled:opacity-20"
                  >
                    <div className="flex items-center justify-center gap-3">
                      {busy ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      {busy ? "Terminating..." : "Execute Revocation"}
                    </div>
                  </button>
                </div>

                {result && (
                  <div className={`animate-in slide-in-from-top-2 duration-500 rounded-2xl border p-6 text-sm flex items-start gap-4 ${
                    result.ok 
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" 
                      : "border-rose-500/20 bg-rose-500/5 text-rose-200"
                  }`}>
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${result.ok ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                    <p className="font-medium leading-relaxed">{result.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
             <OpsNote icon={<Timer size={14}/>} title="Immediate Effect" text="Revocations ripple through the edge cache within < 300ms." />
             <OpsNote icon={<ShieldAlert size={14}/>} title="Audit Trail" text="Target IP, timestamp, and admin token signature are logged." />
             <OpsNote icon={<Key size={14}/>} title="Environment" text="Ensure ACCESS_REVOKE_ADMIN_TOKEN is locked in Vercel." />
          </div>
        </div>
      </div>
    </Layout>
  );
}

const OpsNote = ({ icon, title, text }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-zinc-500">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
    </div>
    <p className="text-xs text-zinc-600 leading-relaxed">{text}</p>
  </div>
);