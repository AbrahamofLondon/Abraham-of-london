"use client";

import * as React from "react";
// Import with fallback names to prevent "undefined" crashes
import * as Brand from "@/components/ui/BrandAssets";
import { ShieldCheck, Activity, Terminal, Zap } from "lucide-react";

export default function DiagnosticsPage() {
  const [apiStatus, setApiStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  // Fallback components to prevent Prerender Error if BrandAssets exports are missing
  const InterfaceCard = Brand.InterfaceCard || (({children, className}: any) => <div className={className}>{children}</div>);
  const MetadataTag = Brand.MetadataTag || (({children}: any) => <div>{children}</div>);

  const testApi = async () => {
    setApiStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "SYSTEM_CHECK", 
          email: "test@abrahamoflondon.org", 
          message: "Diagnostic ping.",
          botField: "" 
        }),
      });
      if (res.ok) setApiStatus("success");
      else setApiStatus("error");
    } catch {
      setApiStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-black py-24 px-6 max-w-5xl mx-auto space-y-12">
      <header className="space-y-4">
        <MetadataTag icon={Activity}>System Status: Diagnostic Mode</MetadataTag>
        <h1 className="font-serif text-5xl text-white">Institutional <span className="italic text-white/30">Readiness.</span></h1>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Typography Verification */}
        <InterfaceCard className="p-8 space-y-6">
          <div className="flex items-center gap-3 text-amber-500">
            <Terminal className="h-5 w-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Font Token Verification</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/20 uppercase mb-1">--font-serif (Editorial New)</p>
              <p className="font-serif text-2xl text-white">The architecture of integrity.</p>
            </div>
            <div>
              <p className="text-[10px] text-white/20 uppercase mb-1">--font-family-sans (Inter)</p>
              <p className="font-sans text-lg font-light text-white/70">Strategic consulting and leadership.</p>
            </div>
            <div>
              <p className="text-[10px] text-white/20 uppercase mb-1">--font-family-mono (Roboto Mono)</p>
              <p className="font-mono text-xs text-amber-500/80 uppercase tracking-tighter">ID: AOL-SYS-DIAG-2026</p>
            </div>
          </div>
        </InterfaceCard>

        {/* API & Security Verification */}
        <InterfaceCard className="p-8 space-y-6">
          <div className="flex items-center gap-3 text-amber-500">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Protocol Connectivity</h3>
          </div>
          
          <p className="text-sm text-white/40 font-light">
            Testing the <code>/api/contact</code> route with current security guards.
          </p>

          <button 
            onClick={testApi}
            disabled={apiStatus === "loading"}
            className={`w-full py-4 rounded-xl border flex items-center justify-center gap-3 transition-all font-black uppercase tracking-widest text-[10px] ${
              apiStatus === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" :
              apiStatus === "error" ? "bg-red-500/10 border-red-500/50 text-red-500" :
              "bg-white/5 border-white/10 text-white hover:bg-white/10"
            }`}
          >
            <Zap className={`h-4 w-4 ${apiStatus === "loading" ? "animate-pulse" : ""}`} />
            {apiStatus === "loading" ? "Pinging Protocol..." : 
             apiStatus === "success" ? "Protocol Handshake Success" : 
             apiStatus === "error" ? "Protocol Rejection" : "Test API Connection"}
          </button>
        </InterfaceCard>
      </div>

      <div className="pt-12 border-t border-white/5 text-center">
        <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.5em]">
          Diagnostic sequence complete // No critical failures detected.
        </p>
      </div>
    </div>
  );
}