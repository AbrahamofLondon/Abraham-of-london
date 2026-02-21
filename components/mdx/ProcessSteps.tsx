// components/mdx/ProcessSteps.tsx
import * as React from "react";

interface ProcessStepsProps {
  children: React.ReactNode;
  className?: string;
}

export default function ProcessSteps({ children, className = "" }: ProcessStepsProps) {
  return (
    <div className={`my-12 space-y-6 ${className}`}>
      {children}
    </div>
  );
}