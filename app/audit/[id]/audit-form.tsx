'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Fingerprint, 
  Lock, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function AuditForm({ participantId }: { participantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resonance, setResonance] = useState<number>(5);
  const [certainty, setCertainty] = useState<number>(5);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState('Standby');

  useEffect(() => {
    if (loading) {
      const statuses = ['Scrubbing ID...', 'Anonymizing Metadata...', 'Encrypting Node...', 'Transmitting...'];
      let i = 0;
      const interval = setInterval(() => {
        setEncryptionStatus(statuses[i % statuses.length]);
        i++;
      }, 600);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    if (!isConfirmed) {
      toast.error("Please confirm the Integrity Disclosure.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/audit/${participantId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resonance, certainty })
      });

      if (res.ok) {
        toast.success("Telemetry Node Stabilized");
        router.push(`/audit/${participantId}/success`);
      } else {
        throw new Error("Validation Failed");
      }
    } catch (error) {
      toast.error("Network Latency: Link dropped. Retrying...");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 font-serif">
      
      {/* Privacy Status */}
      <div className="bg-neutral-50 border border-neutral-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fingerprint className={`w-3 h-3 ${loading ? 'text-neutral-500' : 'text-neutral-400'}`} />
          <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">
            {loading ? encryptionStatus : 'Identity Decoupled'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Lock className="w-2.5 h-2.5 text-neutral-400" />
          <EyeOff className="w-2.5 h-2.5 text-neutral-400" />
        </div>
      </div>

      {/* Resonance Input */}
      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-sm font-medium tracking-tight text-neutral-700 mb-0.5">
              1. Resonance Alignment
            </h3>
            <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">
              Strategic Congruence
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-light tracking-tight text-neutral-800 tabular-nums">{resonance}</span>
            <span className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">Score</span>
          </div>
        </div>
        <input 
          type="range" min="1" max="10" step="1"
          value={resonance}
          onChange={(e) => setResonance(parseInt(e.target.value))}
          className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-neutral-500"
        />
        <div className="flex justify-between text-[6px] font-mono uppercase tracking-wider text-neutral-400">
          <span>Dissonance</span>
          <span>Resonance</span>
        </div>
      </div>

      {/* Certainty Input */}
      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-sm font-medium tracking-tight text-neutral-700 mb-0.5">
              2. Certainty Coefficient
            </h3>
            <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">
              Data Fidelity
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-light tracking-tight text-neutral-800 tabular-nums">{certainty}</span>
            <span className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider">Index</span>
          </div>
        </div>
        <input 
          type="range" min="1" max="10" step="1"
          value={certainty}
          onChange={(e) => setCertainty(parseInt(e.target.value))}
          className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-neutral-500"
        />
        <div className="flex justify-between text-[6px] font-mono uppercase tracking-wider text-neutral-400">
          <span>Low Signal</span>
          <span>High Signal</span>
        </div>
      </div>

      {/* Integrity Disclosure */}
      <div className={`p-5 border transition-all ${isConfirmed ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-200 bg-transparent'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 w-3 h-3 accent-neutral-500 border-neutral-300"
          />
          <div className="space-y-1">
            <p className="text-[8px] font-mono uppercase tracking-wider text-neutral-700">
              Integrity Confirmation
            </p>
            <p className="text-[7px] leading-relaxed text-neutral-500">
              My response is anonymous and will be used solely for institutional resonance mapping.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !isConfirmed}
        className="group relative w-full py-4 bg-neutral-800 text-white text-[9px] font-mono uppercase tracking-wider overflow-hidden transition-all hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          Finalize
          <ShieldCheck className="w-3 h-3" />
        </span>
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
            <Loader2 className="w-3 h-3 animate-spin mr-2" />
            <span className="text-[7px]">{encryptionStatus}</span>
          </div>
        )}
      </button>

      {/* System Log */}
      <div className="flex items-center gap-1.5 justify-center">
        <AlertCircle className="w-2 h-2 text-neutral-400" />
        <span className="text-[6px] font-mono text-neutral-400 uppercase tracking-wider">
          End-to-End Encrypted
        </span>
      </div>
    </div>
  );
}