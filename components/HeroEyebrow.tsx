// components/HeroEyebrow.tsx
import React from "react";

interface HeroEyebrowProps {
  children?: React.ReactNode;
  className?: string;
}

export default function HeroEyebrow({ 
  children, 
  className = "" 
}: HeroEyebrowProps) {
  return (
    <div className={`heroeyebrow ${className}`}>
      {children}
    </div>
  );
}
