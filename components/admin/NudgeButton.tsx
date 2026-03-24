'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Or your preferred toast lib

export function NudgeButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);

  const handleNudge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/nudge`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.ok) {
        toast.success(`Nudge complete: ${data.summary.sent} emails sent.`);
      } else {
        toast.error(data.error || "Failed to send nudges.");
      }
    } catch (err) {
      toast.error("Network error during nudge execution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleNudge}
      disabled={loading}
      className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#8A6A2F] disabled:opacity-50 transition-all flex items-center gap-2"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      Batch Nudge (Incomplete Only)
    </button>
  );
}