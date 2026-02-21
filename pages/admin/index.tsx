/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/index.tsx — SSR-ONLY (Export-Safe, Routerless, No Layout) */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";

// ✅ Prevent next export from trying to prerender this route.
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
      className="w-full rounded-2xl bg-amber-500 px-6 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-black hover:bg-amber-400 transition-all disabled:opacity-40"
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

  React.useEffect(() => setMounted(true), []);

  // ✅ Client-only session load (no next-auth import during SSR/export)
  React.useEffect(() => {
    if (!mounted) return;

    let alive = true;

    (async () => {
      try {
        const mod: any = await import("next-auth/react");
        const getSession = mod?.getSession as (() => Promise<any>) | undefined;

        if (!getSession) {
          if (alive) {
            setSessionUser(null);
            setSessionStatus("unauthenticated");
          }
          return;
        }

        const s = await getSession();
        if (!alive) return;

        if (s?.user) {
          setSessionUser(s.user);
          setSessionStatus("authenticated");
        } else {
          setSessionUser(null);
          setSessionStatus("unauthenticated");
        }
      } catch {
        if (alive) {
          setSessionUser(null);
          setSessionStatus("unauthenticated");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [mounted]);

  const verify = React.useCallback(async () => {
    setError(null);
    setChecking(true);
    try {
      // Optional: verify admin key against your API if you have one.
      // If not, we just gate navigation client-side.
      if (!adminKey.trim() && sessionStatus !== "authenticated") {
        setError("Authority required: provide admin key or sign in.");
        return;
      }

      // Navigate without next/router:
      window.location.href = "/admin/inner-circle";
    } catch {
      setError("Verification failed (network / policy).");
    } finally {
      setChecking(false);
    }
  }, [adminKey, sessionStatus]);

  return (
    <>
      <Head>
        <title>Admin | Abraham of London</title>
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
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
                Static export has no router mount. Admin is runtime only — as it should be.  
                Enter your admin key or authenticate to proceed.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Status</div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest">
                {sessionStatus === "loading" ? (
                  <span className="text-zinc-600">Checking…</span>
                ) : sessionStatus === "authenticated" ? (
                  <span className="text-emerald-400">Authenticated</span>
                ) : (
                  <span className="text-amber-400">Key Required</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <label className="block text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">
              Admin Key (optional if signed in)
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="x-inner-circle-admin-key"
              className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-xs font-mono text-amber-200 placeholder:text-zinc-800 focus:border-amber-500/50 outline-none transition-all"
            />

            {sessionStatus === "authenticated" ? (
              <div className="text-xs text-zinc-500">
                Signed in as <span className="text-zinc-300">{sessionUser?.email || sessionUser?.name || "admin"}</span>.
              </div>
            ) : (
              <div className="text-xs text-zinc-600">
                Not signed in. Provide an admin key to proceed.
              </div>
            )}

            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="pt-2">
              <Btn onClick={verify} disabled={checking}>
                {checking ? "Verifying…" : "Enter Admin Console"}
              </Btn>
            </div>

            <div className="pt-6 border-t border-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-700">
              Note: This route is SSR-only. If you try to export it, Next will rightly refuse.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminIndexPage;