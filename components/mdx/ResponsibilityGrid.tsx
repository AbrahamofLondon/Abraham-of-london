// components/mdx/ResponsibilityGrid.tsx
import * as React from "react";

interface ResponsibilityGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsibilityGrid({
  children,
  className = "",
}: ResponsibilityGridProps) {
  return (
    <div
      className={[
        "my-10 grid grid-cols-1 gap-6",
        "md:grid-cols-3",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}