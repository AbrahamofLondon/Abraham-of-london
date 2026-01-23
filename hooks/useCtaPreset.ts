/**
 * hooks/useCtaPreset.ts - FIXED WITH CORRECT IMPORTS
 */
import { useMemo } from "react";

// CORRECT IMPORTS based on your cta-presets.tsx
import {
  getCtaPreset,
  searchPresets,  // This is a FUNCTION
  type CTAPreset,
  type CTAKey,
} from "@/components/mdx/cta-presets";

export function useCtaPreset(presetKey?: CTAKey | string) {
  const preset = useMemo(() => {
    if (!presetKey) return null;
    return getCtaPreset(presetKey as CTAKey);
  }, [presetKey]);

  const featuredItems = useMemo(() => {
    if (!presetKey || typeof presetKey !== "string") return [];
    // If getFeaturedItems is also exported, import it above
    // For now, check if preset has featured items
    if (preset?.featured) {
      return [preset.featured];
    }
    return [];
  }, [presetKey, preset]);

  const isEmpty = useMemo(() => {
    if (!preset) return true;
    const { reads, downloads, actions, related, featured } = preset;
    return (
      !reads?.length &&
      !downloads?.length &&
      !actions?.length &&
      !related?.length &&
      !featured
    );
  }, [preset]);

  return {
    preset,
    featuredItems,
    isEmpty,
    exists: !!preset,
  };
}

export function useCtaSearch(query: string) {
  return useMemo(() => {
    // CORRECT: searchPresets is a function from named exports
    return searchPresets(query);
  }, [query]);
}