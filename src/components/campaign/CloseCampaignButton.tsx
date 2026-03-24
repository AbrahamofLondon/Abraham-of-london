// src/components/campaign/CloseCampaignButton.tsx
"use client"

import { useTransition } from "react";
import { closeCampaignAndGenerateReport } from "@/app/actions/campaign-actions";
import { toast } from "sonner"; // Or your preferred toast library

export function CloseCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    const confirmed = confirm("Are you sure? This will finalize the scores and generate the Executive Brief.");
    
    if (!confirmed) return;

    startTransition(async () => {
      const result = await closeCampaignAndGenerateReport(campaignId);
      
      if (result.success) {
        toast.success(result.message);
        // Optional: window.open(result.reportUrl, '_blank');
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleClose}
      disabled={isPending}
      className="bg-slate-900 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-all hover:bg-slate-800"
    >
      {isPending ? "Generating Intelligence Brief..." : "Close Campaign & Generate PDF"}
    </button>
  );
}