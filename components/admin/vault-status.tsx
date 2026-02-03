import React, { useState } from 'react';
import IntelDashboard from '../../components/admin/IntelDashboard';
import Head from 'next/head';

export default function AdminVaultPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [input, setInput] = useState('');

  const checkAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic: Sovereign simple check (replace 'AbeVault2026' with your key)
    if (input === 'AbeVault2026') {
      setIsAuthorized(true);
    } else {
      alert('Unauthorized access attempt logged.');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
        <Head><title>Institutional Access Required</title></Head>
        <form onSubmit={checkAuth} className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
          <h2 className="text-xl font-bold mb-6 text-center tracking-tight">Abraham of London Vault Access</h2>
          <input 
            type="password" 
            placeholder="Institutional Key" 
            className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition-colors">
            Authorize Entry
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <Head><title>Portfolio Intel Dashboard | Abraham of London</title></Head>
      <IntelDashboard />
    </>
  );
}