// components/LoadingSpinner.tsx
import * as React from "react";

export interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "md",
  className,
}) => {
  const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className ?? ""}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium text-gray-400">{message}</p>
      ) : null}
    </div>
  );
};

export default LoadingSpinner;
