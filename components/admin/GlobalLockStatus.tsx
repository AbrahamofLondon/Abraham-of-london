/* components/admin/GlobalLockStatus.tsx */
import React, { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export default function GlobalLockStatus() {
  const [isLocked, setIsLocked] = useState(false);

  // Poll for system status or use a WebSocket/SWR for real-time updates
  useEffect(() => {
    const checkStatus = async () => {
      const res = await fetch("/api/system/status"); // A public-read endpoint for lock status
      const data = await res.json();
      setIsLocked(data.locked);
    };
    checkStatus();
  }, []);

  if (!isLocked) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
      <ShieldAlert className="text-rose-500" size={12} />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
        System Lockdown Active // Redirecting Non-Admin Traffic
      </span>
    </div>
  );
}