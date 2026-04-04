'use client';

import { useState } from 'react';
import { Send, BarChart3, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignActionsProps {
  campaignId: string;
  variant?: 'header' | 'sidebar';
  disabled?: boolean;
}

/**
 * CAMPAIGN ACTIONS PROTOCOL
 * Facilitates node stimulation (Nudges) and final data aggregation (Snapshots).
 */
export function CampaignActions({ 
  campaignId, 
  variant = 'header', 
  disabled = false 
}: CampaignActionsProps) {
  const [loading, setLoading] = useState<'nudge' | 'report' | null>(null);

  /**
   * TRIGGER NUDGE: Dispatches targeted communications to nodes with status 'invited' or 'opened'.
   */
  const handleNudge = async () => {
    setLoading('nudge');
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/nudge`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(`Integrity maintained: ${data.count} nudges deployed.`);
      } else {
        toast.error(data.message || "Nudge execution failed.");
      }
    } catch (err) {
      toast.error("Network disruption during nudge deployment.");
    } finally {
      setLoading(null);
    }
  };

  /**
   * GENERATE SNAPSHOT: Synthesizes resonance data into a high-fidelity intelligence brief.
   */
  const handleGenerateReport = async () => {
    if (disabled) {
      toast.error("Discretionary Guard: Anonymity threshold not yet reached.");
      return;
    }
    
    setLoading('report');
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/report`);
      const data = await res.json();
      
      if (res.ok && data.ok) {
        toast.success("Executive Snapshot ready for review.");
        // Logic: Redirect to generated PDF or view
        if (data.url) window.open(data.url, '_blank');
      } else {
        toast.error(data.error || "Failed to generate snapshot.");
      }
    } catch (err) {
      toast.error("Analytics engine reported a connection error.");
    } finally {
      setLoading(null);
    }
  };

  // HEADER VARIANT: Deployed in the top registry navigation
  if (variant === 'header') {
    return (
      <button 
        onClick={handleNudge}
        disabled={!!loading}
        className="px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#8A6A2F] disabled:opacity-50 transition-all flex items-center gap-2 border border-black shadow-sm active:scale-95 group"
      >
        {loading === 'nudge' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        )}
        Batch Nudge (Incomplete)
      </button>
    );
  }

  // SIDEBAR VARIANT: Deployed within the Live Resonance (Black) Card
  return (
    <button 
      onClick={handleGenerateReport}
      disabled={!!loading || disabled}
      className={`w-full py-4 border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-3
        ${disabled 
          ? 'border-white/10 text-white/20 cursor-not-allowed bg-transparent' 
          : 'border-[#8A6A2F] text-[#8A6A2F] hover:bg-[#8A6A2F] hover:text-white bg-white/5 shadow-inner'
        }
      `}
    >
      {loading === 'report' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : disabled ? (
        <Lock className="w-3 h-3 opacity-50" />
      ) : (
        <BarChart3 className="w-3 h-3" />
      )}
      {disabled ? 'Snapshot Locked' : 'Generate Executive Snapshot'}
    </button>
  );
}