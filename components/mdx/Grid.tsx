// components/mdx/Grid.tsx
import * as React from "react";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
}

const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  gap = "md",
  align = "stretch",
  className = "",
  ...props
}) => {
  const gridColumns = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapSize = {
    none: "gap-0",
    sm: "gap-3",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-10",
  };

  const alignItems = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={`grid ${gridColumns[columns]} ${gapSize[gap]} ${alignItems[align]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Grid;

