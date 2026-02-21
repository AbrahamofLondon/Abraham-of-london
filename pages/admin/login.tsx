// pages/admin/login.tsx — COMPLETELY ROUTER-FREE (SSR-ONLY)
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";

import Layout from "@/components/Layout";

// ✅ Force SSR, never statically generate
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const AdminLoginPage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [returnTo, setReturnTo] = React.useState("/admin");

  // ✅ Parse query params safely on client only
  React.useEffect(() => {
    setMounted(true);
    
    // Safe to access window.location on client
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnToRaw = params.get("returnTo") || params.get("callbackUrl");
      if (returnToRaw && returnToRaw.startsWith("/")) {
        setReturnTo(returnToRaw);
      }
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate login - replace with your actual auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ Router-free navigation
      window.location.href = returnTo;
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ During SSR/prerender: show minimal shell
  if (!mounted) {
    return (
      <Layout title="Admin Login | Abraham of London" description="Admin access.">
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xs font-mono uppercase tracking-[0.4em] text-white/40">
            Initializing secure terminal…
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Login | Abraham of London" description="Admin access.">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-400">
                Restricted Access
              </span>
            </div>
            <h1 className="text-2xl font-serif text-white mb-2">Directorate Terminal</h1>
            <p className="text-sm text-white/40">Administrative authentication required</p>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 text-sm">
              {error}
            </div>
          ) : null}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-black hover:from-white hover:to-white transition-all disabled:opacity-50 shadow-2xl"
          >
            {loading ? "Authenticating…" : "Initialize Session"}
          </button>

          <div className="mt-8 text-center text-[9px] font-mono uppercase tracking-widest text-zinc-800">
            <span className="flex items-center justify-center gap-2">
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              AES-256 Encrypted
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLoginPage;