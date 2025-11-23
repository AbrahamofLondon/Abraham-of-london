// hooks/useCtaPreset.ts
import { useMemo } from 'react';
import { 
  getCtaPreset, 
  type CTAPreset, 
  type CTAKey,
  getFeaturedItems,
  searchPresets 
} from '@/components/mdx/cta-presets';

export function useCtaPreset(presetKey?: CTAKey | string) {
  const preset = useMemo(() => {
    if (!presetKey) return null;
    return getCtaPreset(presetKey);
  }, [presetKey]);

  const featuredItems = useMemo(() => {
    if (!presetKey || typeof presetKey !== 'string') return [];
    return getFeaturedItems(presetKey as CTAKey);
  }, [presetKey]);

  const isEmpty = useMemo(() => {
    if (!preset) return true;
    const { reads, downloads, actions, related, featured } = preset;
    return !reads?.length && !downloads?.length && !actions?.length && !related?.length && !featured;
  }, [preset]);

  return {
    preset,
    featuredItems,
    isEmpty,
    exists: !!preset
  };
}

export function useCtaSearch(query: string) {
  return useMemo(() => {
    return searchPresets(query);
  }, [query]);
}