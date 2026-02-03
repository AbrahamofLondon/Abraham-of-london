import { useState, useEffect } from 'react';

export function useSovereignVault(slug: string) {
  const [asset, setAsset] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authorized' | 'error'>('loading');

  useEffect(() => {
    async function unlock() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/vault/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAsset(data.asset);
        setStatus('authorized');
      } catch (err) {
        setStatus('error');
      }
    }
    unlock();
  }, [slug]);

  return { asset, status };
}