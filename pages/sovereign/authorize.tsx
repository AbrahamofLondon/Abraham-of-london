/* pages/sovereign/authorize.tsx — SOVEREIGN SESSION UNLOCK (CANONICAL) */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useOGRStore } from "@/store/useOGRStore";
import { OGR_CLIENT_CONFIG } from "@/lib/ogr/client-config";
import {
  ShieldAlert,
  Lock,
  Loader2,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import Layout from "@/components/Layout";

function getSafeReturnTo(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "/dashboard";
  if (raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  return raw;
}

export default function SovereignAuthorize() {
  const router = useRouter();
  const { returnTo } = router.query;

  const [key, setKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authenticate, isAuthenticated } = useOGRStore();

  const destination = getSafeReturnTo(returnTo);

  useEffect(() => {
    if (isAuthenticated) {
      void router.push(destination);
    }
  }, [isAuthenticated, router, destination]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const ok = await authenticate(key);

      if (ok) {
        await router.push(destination);
        return;
      }

      setError("AUTH_GATE_REJECTED: Invalid Sovereign Key");
    } catch (err) {
      console.error("[SOVEREIGN_AUTHORIZE_ERROR]", err);
      setError("SYSTEM_PROTOCOL_ERROR: Connection Failure");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout title="Sovereign Authorization" className="bg-white">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4 border-l-4 border-black pl-8 py-2">
            <div className="flex items-center gap-3 text-[#8A6A2F]">
              <Fingerprint className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Protocol {OGR_CLIENT_CONFIG.protocolVersion}
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-[0.9] text-black">
              Elevate to <br /> <span className="text-[#8A6A2F]">Sovereign</span>{" "}
              Tier
            </h1>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest leading-relaxed max-w-[280px]">
              Additional cryptographic clearance required to access the OGR
              Intelligence Registry.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 flex justify-between">
                Sovereign Access Key
                <Lock className="w-3 h-3" />
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="INST-KEY-••••••••"
                disabled={isProcessing}
                autoComplete="off"
                className="w-full bg-neutral-50 border border-neutral-200 px-5 py-5 text-sm font-mono tracking-[0.2em] focus:outline-none focus:border-[#8A6A2F] focus:ring-1 focus:ring-[#8A6A2F]/20 transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-4 bg-red-50 text-red-600 p-5 border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span className="text-[10px] font-black uppercase leading-tight tracking-tight">
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || !key.trim()}
              className="w-full bg-black text-white py-5 flex items-center justify-center gap-3 hover:bg-[#8A6A2F] transition-all disabled:bg-neutral-200 group relative overflow-hidden"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                    Initialize Session
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-neutral-100 text-center">
            <p className="text-[9px] text-neutral-400 uppercase tracking-[0.3em] italic">
              Telemetry node: London_Central // Port: 443
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}