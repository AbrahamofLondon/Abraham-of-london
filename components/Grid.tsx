// components/Grid.tsx
import * as React from "react";

interface GridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Generic responsive grid.
 * Default: 1 col on mobile, 2 on md, 3 on xl.
 */
export default function Grid({ children, className = "" }: GridProps) {
  return (
    <div
      className={`
        grid
        grid-cols-1
        gap-8
        sm:grid-cols-2
        xl:grid-cols-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}