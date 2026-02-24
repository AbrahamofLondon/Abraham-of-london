'use client';

// import { actionSyncVault } from '@/lib/pdf/generate-server'; 
import { useState } from 'react';

export function VaultSyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    // Logic temporarily disabled to fix build integrity
    console.warn("Vault Sync is currently disabled in this build configuration.");
    alert("Vault Sync is currently being refactored for Netlify Compatibility.");
    
    /* const result = await actionSyncVault({ quality: 'enterprise' });
    if (result.success) {
      alert(`Vault Synchronized!\nSaved: ${result.stats?.savings}`);
    } else {
      alert(`Error: ${result.error}`);
    } 
    */
    setLoading(false);
  };

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="bg-gold text-black px-4 py-2 rounded font-bold disabled:opacity-50"
    >
      {loading ? 'SYNCHRONIZING VAULT...' : 'REBUILD PRODUCTION VAULT (DISABLED)'}
    </button>
  );
}