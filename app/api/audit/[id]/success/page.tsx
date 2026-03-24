import Link from "next/link";
import { ShieldCheck, CheckCircle2, Lock, ArrowRight } from "lucide-react";

export default function AuditSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FCFAF7] text-neutral-800 font-serif flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-neutral-200 bg-white p-10 relative overflow-hidden">
        
        {/* Decorative Element */}
        <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-neutral-100 rotate-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-12 h-12 border border-neutral-300 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-neutral-500" />
            </div>
          </div>

          <h1 className="text-xl font-light tracking-tight text-neutral-800 mb-3">
            Telemetry Stabilized
          </h1>
          
          <p className="text-xs text-neutral-500 leading-relaxed mb-8">
            Your response has been recorded. The link between your identity and this data point has been removed.
          </p>

          {/* Verification */}
          <div className="w-full border border-neutral-100 bg-neutral-50 p-5 mb-8 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Status</span>
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-600">Completed</span>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Anonymity</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-2.5 h-2.5 text-neutral-400" />
                <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">Verified</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-400">Integrity</span>
              <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-600">Confirmed</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <Link 
              href="/"
              className="group w-full py-3 border border-neutral-300 text-neutral-700 text-[8px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:border-neutral-400 transition-all"
            >
              Exit Session
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-2 h-2 text-neutral-400" />
              <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400">Sovereign OGR</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}