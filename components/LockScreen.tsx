// components/LockScreen.tsx

import React, { useState } from 'react';
import { useInnerCircle } from '@/hooks/use-inner-circle';
import { Lock, Key, ShieldCheck, Loader2 } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { unlock, isLoading } = useInnerCircle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setError('Please enter your access key.');
      return;
    }

    const result = await unlock(inputValue.trim());
    if (!result.success) {
      setError(result.message || 'Invalid access credentials.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
            <Lock className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Kingdom Vault Access
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            This content is reserved for the Inner Circle. Please enter your unique access key to proceed.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              placeholder="Enter Access Key"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-neutral-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 focus:outline-none transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Unlock Content <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-neutral-400">
            Lost your key? Contact the administrator for verification.
          </p>
        </div>
      </div>
    </div>
  );
};
