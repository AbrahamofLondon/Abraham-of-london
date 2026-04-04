"use client";

import React, { useState } from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { OGR_CLIENT_CONFIG } from "@/lib/ogr/client-config";
import { ShieldAlert, Lock, Loader2, ChevronRight } from "lucide-react";

export function LoginView() {
  const [key, setKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const authenticate = useOGRStore((state) => state.authenticate);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const success = await authenticate(key);
      if (!success) {
        setError("AUTH_GATE_REJECTED: Invalid Sovereign Key");
      }
    } catch (err) {
      setError("SYSTEM_PROTOCOL_ERROR: Connection Failure");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* INSTITUTIONAL HEADER */}
        <div className="space-y-2 border-l-4 border-black pl-6 py-2">
          <div className="flex items-center gap-2 text-[#8A6A2F]">
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Protocol {OGR_CLIENT_CONFIG.protocolVersion}
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
            Sovereign <br /> Intelligence
          </h1>
        </div>

        {/* AUTH FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Enter Access Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              disabled={isProcessing}
              className="w-full bg-neutral-50 border border-neutral-200 px-4 py-4 text-sm font-mono tracking-widest focus:outline-none focus:border-black transition-colors disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 border border-red-100 animate-in fade-in slide-in-from-top-1">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-black uppercase leading-tight tracking-tight">
                {error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !key}
            className="w-full bg-black text-white py-4 flex items-center justify-center gap-2 hover:bg-[#8A6A2F] transition-all disabled:bg-neutral-200 group"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Authorize Session</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-[9px] text-neutral-400 uppercase tracking-widest text-center leading-relaxed italic">
          Access is monitored. Unauthorized telemetry injection will trigger node isolation.
        </p>
      </div>
    </div>
  );
}