// components/blog/HeroEyebrow.tsx
import * as React from "react";

interface HeroEyebrowProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export default function HeroEyebrow({ children, className = "", ...props }: HeroEyebrowProps) {
  return (
    <div 
      className={`mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 ${className}`}
      {...props}
    >
      {children || 'Blog Post'}
    </div>
  );
}