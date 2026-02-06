/* components/Admin/KeyManagement.tsx */
import React, { useState } from 'react';
import { Key, ShieldAlert, RefreshCcw, Trash2, Copy, Check } from 'lucide-react';

interface KeyRecord {
  id: string;
  keySuffix: string;
  status: 'active' | 'revoked';
  expiresAt: string;
  tier: string;
}

export const KeyManagement: React.FC<{ memberId: string; initialKeys: KeyRecord[] }> = ({ memberId, initialKeys }) => {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const issueNewKey = async () => {
    // Hits the lib/auth/key-generator.ts logic via API
    const res = await fetch('/api/admin/issue-key', {
      method: 'POST',
      body: JSON.stringify({ memberId, tier: 'inner-circle-elite' })
    });
    const data = await res.json();
    setNewKey(data.rawKey);
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 mt-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-white font-bold text-lg uppercase tracking-tighter flex items-center gap-2">
            <Key className="text-amber-500" size={18} /> Institutional Access Keys
          </h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase">Cryptographic_Identity_Registry</p>
        </div>
        <button 
          onClick={issueNewKey}
          className="bg-amber-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={14} /> Issue New Key
        </button>
      </div>

      {newKey && (
        <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in zoom-in-95 duration-300">
          <p className="text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest">New 256-Bit Key Generated</p>
          <div className="flex items-center gap-4">
            <code className="flex-1 bg-black p-3 rounded-lg text-amber-200 font-mono text-sm break-all">
              {newKey}
            </code>
            <button 
              onClick={() => { navigator.clipboard.writeText(newKey); setCopied(true); }}
              className="p-3 bg-amber-500 text-black rounded-lg"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="mt-3 text-[9px] text-amber-500/70 uppercase font-mono italic">
            * Security Warning: This key is shown only once. If lost, it must be revoked and re-issued.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className={`h-2 w-2 rounded-full ${k.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div>
                <p className="text-xs font-bold text-white uppercase font-mono">****-****-****-{k.keySuffix}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{k.tier} // Expires: {new Date(k.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button className="p-2 text-zinc-600 hover:text-rose-500 transition-colors">
              <ShieldAlert size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};