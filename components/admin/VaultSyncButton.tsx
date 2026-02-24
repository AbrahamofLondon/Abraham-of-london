// components/admin/VaultSyncButton.tsx
'use client';

import { actionSyncVault } from '@/lib/pdf/generate-server';
import { useState } from 'react';

export function VaultSyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const result = await actionSyncVault({ quality: 'enterprise' });
    
    if (result.success) {
      alert(`Vault Synchronized!\nSaved: ${result.stats?.savings}`);
    } else {
      alert(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="bg-gold text-black px-4 py-2 rounded font-bold disabled:opacity-50"
    >
      {loading ? 'SYNCHRONIZING VAULT...' : 'REBUILD PRODUCTION VAULT'}
    </button>
  );
}