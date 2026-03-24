'use client';

import { useState } from 'react';
import { SendHorizontal, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export function NudgeButton({ participantId }: { participantId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onNudge = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns/nudge`, {
        method: 'POST',
        body: JSON.stringify({ participantId })
      });

      if (!res.ok) throw new Error();
      
      setSent(true);
      toast.success("Nudge dispatched successfully");
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      toast.error("Failed to send nudge");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onNudge}
      disabled={loading || sent}
      className={`p-2 transition-all ${
        sent ? 'text-green-600' : 'text-neutral-400 hover:text-black hover:bg-neutral-100'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : sent ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <SendHorizontal className="w-3.5 h-3.5" />
      )}
    </button>
  );
}