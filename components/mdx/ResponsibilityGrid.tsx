// components/mdx/ResponsibilityGrid.tsx
import * as React from "react";

interface ResponsibilityGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsibilityGrid({ children, className = "" }: ResponsibilityGridProps) {
  return (
    <div className={`my-12 grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}