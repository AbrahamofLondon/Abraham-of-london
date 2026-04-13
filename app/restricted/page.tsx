// app/restricted/page.tsx
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Key, Shield, AlertCircle } from 'lucide-react';

interface AuthState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function RestrictedAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('returnTo') || '/dashboard';
  
  const [accessKey, setAccessKey] = React.useState('');
  const [state, setState] = React.useState<AuthState>({
    isLoading: false,
    error: null,
    success: false
  });
  
  const [attempts, setAttempts] = React.useState(0);
  
  // Check existing session
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/sovereign');
        if (response.ok) {
          router.push(returnTo);
        }
      } catch {
        // No session, continue
      }
    };
    
    checkSession();
  }, [router, returnTo]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      setState({ isLoading: false, error: 'Authentication key required', success: false });
      return;
    }
    
    setState({ isLoading: true, error: null, success: false });
    
    try {
      const response = await fetch('/api/auth/sovereign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: accessKey, returnTo })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setState({ isLoading: false, error: null, success: true });
        setTimeout(() => router.push(data.returnTo), 500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setState({
          isLoading: false,
          error: data.error || 'Invalid authentication key',
          success: false
        });
        setAccessKey('');
      }
    } catch {
      setState({
        isLoading: false,
        error: 'Authentication service unavailable. Please try again.',
        success: false
      });
    }
  };
  
  if (state.success) {
    return (
      <div className="min-h-screen bg-[#060609] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm text-green-500">Access Granted</p>
          <p className="text-xs text-white/40 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#060609] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border border-white/10 bg-black/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg mb-4">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-xl font-light text-white mb-2">Restricted Access</h1>
            <p className="text-xs text-white/40 uppercase tracking-wider">Directorate Terminal</p>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="border border-white/10 px-3 py-1 rounded-full">
              <span className="text-xs text-white/40">AES-256 Encrypted</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Sovereign Access Key"
                className="w-full bg-transparent border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                autoFocus
                disabled={state.isLoading}
              />
            </div>
            
            {state.error && (
              <div className="border-l-2 border-red-500 bg-red-500/5 p-3">
                <p className="text-xs text-red-400">{state.error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={state.isLoading}
              className="w-full py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm uppercase tracking-wider hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {state.isLoading ? 'Verifying...' : 'Authenticate'}
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-center text-xs text-white/20">
              Authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}