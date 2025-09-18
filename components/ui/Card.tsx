import * as React from "react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = true }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white shadow-card p-6 dark:bg-deepCharcoal transition",
        hover && "hover:shadow-cardHover",
        className
      )}
    >
      {children}
    </div>
  );
}
