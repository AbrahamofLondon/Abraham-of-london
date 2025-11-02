// components/mdx/HeroEyebrow.tsx
import * as React from 'react';

/**
 * Renders a small, uppercase text element typically used above a main title.
 */
export default function HeroEyebrow({ children }: React.PropsWithChildren) {
  return (
    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[color:var(--color-on-secondary)/0.6]">
      {children}
    </p>
  );
}