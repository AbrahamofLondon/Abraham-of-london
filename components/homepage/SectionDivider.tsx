import * as React from "react";

type Props = {
  tight?: boolean;
  className?: string;
  id?: string;
  label?: string; // New: optional technical label for the divider
};

export default function SectionDivider({ 
  tight = false, 
  className = "", 
  id,
  label = "SYS-CHECK-OK"
}: Props) {
  return (
    <div id={id} className={`bg-black overflow-hidden ${className}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${tight ? "py-10" : "py-20"}`}>
        <div className="relative flex items-center">
          
          {/* 1. The Main Track (The "Canon" Line) */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {/* 2. The Animated Pulse (The "Active" Signal) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1/3 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent animate-pulse-horizontal" />
          </div>

          {/* 3. The Technical Label (High-Signal Aesthetic) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-black">
              <span className="flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-1 w-1 rounded-full bg-amber-500"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">
                {label}
              </span>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-horizontal {
          0% { transform: translateX(-150%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(150%); opacity: 0; }
        }
        .animate-pulse-horizontal {
          animation: pulse-horizontal 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}