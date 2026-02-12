import React, { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, ArrowRight, Fingerprint, AlertCircle } from "lucide-react";
import Head from "next/head";

/**
 * DIRECTORATE TERMINAL (Login Page)
 * Located at: /pages/admin/login.tsx
 * Purpose: Secure entry point for the Abraham of London Inner Circle.
 *
 * Redirect strategy:
 * - proxy.ts sends users here with ?returnTo=/some/path
 * - We accept returnTo (preferred) OR callbackUrl (legacy) but never nest them.
 */

function sanitizeLocalPath(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  if (!input) return fallback;

  let v = input;
  try {
    v = decodeURIComponent(v);
  } catch {
    // ignore bad encoding
  }

  // Only allow site-local paths. No full URLs.
  if (!v.startsWith("/")) return fallback;

  // Strip recursive params that cause loops
  try {
    const u = new URL(v, "http://local");
    u.searchParams.delete("callbackUrl");
    u.searchParams.delete("returnTo");
    return `${u.pathname}${u.search}`;
  } catch {
    return v;
  }
}

export default function LoginTerminal() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const destination = useMemo(() => {
    const rt = router.query.returnTo ?? router.query.callbackUrl;
    return sanitizeLocalPath(rt, "/inner-circle/dashboard");
  }, [router.query.returnTo, router.query.callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: destination, // NextAuth expects callbackUrl here
    });

    if (result?.error) {
      setStatus("error");
      setErrorMessage("Identity verification failed. Access denied.");
      return;
    }

    setStatus("success");

    const next = sanitizeLocalPath(result?.url ?? destination, destination);
    setTimeout(() => router.replace(next), 600);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans selection:bg-gold/30">
      <Head>
        <title>Access Terminal | Abraham of London</title>
      </Head>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/assets/noise.png')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex p-3 rounded-full border border-gold/10 bg-gold/5 mb-6">
            <ShieldCheck className="w-6 h-6 text-gold" />
          </motion.div>
          <h1 className="font-serif text-4xl italic text-white tracking-tighter mb-2">Directorate Terminal</h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-600">Secure Entry Protocol Required</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
          <AnimatePresence>
            {status === "loading" && (
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute top-0 left-0 h-[1px] bg-gold z-20" />
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-[8px] uppercase tracking-widest text-zinc-500 ml-1">Identity_Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors font-sans"
                placeholder="director@abrahamoflondon.org"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[8px] uppercase tracking-widest text-zinc-500 ml-1">Security_Passcode</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 transition-colors font-sans"
                placeholder="••••••••••••"
              />
            </div>

            <AnimatePresence>
              {status === "error" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 text-red-500 text-[10px] font-mono uppercase tracking-widest">
                  <AlertCircle size={12} /> {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={status === "loading"}
              type="submit"
              className="w-full group flex items-center justify-between bg-white/5 border border-white/10 px-6 py-4 hover:bg-gold hover:text-black transition-all duration-500 disabled:opacity-50"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
                {status === "loading" ? "Verifying..." : "Initialize_Access"}
              </span>
              {status === "loading" ? (
                <Fingerprint className="w-4 h-4 animate-pulse" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-zinc-700">
            <Lock size={10} />
            <span className="font-mono text-[8px] uppercase tracking-widest">AES-256 Encrypted</span>
          </div>
          <div className="text-zinc-800 font-mono text-[8px] uppercase tracking-tighter">Node: LON_SEC_01</div>
        </div>
      </motion.div>
    </div>
  );
}