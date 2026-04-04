/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/login.tsx — DIRECTORATE AUTHENTICATION GATEWAY */
import * as React from "react";
import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { GetServerSideProps, NextPage } from "next";
import { Shield, ArrowRight, AlertCircle, Key, Terminal } from "lucide-react";

// ✅ Force SSR, never statically generate
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const AdminLoginPage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [returnTo, setReturnTo] = React.useState("/admin");
  
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@abrahamoflondon.com";
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Parse query params safely on client
  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnToRaw = params.get("returnTo") || params.get("callbackUrl");
      if (returnToRaw && returnToRaw.startsWith("/")) {
        setReturnTo(returnToRaw);
      }
    }
  }, []);

  // Redirect if already authenticated as admin
  React.useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      router.push(returnTo);
    }
  }, [status, isAdmin, router, returnTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid credentials. Directorate access requires verification.");
        setLoading(false);
      } else {
        // Success - will redirect via useEffect
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
      setLoading(false);
    }
  };

  // SSR/prerender: show minimal shell
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-white/40">
            Initializing secure terminal…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Directorate Terminal | Abraham of London</title>
        <meta name="description" content="Administrative authentication gateway" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="relative min-h-screen bg-black">
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-[120px]" />
        </div>

        <div className="relative flex min-h-screen items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-10 text-center">
              <div className="inline-flex items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 p-3 mb-6">
                <Terminal className="h-6 w-6 text-amber-500" />
              </div>
              <h1 className="font-serif text-3xl text-white mb-2">Directorate Terminal</h1>
              <p className="text-sm text-white/40">Administrative authentication required</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <Shield className="h-3 w-3 text-amber-500" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                  Restricted Access • Authorized Personnel Only
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                  Administrative Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@abrahamoflondon.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                  Security Credentials
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:shadow-lg disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <Key className="h-3.5 w-3.5" />
                      Initialize Session
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-white/10" />
                <span className="text-[7px] font-mono uppercase tracking-[0.4em] text-zinc-800">
                  AES-256-GCM Encrypted
                </span>
                <div className="h-px w-8 bg-white/10" />
              </div>
              <p className="mt-4 text-[8px] font-mono uppercase tracking-wider text-zinc-800">
                Unauthorized access attempts are logged and monitored
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;