// components/AdminRevokeButton.tsx

import React, { useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface RevokeProps {
  accessKey: string; // The raw key or hash you wish to revoke
}

export const AdminRevokeButton: React.FC<RevokeProps> = ({ accessKey }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inner-circle/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: accessKey,
          adminSecret: process.env.NEXT_PUBLIC_ADMIN_HINT // Ensure this matches your secure env setup
        }),
      });
      if (res.ok) alert('Vault key has been neutralized.');
    } finally {
      setLoading(false);
      setIsConfirming(false);
    }
  };

  if (!isConfirming) {
    return (
      <button 
        onClick={() => setIsConfirming(true)}
        className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <ShieldAlert className="w-4 h-4" /> Revoke Access
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-red-600 animate-pulse uppercase">Are you sure?</span>
      <button 
        onClick={handleRevoke}
        disabled={loading}
        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Revoke'}
      </button>
      <button onClick={() => setIsConfirming(false)} className="text-xs text-neutral-500">Cancel</button>
    </div>
  );
};