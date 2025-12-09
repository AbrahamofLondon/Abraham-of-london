// components/BrandFrame.tsx
import React from "react";

interface BrandFrameProps {
  children?: React.ReactNode;
  variant?: "default" | "bordered" | "subtle";
  className?: string;
}

export default function BrandFrame({
  children,
  variant = "default",
  className = "",
}: BrandFrameProps) {
  const baseClasses = "p-4 rounded-lg";

  const variantClasses = {
    default: "bg-white border border-gray-200",
    bordered: "border-2 border-gray-300 bg-gray-50",
    subtle: "bg-gray-50",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
