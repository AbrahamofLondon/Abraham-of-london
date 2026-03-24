/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/index.tsx — SSR-ONLY (Security-Integrated Directorate Terminal) */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";

// ✅ Force SSR to prevent static export of sensitive administrative routes
export async function getServerSideProps() {
  return { props: {} };
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl shadow-2xl">
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-amber-500 px-6 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-black hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

const AdminIndexPage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const [adminKey, setAdminKey] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [sessionStatus, setSessionStatus] = React.useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [sessionUser, setSessionUser] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    // Check if a key was previously saved in this session
    const saved = sessionStorage.getItem("inner_circle_admin_key");
    if (saved) setAdminKey(saved);
  }, []);

  // ✅ Client-only session load
  React.useEffect(() => {
    if (!mounted) return;
    let alive = true;

    (async () => {
      try {
        const mod: any = await import("next-auth/react");
        const getSession = mod?.getSession;

        if (!getSession) {
          if (alive) setSessionStatus("unauthenticated");
          return;
        }

        const s = await getSession();
        if (!alive) return;

        if (s?.user) {
          setSessionUser(s.user);
          setSessionStatus("authenticated");
        } else {
          setSessionStatus("unauthenticated");
        }
      } catch {
        if (alive) setSessionStatus("unauthenticated");
      }
    })();

    return () => { alive = false; };
  }, [mounted]);

  const verify = React.useCallback(async () => {
    setError(null);
    setChecking(true);

    try {
      const trimmedKey = adminKey.trim();

      // Logic check: Must have a key or a session
      if (!trimmedKey && sessionStatus !== "authenticated") {
        setError("Authority required: provide admin key or sign in.");
        setChecking(false);
        return;
      }

      // Persist key to sessionStorage for subsequent API calls in this tab
      if (trimmedKey) {
        sessionStorage.setItem("inner_circle_admin_key", trimmedKey);
      }

      // 150ms "thinking" delay for security feel and to ensure storage is set
      await new Promise(r => setTimeout(r, 150));
      
      // Traditional redirect to the Inner Circle dashboard
      window.location.href = "/admin/inner-circle";
    } catch (e) {
      setError("Handshake failed. Verify network policy.");
      setChecking(false);
    }
  }, [adminKey, sessionStatus]);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <>
      <Head>
        <title>Terminal | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-black text-white selection:bg-amber-500/30 flex items-center justify-center px-6 py-16">
        <Card>
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.45em] text-zinc-500">
                Directorate Terminal
              </div>
              <h1 className="mt-3 text-3xl font-serif italic tracking-tight text-white">Administrative Access</h1>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-sm">
                Secure gateway for Inner Circle oversight and Intelligence Brief management.
                Enter credentials to initiate handshake.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Status</div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest">
                {sessionStatus === "loading" ? (
                  <span className="text-zinc-600 animate-pulse">Scanning…</span>
                ) : sessionStatus === "authenticated" ? (
                  <span className="text-emerald-400">Identity Confirmed</span>
                ) : (
                  <span className="text-amber-400">Identity Pending</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="space-y-3">
              <label className="block text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Security Token (Admin Key)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verify()}
                placeholder="x-inner-circle-admin-key"
                className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-xs font-mono text-amber-200 placeholder:text-zinc-800 focus:border-amber-500/50 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between">
              {sessionStatus === "authenticated" ? (
                <div className="text-[10px] font-mono text-zinc-500 uppercase">
                  Operator: <span className="text-emerald-500/80">{sessionUser?.email || "verified_admin"}</span>
                </div>
              ) : (
                <div className="text-[10px] font-mono text-zinc-600 uppercase">
                  Session: Unauthenticated
                </div>
              )}
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-mono text-rose-300 leading-relaxed">
                <span className="font-bold mr-2 text-rose-500">[ERROR]</span> {error}
              </div>
            ) : null}

            <div className="pt-2">
              <Btn onClick={verify} disabled={checking}>
                {checking ? "Negotiating..." : "Execute Handshake"}
              </Btn>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-700">
                System: Stable / Production
              </div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-800">
                2026.IC.DIR
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminIndexPage;