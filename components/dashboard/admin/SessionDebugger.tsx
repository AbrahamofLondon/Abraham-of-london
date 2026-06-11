import * as React from "react";
import { Shield, Zap, Key, Fingerprint } from "lucide-react";

interface SessionDebuggerProps {
  aol: any;
}

export function SessionDebugger({ aol }: SessionDebuggerProps) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mt-8 p-6 bg-black/40 border border-[#D4AF37]/20 rounded-xl font-mono text-[10px] overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-[#D4AF37]/10 pb-2">
        <Zap className="h-3 w-3 text-[#D4AF37]" />
        <span className="text-[#D4AF37] uppercase tracking-widest font-bold">Directorate Session Debugger</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-zinc-500 uppercase">Access Matrix</p>
          <ul className="space-y-1">
            <li className="flex justify-between">
              <span>Tier:</span>
              <span className="text-white">{aol?.tier}</span>
            </li>
            <li className="flex justify-between">
              <span>Inner Circle:</span>
              <span className={aol?.innerCircleAccess ? "text-green-500" : "text-red-500"}>
                {aol?.innerCircleAccess ? "TRUE" : "FALSE"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Allow Private:</span>
              <span className={aol?.allowPrivate ? "text-green-500" : "text-red-500"}>
                {aol?.allowPrivate ? "TRUE" : "FALSE"}
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-zinc-500 uppercase">Identity Hash</p>
          <div className="bg-zinc-900 p-2 rounded border border-white/5 break-all text-zinc-400">
            {aol?.emailHash || "NO_HASH_DETECTED"}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-white/5">
        <p className="text-zinc-600 italic">Target: Strategic Intelligence Repository // Node: EWEST_2</p>
      </div>
    </div>
  );
}