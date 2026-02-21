// components/mdx/Step.tsx
import * as React from "react";

interface StepProps {
  number?: number;
  children: React.ReactNode;
  className?: string;
}

export default function Step({ number, children, className = "" }: StepProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {number && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm">
          {number}
        </div>
      )}
      <div className="flex-1 text-white/70 leading-relaxed [&_p]:my-0">
        {children}
      </div>
    </div>
  );
}