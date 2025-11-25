// components/Divider.tsx

import * as React from "react";

/**
 * Divider - A simple, elegant, theme-aware separator component.
 * This is often imported in MDX files for thematic breaks.
 */
const Divider: React.FC<{ className?: string }> = ({ className = "" }) => (
  // Use theme-aware colors and soft gold accent for elegance
  <div className={`relative my-16 h-px w-full ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-softGold/50 to-transparent" />
  </div>
);

export default Divider;