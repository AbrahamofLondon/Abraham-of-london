// components/InnerCircleBadge.tsx
import * as React from "react";
import clsx from "clsx";

export type InnerCircleBadgeProps = {
  accessLevel?: string | null;
  className?: string;
  size?: "sm" | "md";
};

const InnerCircleBadge: React.FC<InnerCircleBadgeProps> = ({
  accessLevel,
  className,
  size = "sm",
}) => {
  if (accessLevel !== "inner-circle") return null;

  const base =
    "inline-flex items-center rounded-full border border-yellow-500/70 bg-yellow-500/10 text-yellow-300 font-semibold tracking-wide";
  const sizing =
    size === "md" ? "px-3 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";

  return (
    <span className={clsx(base, sizing, className)}>
      <span className="mr-1">✦</span>
      Inner Circle
    </span>
  );
};

export default InnerCircleBadge;
