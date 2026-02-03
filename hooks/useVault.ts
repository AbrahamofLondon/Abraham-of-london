import { useState, useEffect } from 'react';

export function useVault(slug: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchAsset() {
      try {
        setLoading(true);
        const response = await fetch(`/api/vault/${slug}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to access Vault');

        setData(result.asset);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [slug]);

  return { data, loading, error };
}