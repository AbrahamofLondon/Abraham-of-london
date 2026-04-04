/* components/admin/governance/sovereign-key-auth.tsx */

'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, X } from 'lucide-react';

interface SovereignKeyAuthProps {
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SovereignKeyAuth({ actionLabel, onConfirm, onCancel }: SovereignKeyAuthProps) {
  const [keyCode, setKeyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const REQUIRED_KEY = "SOVEREIGN-ALIGN-2026"; // In prod, this is a dynamic checksum

  const handleAuth = () => {
    if (keyCode === REQUIRED_KEY) {
      setIsVerifying(true);
      setTimeout(() => onConfirm(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#0A0A0A] border border-white/10 p-12 text-center relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A6A2F] to-transparent" />
        
        <Lock className="w-12 h-12 text-[#8A6A2F] mx-auto mb-8 opacity-50" />
        
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
          Final Authorization
        </h3>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em] mb-8">
          Executing: <span className="text-white">{actionLabel}</span>
        </p>

        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text"
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
              placeholder="ENTER SOVEREIGN KEY"
              className="w-full bg-white/5 border border-white/10 px-6 py-4 text-center text-sm font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[#8A6A2F] transition-all"
              disabled={isVerifying}
            />
            {keyCode === REQUIRED_KEY && !isVerifying && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onCancel}
              className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 border border-white/5 hover:bg-white/5 transition-all"
            >
              Abort Action
            </button>
            <button 
              onClick={handleAuth}
              disabled={keyCode !== REQUIRED_KEY || isVerifying}
              className={`py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                keyCode === REQUIRED_KEY 
                  ? 'bg-white text-black hover:bg-neutral-200' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isVerifying ? "Verifying..." : "Confirm Protocol"} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="mt-8 text-[8px] font-mono text-neutral-700 uppercase tracking-widest">
          Auth-Ref: MD5-HASH-{new Date().getFullYear()}-AXOL
        </p>
      </div>
    </div>
  );
}