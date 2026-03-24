'use client';

import React, { useState } from 'react';
import { ChevronRight, Shield, Zap, Circle } from 'lucide-react';

interface Question {
  id: string;
  domain: string;
  text: string;
}

const QUESTIONS: Question[] = [
  { id: 'q1', domain: 'Strategic Alignment', text: "The current quarterly objectives are visible and actionable within my daily workflow." },
  { id: 'q2', domain: 'Operational Velocity', text: "Internal bureaucracy does not impede my ability to execute primary directives." },
  { id: 'q3', domain: 'Cultural Resonance', text: "The organization's public-facing intent matches my internal experience." }
];

export function PulseTerminal() {
  const [step, setStep] = useState(0);
  const [resonance, setResonance] = useState(50);
  const [complete, setComplete] = useState(false);

  const currentQuestion = QUESTIONS[step];

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      setResonance(50); // Reset for next metric
    } else {
      setComplete(true);
    }
  };

  if (complete) {
    return (
      <div className="bg-black text-white p-12 border border-[#8A6A2F]/30 text-center space-y-6">
        <Zap className="w-12 h-12 text-[#8A6A2F] mx-auto animate-pulse" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">Transmission Successful</h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          Your resonance has been integrated into the Institutional Baseline.
        </p>
        <div className="pt-6 border-t border-white/10">
          <span className="text-[8px] font-mono text-neutral-600 italic">Reference: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-neutral-200 shadow-2xl overflow-hidden font-sans">
      {/* HEADER: SYSTEM STATUS */}
      <div className="bg-neutral-50 p-6 border-b border-neutral-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#8A6A2F]" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Secure Protocol: Active</span>
        </div>
        <div className="flex gap-1">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`w-8 h-1 ${i <= step ? 'bg-black' : 'bg-neutral-200'}`} />
          ))}
        </div>
      </div>

      {/* QUESTION LAYER */}
      <div className="p-12 space-y-12">
        <div>
          <p className="text-[10px] font-black text-[#8A6A2F] uppercase tracking-widest mb-2">{currentQuestion.domain}</p>
          <h2 className="text-3xl font-black tracking-tighter leading-tight text-black">
            {currentQuestion.text}
          </h2>
        </div>

        {/* RESONANCE SLIDER */}
        <div className="space-y-6">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <span>Dissonance</span>
            <span>Resonance</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={resonance}
            onChange={(e) => setResonance(parseInt(e.target.value))}
            className="w-full h-1 bg-neutral-100 appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between items-center pt-4">
            <span className="text-4xl font-black text-black">{resonance}%</span>
            <button 
              onClick={handleNext}
              className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#8A6A2F] transition-all"
            >
              Confirm <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER: ANONYMITY ASSURANCE */}
      <div className="bg-black p-4 flex justify-center items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
          End-to-End Encryption Verified • Identity Scrubbed
        </span>
      </div>
    </div>
  );
}