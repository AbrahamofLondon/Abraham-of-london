// pages/admin/access-revoke.tsx
// ✅ Admin-only revoke console (simple + effective)
// ✅ Uses X-Admin-Token header (stored in sessionStorage)
// ✅ Can revoke: current cookie session, specific session token, and/or a keyHash
// ✅ No extra backend endpoints needed (uses /api/access/revoke)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";

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

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
    if (saved) setAdminToken(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!remember) return;
    if (!adminToken) return;
    window.sessionStorage.setItem(STORAGE_KEY, adminToken);
  }, [adminToken, remember]);

  const canSubmit = useMemo(() => {
    if (!adminToken.trim()) return false;
    // allow "revoke current cookie session" with empty sessionToken/keyHash
    // but still needs token.
    return true;
  }, [adminToken]);

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
        setResult({ ok: false, message: j?.reason || `Failed (${r.status})` });
        return;
      }

      setResult({
        ok: true,
        message:
          "Revocation succeeded. If this browser session was revoked, it will be logged out immediately.",
      });

      // if you revoked current browser session, you may want to clear inputs
      // (we do not clear the admin token)
      setSessionToken("");
      setKeyHash("");
    } catch (e: any) {
      setResult({ ok: false, message: "Network/server error" });
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
        <title>Admin — Access Revocation | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold">Admin — Access Revocation</h1>
              <p className="mt-2 text-sm text-zinc-400">
                This console calls <code className="text-zinc-300">/api/access/revoke</code> with the
                admin header. Keep this page <b>noindex</b> and don’t link it publicly.
              </p>
            </div>

            {/* Admin token */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Admin Token (x-admin-token)
              </label>
              <input
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Paste ACCESS_REVOKE_ADMIN_TOKEN"
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember in this browser session
                </label>
                <button
                  type="button"
                  onClick={forgetToken}
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-amber-300"
                >
                  Forget token
                </button>
              </div>
            </div>

            <hr className="my-6 border-white/10" />

            {/* Action inputs */}
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Session Token (optional)
                </label>
                <input
                  value={sessionToken}
                  onChange={(e) => setSessionToken(e.target.value)}
                  placeholder="sess_... or your cookie session token (optional)"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Leave blank to revoke the <b>current browser session</b> (cookie), if present.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Key Hash (optional)
                </label>
                <input
                  value={keyHash}
                  onChange={(e) => setKeyHash(e.target.value)}
                  placeholder="sha256/hmac hash of key (optional)"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Use this to revoke the underlying key (full lockout). You can revoke session-only
                  without touching key.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Reason
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="manual_revoke | fraud | chargeback | expired | etc."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-amber-500/30 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              <button
                type="button"
                disabled={!canSubmit || busy}
                onClick={revoke}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-black transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60"
              >
                {busy ? "Revoking..." : "Revoke Now"}
              </button>

              {result && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    result.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {result.message}
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-400">
                <div className="font-semibold text-zinc-300 mb-2">Operational notes</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Ensure{" "}
                    <code className="text-zinc-300">ACCESS_REVOKE_ADMIN_TOKEN</code> is set in your
                    hosting environment.
                  </li>
                  <li>
                    Keep this page unlinked. It’s protected by the header token, not by obscurity —
                    but don’t tempt fools.
                  </li>
                  <li>
                    If you want a “proper” admin auth later, we can swap this to NextAuth admin
                    sessions.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}