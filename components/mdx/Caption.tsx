// components/Caption.tsx
import * as React from "react";

export interface CaptionProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md";
}

/**
 * Caption - Image captions and small explanatory text
 * Usage in MDX: <Caption>Photo description</Caption>
 */
const Caption: React.FC<CaptionProps> = ({
  children,
  className = "",
  align = "center",
  size = "sm",
  ...rest
}) => {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const sizeClasses = {
    sm: "text-[0.75rem]",
    md: "text-[0.8rem]",
  };

  return (
    <figcaption
      className={[
        "mt-2 italic text-gray-500",
        alignClasses[align],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </figcaption>
  );
};

export default Caption;