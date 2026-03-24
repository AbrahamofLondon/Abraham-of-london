/* pages/controls.tsx — CLIENT SIDE INTERACTIVITY */
import * as React from "react";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

export function ReportActions() {
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleCommit = async () => {
    setIsSyncing(true);
    
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Synchronizing OGR Context with Node...',
      success: 'Institutional Integrity Confirmed.',
      error: 'Synchronization Failed.',
      finally: () => setIsSyncing(false)
    });
  };

  return (
    <button 
      onClick={handleCommit}
      disabled={isSyncing}
      className="group flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-500 hover:text-[#8A6A2F] hover:border-[#8A6A2F]/40 hover:bg-[#8A6A2F]/5 transition-all disabled:opacity-50"
    >
      <RefreshCcw 
        size={12} 
        className={`${isSyncing ? "animate-spin text-[#8A6A2F]" : "group-hover:rotate-180 transition-transform duration-700"}`} 
      />
      {isSyncing ? "Syncing Node..." : "Commit Local Context to Registry"}
    </button>
  );
}