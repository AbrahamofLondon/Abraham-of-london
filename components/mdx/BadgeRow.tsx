// components/BadgeRow.tsx
import * as React from "react";

export interface BadgeRowProps {
  children: React.ReactNode;
  className?: string;
  justify?: "start" | "center" | "end" | "between" | "around";
  gap?: "sm" | "md" | "lg";
}

/**
 * BadgeRow - Horizontal container for badges with consistent spacing
 * Usage in MDX: <BadgeRow><Badge>Tag1</Badge><Badge>Tag2</Badge></BadgeRow>
 */
const BadgeRow: React.FC<BadgeRowProps> = ({
  children,
  className = "",
  justify = "start",
  gap = "md",
  ...rest
}) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };

  const gapClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  return (
    <div
      className={[
        "flex flex-wrap items-center",
        justifyClasses[justify],
        gapClasses[gap],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
};

export default BadgeRow;
