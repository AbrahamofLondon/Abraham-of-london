'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Transition } from 'framer-motion';
import { Terminal, Shield, ArrowRight, Loader2, Lock } from 'lucide-react';
import { useClientRouter, useClientQuery, useClientIsReady } from '@/lib/router/useClientRouter';

/**
 * PERMANENT TS FIX:
 * Framer Motion expects `ease` to be:
 * - a named easing (string), OR
 * - an EasingFunction, OR
 * - a cubic-bezier tuple typed as [number, number, number, number]
 *
 * Your build fails because `ease: [..]` is inferred as `number[]`.
 * We force a tuple type here.
 */
type CubicBezier = [number, number, number, number];

const TRANSITION: Transition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1] as CubicBezier, // ✅ tuple, not number[]
};

export default function StrategyRoomForm() {
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();

  const [mounted, setMounted] = useState(false);
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
      { label: 'Operational Sovereignty', reasoning: '', weight: 3 },
    ],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!router) return;
    setLoading(true);

    try {
      // 1. Submit to Primary Registry (Neon Database)
      const res = await fetch('/api/strategy-room/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Submission failed');

      // 2. Trigger Strategy Analysis Engine
      await fetch('/api/strategy-room/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId: data.intakeId, payload: formData }),
      });

      router.push(`/strategy-room/success?id=${data.intakeId}`);
    } catch (err) {
      console.error('Transmission Interrupted', err);
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch & ensure router is ready
  if (!mounted || !isReady) {
    return (
      <div className="max-w-2xl mx-auto bg-black border border-zinc-900 p-12 rounded-3xl h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-amber-500/20" size={32} />
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Initialising_Secure_Session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TRANSITION}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-black to-amber-500/5 p-12"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Lock size={120} className="text-amber-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
            <Terminal className="text-amber-500" size={20} />
            <div>
              <span className="text-white block uppercase tracking-[0.3em] text-xs font-bold">System_Intake_v2.0</span>
              <span className="text-zinc-500 block text-[9px] uppercase tracking-tighter mt-1">
                Classification: Institutional_Alpha
              </span>
            </div>
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] text-amber-500/70 uppercase">Principal_Identity</label>
                  <input
                    type="text"
                    placeholder="FULL NAME"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500/50 focus:bg-white/10 outline-none transition-all font-mono"
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    value={formData.fullName}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[10px] text-amber-500/70 uppercase">
                    Institutional_Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="ORGANISATION"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500/50 focus:bg-white/10 outline-none transition-all font-mono"
                    onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                    value={formData.organisation}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.fullName || !formData.organisation}
                className="group flex items-center gap-3 text-amber-500 hover:text-amber-400 uppercase text-[11px] font-bold tracking-widest pt-4 disabled:opacity-30 transition-all"
              >
                Proceed to Risk Assessment <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] text-amber-500/70 uppercase">External_Dependency</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500/50"
                    onChange={(e) => setFormData({ ...formData, dependencyLevel: e.target.value })}
                    value={formData.dependencyLevel}
                  >
                    <option value="low" className="bg-zinc-900 text-white">
                      LOW (Autonomous)
                    </option>
                    <option value="medium" className="bg-zinc-900 text-white">
                      MEDIUM (Standard)
                    </option>
                    <option value="high" className="bg-zinc-900 text-white">
                      HIGH (Reliance)
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[10px] text-amber-500/70 uppercase">Market_Volatility</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-amber-500/50"
                    onChange={(e) => setFormData({ ...formData, volatility: e.target.value })}
                    value={formData.volatility}
                  >
                    <option value="stable" className="bg-zinc-900 text-white">
                      STABLE
                    </option>
                    <option value="high" className="bg-zinc-900 text-white">
                      HIGH_FRICTION
                    </option>
                    <option value="extreme" className="bg-zinc-900 text-white">
                      STRUCTURAL_PIVOT
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-5 rounded-xl uppercase text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                  {loading ? 'Processing_Strategic_Gravity...' : 'Finalize_Dossier_Submission'}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-center mt-4 text-zinc-500 hover:text-zinc-300 text-[9px] uppercase tracking-widest transition-colors"
                >
                  ← Return to Identity Verification
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}