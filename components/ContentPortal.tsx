// components/ContentPortal.tsx
'use client';

import { 
  getCategorySummary, 
  LIBRARY_AESTHETICS, 
  SEASONAL_CURATIONS,
  CONTENT_CATEGORIES 
} from '@/lib/content';

export function ContentPortal() {
  const categories = getCategorySummary();
  
  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${LIBRARY_AESTHETICS.colors.primary.lapis}15 0%, ${LIBRARY_AESTHETICS.colors.primary.parchment} 100%)`,
        fontFamily: 'serif'
      }}
    >
      {/* Entrance Portal */}
      <div className="relative border-y" 
        style={{ 
          borderColor: LIBRARY_AESTHETICS.colors.primary.saffron,
        