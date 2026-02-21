/* components/StrategyRoom/IntakeForm.tsx — BULLETPROOF (Router-Safe) */
import React, { useState } from 'react';
import { Terminal, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useClientRouter, useClientQuery, useClientIsReady } from '@/lib/router/useClientRouter';

export default function StrategyRoomIntake() {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  const [mounted, setMounted] = React.useState(false);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    organisation: '',
    dependencyLevel: 'medium',
    volatility: 'stable',
    readinessScore: 5,
    decisions: [
      { label: 'Capital Allocation', reasoning: '', weight: 3 },
      { label: 'Operational Sovereignty', reasoning: '', weight: 3 }
    ]
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Early return during SSR/prerender
  if (!mounted || !router) {
    return (
      <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 p-8 font-mono text-zinc-400">
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
          <Terminal className="text-amber-500" size={20} />
          <span className="text-white uppercase tracking-[0.3em] text-xs">System_Intake_v2.0</span>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-zinc-700">Initializing secure connection...</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Initial record creation
      const res = await fetch('/api/strategy-room/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const { intakeId } = await res.json();

      // 2. Trigger the Decision Engine Analysis built in the previous step
      await fetch('/api/strategy-room/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId, payload: formData }),
      });

      router.push(`/strategy-room/success?id=${intakeId}`);
    } catch (err) {
      console.error("Transmission Interrupted", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 p-8 font-mono text-zinc-400">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
        <Terminal className="text-amber-500" size={20} />
        <span className="text-white uppercase tracking-[0.3em] text-xs">System_Intake_v2.0</span>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <label className="block text-[10px] uppercase mb-2">Principal_Identity</label>
            <input 
              type="text" 
              placeholder="FULL NAME"
              className="w-full bg-black border border-zinc-800 p-3 text-white focus:border-amber-500 outline-none transition-colors"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase mb-2">Institutional_Affiliation</label>
            <input 
              type="text" 
              placeholder="ORGANISATION"
              className="w-full bg-black border border-zinc-800 p-3 text-white focus:border-amber-500 outline-none transition-colors"
              onChange={(e) => setFormData({...formData, organisation: e.target.value})}
            />
          </div>
          <button 
            onClick={() => setStep(2)}
            className="flex items-center gap-2 text-amber-500 hover:text-amber-400 uppercase text-xs font-bold pt-4"
          >
            Proceed to Risk Assessment <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase mb-2">External_Dependency</label>
              <select 
                className="w-full bg-black border border-zinc-800 p-3 text-white outline-none"
                onChange={(e) => setFormData({...formData, dependencyLevel: e.target.value})}
              >
                <option value="low">LOW (Autonomous)</option>
                <option value="medium">MEDIUM (Standard)</option>
                <option value="high">HIGH (Critical Vendor Reliance)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase mb-2">Market_Volatility</label>
              <select 
                className="w-full bg-black border border-zinc-800 p-3 text-white outline-none"
                onChange={(e) => setFormData({...formData, volatility: e.target.value})}
              >
                <option value="stable">STABLE</option>
                <option value="high">HIGH_FRICTION</option>
                <option value="extreme">STRUCTURAL_PIVOT</option>
              </select>
            </div>
          </div>
          
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-4 uppercase text-xs flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
            {loading ? "Calculating_Gravity..." : "Finalize_Dossier_Submission"}
          </button>
        </div>
      )}
    </div>
  );
}