"use client";

import { useState } from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { OGRSuccessToast } from "@/components/ui/ogr-toast";
import { Loader2, Database } from "lucide-react";

export function ReportActions() {
  const commitReport = useOGRStore((state) => state.commitReport);
  const [isPending, setIsPending] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastId, setLastId] = useState<string | undefined>();

  const handleCommit = async () => {
    setIsPending(true);
    const result = await commitReport();
    
    if (result.success) {
      setLastId(result.id);
      setShowToast(true);
      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    }
    
    setIsPending(false);
  };

  return (
    <>
      <button
        onClick={handleCommit}
        disabled={isPending}
        className="group relative px-8 py-4 bg-black text-white overflow-hidden transition-all hover:bg-[#8A6A2F] disabled:opacity-50"
      >
        <div className="relative z-10 flex items-center gap-3">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#8A6A2F]" />
          ) : (
            <Database className="w-4 h-4 text-[#8A6A2F]" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {isPending ? "Encrypting Data..." : "Commit to Archive"}
          </span>
        </div>
      </button>

      <OGRSuccessToast 
        isVisible={showToast} 
        reportId={lastId} 
        onClose={() => setShowToast(false)} 
      />
    </>
  );
}